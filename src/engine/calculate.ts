import formulas from "../../data/formulas.json";
import settings from "../../data/settings.json";
import {
  parameters,
  questions,
  validate,
  type Scenario,
  type Inputs,
  type Range,
} from "./model";
// Restricted arithmetic parser; never executes scenario text or JSON as code.
export function evaluate(expression: string, inputs: Inputs): number {
  if (/[^A-Za-z_0-9.()+*/,\s\-]/.test(expression))
    throw Error("Invalid formula character");
  const tokens =
    expression.match(/[A-Za-z_][A-Za-z_0-9]*|\d*\.?\d+|[()+*/,\-]/g) || [];
  let pos = 0;
  function atom(): number {
    const t = tokens[pos++];
    if (t === "-") return -atom();
    if (t === "(") {
      const v = add();
      if (tokens[pos++] !== ")") throw Error("Missing parenthesis");
      return v;
    }
    if (t === "MAX" || t === "MIN") {
      if (tokens[pos++] !== "(") throw Error("Invalid function");
      const a = [add()];
      while (tokens[pos] === ",") {
        pos++;
        a.push(add());
      }
      if (tokens[pos++] !== ")") throw Error("Missing parenthesis");
      return t === "MAX" ? Math.max(...a) : Math.min(...a);
    }
    if (t in inputs) return inputs[t];
    if (t !== undefined && Number.isFinite(Number(t))) return Number(t);
    throw Error(`Unknown formula token ${t}`);
  }
  function mul(): number {
    let v = atom();
    while (tokens[pos] === "*" || tokens[pos] === "/") {
      const op = tokens[pos++],
        b = atom();
      v = op === "*" ? v * b : v / b;
    }
    return v;
  }
  function add(): number {
    let v = mul();
    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const op = tokens[pos++],
        b = mul();
      v = op === "+" ? v + b : v - b;
    }
    return v;
  }
  const result = add();
  if (pos !== tokens.length || !Number.isFinite(result))
    throw Error("Invalid formula result");
  return result;
}
export function range(central: number, band: number): Range {
  return { central, low: central * (1 - band), high: central * (1 + band) };
}
export function calculate(s: Scenario) {
  const errors = validate(s);
  if (errors.length) throw Error(errors.join(" "));
  const inputs = s.inputs as Inputs;
  const baseline = evaluate(formulas.baseline, inputs);
  const cells = Object.entries(formulas)
    .filter(([id]) => id !== "baseline")
    .map(([id, f]) => ({
      id,
      ...range(evaluate(f, inputs), s.bands[s.confidence[id]]),
    }));
  const central = cells.reduce((a, v) => a + v.central, 0),
    deviation =
      s.mode === "conservative"
        ? cells.reduce((a, v) => a + v.high - v.central, 0)
        : Math.sqrt(cells.reduce((a, v) => a + (v.high - v.central) ** 2, 0));
  const total = {
    central,
    low: Math.max(0, central - deviation),
    high: central + deviation,
  };
  const after = {
    central: Math.max(0, baseline - total.central),
    low: Math.max(0, baseline - total.high),
    high: Math.max(0, baseline - total.low),
  };
  const pct = (v: number) =>
    baseline > 0 ? (v / baseline) * settings.radarMaximum : 0;
  const radar = questions
    .filter((q) => q.id !== "systems")
    .map((q) => {
      const c = cells.find((c) => c.id === q.id),
        v =
          c ??
          range(
            (s.checklist.reduce((a, b) => a + b, 0) / s.checklist.length) *
              settings.radarMaximum,
            s.bands[s.confidence[q.id]],
          );
      return {
        label: `${q.effect} / ${q.column}`,
        central: Math.min(
          settings.radarMaximum,
          c ? pct(v.central) : v.central,
        ),
        low: Math.min(settings.radarMaximum, c ? pct(v.low) : v.low),
        high: Math.min(settings.radarMaximum, c ? pct(v.high) : v.high),
      };
    });
  const sys = range(
    (1 - inputs.reboundFactor) * settings.radarMaximum,
    s.bands[s.confidence.systems],
  );
  for (const c of ["Flows", "Stocks"])
    radar.push({
      label: `Systems / ${c}`,
      central: sys.central,
      low: sys.low,
      high: Math.min(settings.radarMaximum, sys.high),
    });
  return {
    baseline: range(baseline, 0),
    cells,
    total,
    after,
    radar,
    percent: {
      central: pct(total.central),
      low: pct(total.low),
      high: pct(total.high),
    },
    exceedsBaseline: total.high > baseline,
  };
}
export function sensitivity(s: Scenario) {
  const base = calculate(s);
  return parameters
    .map((p) => {
      const confidence =
          p.group === "setup"
            ? (s.baselineConfidence ?? "medium")
            : (s.confidence[p.group] ?? "low"),
        fraction = Math.max(settings.sensitivityFraction, s.bands[confidence]),
        value = (s.inputs as Inputs)[p.id],
        step =
          value === 0
            ? Math.min(p.default || (p.max - p.min) * 0.01, p.max - p.min) *
              fraction
            : value * fraction,
        low = Math.max(p.min, value - step),
        high = Math.min(p.max, value + step);
      const outputs = [low, high].map((v) =>
        calculate({ ...s, inputs: { ...s.inputs, [p.id]: v } }),
      );
      const impact = Math.max(
          ...outputs.map((o) => Math.abs(o.total.central - base.total.central)),
        ),
        widthImpact = Math.max(
          ...outputs.map((o) =>
            Math.abs(
              o.total.high - o.total.low - (base.total.high - base.total.low),
            ),
          ),
        );
      return {
        id: p.id,
        label: p.label,
        value,
        low,
        high,
        confidence,
        impact,
        widthImpact,
        score: (impact + widthImpact) * s.bands[confidence],
        share: base.total.central ? (impact / base.total.central) * 100 : 0,
      };
    })
    .sort((a, b) => b.score - a.score);
}
