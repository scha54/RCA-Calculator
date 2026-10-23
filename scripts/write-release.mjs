import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.resolve("dist");
const files = {};
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await inspect(file);
    else if (entry.isFile() && entry.name !== "release.json") {
      const name = path.relative(root, file).split(path.sep).join("/");
      files[name] = createHash("sha256")
        .update(await readFile(file))
        .digest("hex");
    }
  }
}
await inspect(root);
let revision =
  process.env.RELEASE_REVISION || process.env.VERCEL_GIT_COMMIT_SHA;
let dirty = null;
if (!revision) {
  try {
    revision = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    dirty = !!execFileSync("git", ["status", "--porcelain"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    revision = "unknown";
  }
}
if (revision !== "unknown" && !/^[a-f0-9]{40,64}$/i.test(revision))
  throw Error("RELEASE_REVISION must be a full Git SHA.");
const sorted = Object.fromEntries(
  Object.entries(files).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
);
const artifactId = createHash("sha256")
  .update(JSON.stringify(sorted))
  .digest("hex");
const { version } = JSON.parse(await readFile("package.json", "utf8"));
await writeFile(
  path.join(root, "release.json"),
  JSON.stringify(
    { schemaVersion: 1, version, revision, dirty, artifactId, files: sorted },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    event: "release_created",
    version,
    revision,
    dirty,
    artifactId,
    files: Object.keys(files).length,
  }),
);
