// One-off local administration: use the same model validation as the browser; no server or credentials.
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
if (!process.argv[2])
  throw Error("Usage: npm run validate:scenario -- assessment.json");
const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { parseScenario } = await server.ssrLoadModule("/src/engine/model.ts");
  const text = await readFile(process.argv[2], "utf8");
  const data = JSON.parse(text);
  const records = Array.isArray(data) ? data : [data];
  if (!records.length) throw Error("Empty scenario archive");
  let invalid = 0;
  for (const [index, record] of records.entries()) {
    try {
      parseScenario(JSON.stringify(record));
    } catch {
      invalid++;
      console.error(JSON.stringify({ event: "scenario_invalid", index }));
    }
  }
  console.log(
    JSON.stringify({
      event: "scenario_validation",
      total: records.length,
      valid: records.length - invalid,
      invalid,
    }),
  );
  if (invalid) process.exitCode = 1;
} catch {
  console.error(JSON.stringify({ event: "scenario_validation_failed" }));
  process.exitCode = 1;
} finally {
  await server.close();
}
