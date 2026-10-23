// Portable, read-only static serving; Vercel uses its own CDN instead of this process.
import { createServer } from "node:http";
import { open, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";
import { verifyRelease } from "./verify-release.mjs";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const { default: config } = await import("../vercel.json", {
  with: { type: "json" },
});
const root = await realpath(path.join(project, "dist"));
const release = await verifyRelease(root);
const rawPort = process.env.PORT ?? "3000";
if (!/^\d+$/.test(rawPort) || Number(rawPort) > 65535)
  throw Error("PORT must be an integer between 0 and 65535.");
const port = Number(rawPort),
  host = process.env.HOST ?? "0.0.0.0";
const rawTimeout = process.env.SHUTDOWN_TIMEOUT_MS ?? "10000";
if (
  !/^\d+$/.test(rawTimeout) ||
  Number(rawTimeout) < 1 ||
  Number(rawTimeout) > 60000
)
  throw Error("SHUTDOWN_TIMEOUT_MS must be between 1 and 60000.");
const log = (record) =>
  process.stdout.write(
    JSON.stringify({ ...record, artifactId: release.artifactId }) + "\n",
  );
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
let stopping = false;
const server = createServer(async (req, res) => {
  const start = performance.now();
  let route = "rejected";
  const requestId = randomUUID();
  for (const { key, value } of config.headers[0].headers)
    res.setHeader(key, value);
  res.setHeader("X-Request-Id", requestId);
  res.once("finish", () => {
    // close() reaps sockets idle at shutdown time. A response finishing afterwards
    // must also close its socket, rather than entering a fresh keep-alive period.
    if (stopping) req.socket.end();
    log({
      event: "http_request",
      requestId,
      method: ["GET", "HEAD"].includes(req.method) ? req.method : "OTHER",
      route,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - start),
    });
  });
  const finish = (status, text) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(req.method === "HEAD" ? undefined : text);
  };
  if (stopping) {
    res.setHeader("Connection", "close");
    return finish(503, "Shutting down\n");
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD");
    return finish(405, "Method not allowed\n");
  }
  try {
    const raw = req.url.split("?")[0];
    const pathname = decodeURIComponent(raw);
    if (pathname === "/healthz") {
      route = "health";
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "application/json");
      return res.end(
        req.method === "HEAD"
          ? undefined
          : JSON.stringify({ status: "ok", artifactId: release.artifactId }),
      );
    }
    // No SPA URL routes are used; unknown URLs stay 404, including unknown assets.
    const segments = pathname.split("/");
    if (
      !pathname.startsWith("/") ||
      segments.some((s) => s.startsWith(".")) ||
      pathname.includes("\\") ||
      pathname.includes("\0")
    )
      return finish(404, "Not found\n");
    const target = path.join(root, pathname === "/" ? "index.html" : pathname);
    const resolved = await realpath(target);
    if (!resolved.startsWith(root + path.sep))
      return finish(404, "Not found\n");
    const info = await stat(resolved);
    if (!info.isFile()) return finish(404, "Not found\n");
    route =
      pathname === "/" || pathname === "/index.html"
        ? "document"
        : pathname.startsWith("/assets/")
          ? "asset"
          : "static";
    if (route === "asset")
      res.setHeader("Cache-Control", config.headers[1].headers[0].value);
    res.setHeader(
      "Content-Type",
      mime[path.extname(resolved)] ?? "application/octet-stream",
    );
    res.setHeader("Content-Length", info.size);
    if (req.method === "HEAD") return res.end();
    const file = await open(resolved, "r");
    const stream = file.createReadStream();
    stream.on("error", () => {
      log({ event: "stream_error", requestId });
      res.destroy();
    });
    res.on("close", () => stream.destroy());
    stream.pipe(res);
  } catch (error) {
    if (error instanceof URIError) return finish(400, "Invalid URL\n");
    if (["ENOENT", "ENOTDIR"].includes(error.code))
      return finish(404, "Not found\n");
    log({ event: "serve_error", requestId });
    finish(500, "Internal server error\n");
  }
});
server.headersTimeout = 10000;
server.requestTimeout = 30000;
server.keepAliveTimeout = 5000;
server.on("error", () => {
  log({ event: "server_error" });
  process.exitCode = 1;
});
server.listen(port, host, () =>
  log({ event: "listening", port: server.address().port, host }),
);
function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  log({ event: "shutdown_started", signal });
  const timer = setTimeout(() => {
    log({ event: "shutdown_forced" });
    server.closeAllConnections();
    process.exitCode = 1;
  }, Number(rawTimeout));
  timer.unref();
  server.close(() => {
    clearTimeout(timer);
    log({ event: "shutdown_complete" });
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
