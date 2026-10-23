import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export async function verifyRelease(directory) {
  const root = path.resolve(directory);
  const release = JSON.parse(
    await readFile(path.join(root, "release.json"), "utf8"),
  );
  if (
    release.schemaVersion !== 1 ||
    !release.files ||
    !Object.keys(release.files).length
  )
    throw Error("Invalid release manifest");
  const actual = {};
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink())
        throw Error("Release must not contain symlinks");
      if (entry.isDirectory()) await inspect(file);
      else if (entry.isFile() && file !== path.join(root, "release.json"))
        actual[path.relative(root, file).split(path.sep).join("/")] =
          createHash("sha256")
            .update(await readFile(file))
            .digest("hex");
    }
  }
  await inspect(root);
  const sorted = Object.fromEntries(
    Object.entries(actual).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  if (
    JSON.stringify(sorted) !== JSON.stringify(release.files) ||
    createHash("sha256").update(JSON.stringify(sorted)).digest("hex") !==
      release.artifactId
  )
    throw Error("Release integrity verification failed");
  return release;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const release = await verifyRelease(process.argv[2] || "dist");
  console.log(
    JSON.stringify({
      event: "release_verified",
      artifactId: release.artifactId,
      files: Object.keys(release.files).length,
    }),
  );
}
