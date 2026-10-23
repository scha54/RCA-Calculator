import { readFile, stat } from "node:fs/promises";
const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8"));
const entry = Object.keys(manifest).find((key) => manifest[key].isEntry);
if (!entry) throw Error("No application entry in the build manifest");
const files = new Set();
function visit(key) {
  const chunk = manifest[key];
  if (files.has(chunk.file)) return;
  files.add(chunk.file);
  for (const dependency of chunk.imports ?? []) visit(dependency);
}
visit(entry);
let bytes = 0;
for (const file of files) bytes += (await stat("dist/" + file)).size;
const budget = 450000;
console.log(
  `Initial JavaScript: ${bytes} bytes (budget ${budget}); dynamic report/chart/export tools are loaded on demand.`,
);
if (bytes > budget) process.exitCode = 1;
