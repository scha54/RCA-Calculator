import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { request } from "node:http";
import { createConnection } from "node:net";
import {
  readFile,
  mkdtemp,
  cp,
  writeFile,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const exec = promisify(execFile);
const root = path.resolve(".");
function get(port, url, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: "127.0.0.1", port, path: url, method },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString(),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}
async function launch(t, cwd = root) {
  const child = spawn(
    process.execPath,
    [path.join(root, "scripts/serve.mjs")],
    {
      cwd,
      env: {
        ...process.env,
        PORT: "0",
        HOST: "127.0.0.1",
        SHUTDOWN_TIMEOUT_MS: "1000",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "",
    stderr = "";
  const events = [];
  let buffer = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      if (line) events.push(JSON.parse(line));
    }
  });
  child.stderr.on("data", (chunk) => (stderr += chunk));
  const exited = new Promise((resolve) =>
    child.once("exit", (code, signal) => resolve({ code, signal })),
  );
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await exited;
    }
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      clearInterval(poll);
      reject(Error("Server readiness timed out: " + stderr));
    }, 5000);
    const poll = setInterval(() => {
      const started = events.find((e) => e.event === "listening");
      if (started) {
        clearTimeout(timer);
        clearInterval(poll);
        resolve(started.port);
      }
    }, 10);
    child.once("exit", () => {
      clearTimeout(timer);
      clearInterval(poll);
      reject(Error("Server exited before readiness: " + stderr));
    });
  });
  return {
    child,
    port,
    events,
    exited,
    get output() {
      return output;
    },
  };
}
test("production HTTP policy, port binding, health, stateless serving and graceful shutdown", async (t) => {
  const server = await launch(t),
    second = await launch(t, tmpdir());
  assert.notEqual(server.port, second.port);
  const response = await get(server.port, "/");
  assert.equal(response.status, 200);
  assert.match(response.body, /RCA Calculator/);
  assert.match(
    response.headers["content-security-policy"],
    /script-src 'self'/,
  );
  assert.match(
    response.headers["content-security-policy"],
    /frame-ancestors 'none'/,
  );
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.equal(response.headers["cache-control"], "no-cache");
  assert.equal(response.headers["referrer-policy"], "no-referrer");
  assert.equal((await get(second.port, "/")).body, response.body);
  const release = JSON.parse((await get(server.port, "/release.json")).body);
  const health = JSON.parse((await get(server.port, "/healthz")).body);
  assert.equal(health.artifactId, release.artifactId);
  assert.equal(health.status, "ok");
  const js = Object.keys(release.files).find(
    (p) => p.startsWith("assets/") && p.endsWith(".js"),
  );
  const asset = await get(server.port, "/" + js);
  assert.equal(asset.status, 200);
  assert.match(asset.headers["content-type"], /javascript/);
  assert.match(asset.headers["cache-control"], /immutable/);
  const head = await get(server.port, "/" + js, "HEAD");
  assert.equal(head.body, "");
  assert.equal(head.headers["content-length"], asset.headers["content-length"]);
  assert.equal((await get(server.port, "/assets/missing.js")).status, 404);
  assert.equal((await get(server.port, "/%2e%2e/package.json")).status, 404);
  assert.equal((await get(server.port, "/.vite/manifest.json")).status, 404);
  assert.equal((await get(server.port, "/%ZZ")).status, 400);
  assert.equal((await get(server.port, "/", "POST")).status, 405);
  const link = path.join(root, "dist", "security-escape");
  await symlink(path.join(root, "package.json"), link);
  t.after(() => rm(link, { force: true }));
  assert.equal((await get(server.port, "/security-escape")).status, 404);
  await rm(link);
  await get(server.port, "/?scenario=PRIVATE-SCENARIO-NAME");
  server.child.kill("SIGTERM");
  assert.deepEqual(
    await server.exited,
    { code: 0, signal: null },
    JSON.stringify(server.events),
  );
  assert.equal(server.events.at(-1).event, "shutdown_complete");
  assert.equal(
    server.events.some((e) => e.event === "http_request" && e.status === 404),
    true,
  );
  assert.doesNotMatch(server.output, /PRIVATE-SCENARIO-NAME/);
});
test("release manifest detects tampering and additional files", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "rca-release-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp("dist", dir, { recursive: true });
  const verified = await exec(process.execPath, [
    "scripts/verify-release.mjs",
    dir,
  ]);
  assert.match(verified.stdout, /release_verified/);
  await writeFile(path.join(dir, "index.html"), "tampered");
  await assert.rejects(
    exec(process.execPath, ["scripts/verify-release.mjs", dir]),
    /integrity verification failed/,
  );
  await cp("dist/index.html", path.join(dir, "index.html"));
  await writeFile(path.join(dir, "unexpected.js"), "untracked code");
  await assert.rejects(
    exec(process.execPath, ["scripts/verify-release.mjs", dir]),
    /integrity verification failed/,
  );
});
test("invalid process configuration fails before accepting traffic", async () => {
  await assert.rejects(
    exec(process.execPath, ["scripts/serve.mjs"], {
      env: { ...process.env, PORT: "invalid" },
    }),
    /PORT must/,
  );
});

test("unresponsive connections have a bounded shutdown deadline", async (t) => {
  const server = await launch(t);
  const socket = createConnection({ host: "127.0.0.1", port: server.port });
  t.after(() => socket.destroy());
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });
  socket.write("GET / HTTP/1.1\r\nHost: localhost\r\n");
  await new Promise((resolve) => setTimeout(resolve, 20));
  server.child.kill("SIGTERM");
  assert.deepEqual(await server.exited, { code: 1, signal: null });
  assert.equal(
    server.events.some((e) => e.event === "shutdown_forced"),
    true,
  );
});

test("one-off administration validates records without logging assessment data", async (t) => {
  const valid = await exec(process.execPath, [
    "scripts/validate-scenario.mjs",
    "data/examples.json",
  ]);
  assert.match(valid.stdout, /"valid":4/);
  assert.equal(valid.stderr, "");
  const dir = await mkdtemp(path.join(tmpdir(), "rca-admin-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, "invalid.json");
  await writeFile(file, JSON.stringify({ name: "PRIVATE-ASSESSMENT" }));
  await assert.rejects(
    exec(process.execPath, ["scripts/validate-scenario.mjs", file]),
    (error) => {
      assert.doesNotMatch(error.stdout + error.stderr, /PRIVATE-ASSESSMENT/);
      assert.match(error.stdout, /"invalid":1/);
      return error.code === 1;
    },
  );
});
