import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execFileSync } from "node:child_process";
import pkg from "./package.json";
let revision =
  process.env.RELEASE_REVISION || process.env.VERCEL_GIT_COMMIT_SHA;
if (!revision) {
  try {
    revision = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    revision = "unknown";
  }
}
if (revision !== "unknown" && !/^[a-f0-9]{40,64}$/i.test(revision))
  throw Error("RELEASE_REVISION must be a full Git SHA.");
export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_REVISION__: JSON.stringify(revision),
  },
  build: { manifest: true },
  plugins: [react(), tailwindcss()],
});
