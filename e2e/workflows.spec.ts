import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import ExcelJS from "exceljs";
import { readFile } from "node:fs/promises";
async function step(page: Page, n: number) {
  await page.locator(`#step-nav-${n}`).click();
}
async function review(page: Page) {
  await step(page, 3);
  await page.locator("#confirm-substitutionRate").check();
  await step(page, 6);
  await page.locator("#confirm-reboundFactor").check();
}
test("complete assessment, extended outcomes, export round trips, persistence and print", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Rapid Circularity Assessment/ }),
  ).toBeVisible();
  await step(page, 8);
  await expect(page.locator("#export-excel-btn")).toBeDisabled();
  await step(page, 1);
  await page.locator("#input-itemsSold").fill("1000");
  await page
    .getByLabel("Baseline input confidence", { exact: true })
    .selectOption("high");
  await step(page, 5);
  await page.getByLabel("Model Freight transport", { exact: true }).check();
  await page
    .getByLabel("Freight transport sources", { exact: true })
    .fill(
      "Measured freight 2026 UK, outbound and returns, vehicle factor excludes production.",
    );
  await page.locator("#outcome-baselineTonneKm").fill("1000");
  await page.locator("#outcome-baselineTransportCo2").fill("0.1");
  await page.locator("#outcome-interventionTonneKm").fill("500");
  await page.locator("#outcome-interventionTransportCo2").fill("0.1");
  await review(page);
  await step(page, 7);
  await expect(
    page.getByRole("heading", {
      name: "Circularity Results & Impact Dashboard",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("row", { name: /Transport emissions avoided/ }),
  ).toContainText("50");
  await step(page, 8);
  await expect(page.locator("#export-excel-btn")).toBeEnabled();
  const jsonDownload = page.waitForEvent("download");
  await page.locator("#export-json-btn").click();
  const json = await jsonDownload;
  const path = (await json.path())!;
  const scenario = JSON.parse(await readFile(path, "utf8"));
  expect(scenario.inputs.itemsSold).toBe(1000);
  expect(scenario.outcomes.enabled.transport).toBe(true);
  const excelDownload = page.waitForEvent("download");
  await page.locator("#export-excel-btn").click();
  const excel = await excelDownload;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await excel.path())!);
  expect(workbook.worksheets).toHaveLength(6);
  expect(
    workbook.getWorksheet("Additional Outcomes")!.getCell("B4").value,
  ).toBeCloseTo(50);
  await page.locator("input[type=file]").setInputFiles(path);
  await page.reload();
  await step(page, 1);
  await expect(page.locator("#input-itemsSold")).toHaveValue("1000");
  await step(page, 8);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".report-ready")).toBeVisible();
  expect(
    await page
      .locator("header")
      .evaluate((el) => getComputedStyle(el).visibility),
  ).toBe("hidden");
  await page.emulateMedia({ media: "screen" });
  // Denied clipboard access must not claim success.
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("Denied");
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Copy Markdown", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Copy failed");
  await expect(page.getByText("Copied!", { exact: true })).toHaveCount(0);
  // Changing inputs invalidates reviewed reports.
  await step(page, 1);
  await page.locator("#input-itemsSold").fill("2000");
  await step(page, 8);
  await expect(page.locator("#export-excel-btn")).toBeDisabled();
  expect(errors).toEqual([]);
});
test("scenario creation, duplication, comparison and deletion", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#delete-scenario-btn").click();
  await page.locator("#new-scenario-btn").click();
  await expect(page.getByLabel("Active scenario")).toContainText("Scenario 3");
  await expect(page.locator("#input-itemsSold")).toHaveValue("0");
  await page.locator("#delete-scenario-btn").click();
  await page.locator("#duplicate-scenario-btn").click();
  await expect(page.getByLabel("Active scenario")).toContainText("(Copy)");
  await page.locator("#toggle-compare-btn").click();
  await expect(
    page.getByRole("heading", { name: /Scenario Comparison Matrix/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Exit Comparison" }).click();
  await page.locator("#delete-scenario-btn").click();
  await expect(
    page.getByLabel("Active scenario").locator("option"),
  ).toHaveCount(2);
});
test("malformed storage preserves original data and valid scenarios", async ({
  page,
}) => {
  await page.goto("/");
  const original = await page.evaluate(() => {
    const key = "rca_calculator_scenarios_v1";
    const values = JSON.parse(localStorage.getItem(key)!);
    const text = JSON.stringify([values[0], { ...values[1], notes: [null] }]);
    localStorage.setItem(key, text);
    return text;
  });
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("1 invalid saved");
  await expect(
    page.getByLabel("Active scenario").locator("option"),
  ).toHaveCount(1);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("rca_calculator_scenarios_v1"),
    ),
  ).toBe(original);
});
test("mobile workflow has no page overflow and no serious accessibility violations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const findings: unknown[] = [];
  for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
    await step(page, n);
    if (n === 7)
      await expect(
        page.getByRole("heading", {
          name: "Circularity Results & Impact Dashboard",
        }),
      ).toBeVisible();
    if (n === 8)
      await expect(
        page.getByRole("heading", { name: "Export Assessment & Reports" }),
      ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page }).analyze();
    findings.push(
      ...result.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({
          step: n,
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
    );
  }
  expect(findings).toEqual([]);
});

test("invalid imports and failed Excel downloads produce actionable errors", async ({
  page,
}) => {
  await page.goto("/");
  await step(page, 8);
  await page.locator("input[type=file]").setInputFiles({
    name: "malformed.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"notes":[null]}'),
  });
  await expect(page.getByRole("alert").last()).toContainText(
    "valid RCA scenario",
  );
  await review(page);
  await step(page, 8);
  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw Error("Download storage unavailable");
    };
  });
  await page.locator("#export-excel-btn").click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Download storage unavailable" }),
  ).toBeVisible();
  await expect(page.locator("#export-excel-btn")).toBeEnabled();
});

test("all additional model editors are accessible on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await step(page, 5);
  for (const name of [
    "Freight transport",
    "Washing, drying & ironing",
    "Production & circular processing",
    "Employment & worker outcomes",
  ]) {
    await page.getByLabel("Model " + name, { exact: true }).check();
    await page
      .getByLabel(name + " sources", { exact: true })
      .fill(
        "Measured annual activities, factor evidence and common boundary, 2026 UK.",
      );
  }
  await page.locator("#outcome-jobsCreated").fill("5");
  await page.locator("#outcome-jobsDisplaced").fill("2");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await review(page);
  await step(page, 7);
  await expect(
    page.getByRole("row", { name: /Net employment change/ }),
  ).toContainText("3");
  await page.locator("#toggle-compare-btn").click();
  await expect(
    page.getByRole("heading", { name: "Additional outcome comparison" }),
  ).toBeVisible();
  await expect(
    page.getByRole("row", { name: /Net employment change/ }),
  ).toContainText("Not assessed");
});

test("production headers allow calculation and exports without CSP violations", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { csp: string[] }).csp = [];
    window.addEventListener("securitypolicyviolation", (e) =>
      (window as unknown as { csp: string[] }).csp.push(e.violatedDirective),
    );
  });
  const response = await page.goto("/");
  expect(response!.headers()["content-security-policy"]).toContain(
    "script-src 'self'",
  );
  const release = await page.request.get("/release.json");
  expect(release.ok()).toBe(true);
  expect((await release.json()).artifactId).toMatch(/^[a-f0-9]{64}$/);
  await review(page);
  await step(page, 7);
  await expect(
    page.getByRole("heading", {
      name: "Circularity Results & Impact Dashboard",
    }),
  ).toBeVisible();
  await step(page, 8);
  const download = page.waitForEvent("download");
  await page.locator("#export-excel-btn").click();
  await download;
  expect(
    await page.evaluate(() => (window as unknown as { csp: string[] }).csp),
  ).toEqual([]);
});

test("lazy loading failure provides recovery without clearing stored assessments", async ({
  page,
}) => {
  const diagnostics: string[] = [];
  page.on("console", (message) => {
    if (message.text().startsWith('{"event":'))
      diagnostics.push(message.text());
  });
  await page.goto("/");
  const original = await page.evaluate(() =>
    localStorage.getItem("rca_calculator_scenarios_v1"),
  );
  await page.route("**/assets/ResultsStep-*.js", (route) => route.abort());
  await step(page, 7);
  await expect(
    page.getByRole("heading", {
      name: "The calculator could not display this screen",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("rca_calculator_scenarios_v1"),
    ),
  ).toBe(original);
  expect(
    diagnostics.some((line) => JSON.parse(line).event === "render_failure"),
  ).toBe(true);
  expect(
    diagnostics.every(
      (line) => !line.includes("Clothing rental") && !line.includes("inputs"),
    ),
  ).toBe(true);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download saved assessments" })
    .click();
  const backup = await download;
  expect(await readFile((await backup.path())!, "utf8")).toBe(original);
  await page.unroute("**/assets/ResultsStep-*.js");
  await page.getByRole("button", { name: "Reload application" }).click();
  await expect(
    page.getByRole("heading", { name: /Rapid Circularity Assessment/ }),
  ).toBeVisible();
});
