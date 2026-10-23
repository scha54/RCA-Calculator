# Methodology, units and boundaries

## Material model

Inputs and their bounds are defined in `data/parameters.json`; expressions are in `data/formulas.json`. Activities are annual, mass is converted from kg to tonnes by dividing by 1,000. The arithmetic parser accepts only named inputs, numeric literals, arithmetic, parentheses, MIN and MAX. It never evaluates JavaScript.

Baseline virgin demand is `itemsSold × avgWeightKg × (1 − baselineCollectionRate × baselineRecyclingYield) / 1000`.

Five components contribute to material savings:

- Slowing flows: affected new production × lifetime extension fraction `L / (1 + L)` × substitution × `(1 − rebound)`.
- Slowing stocks: participating customers × wardrobe size × unworn share × share activated × substitution × garment mass × `(1 − rebound)`.
- Closing flows: additional recycling relative to baseline, floored at zero, multiplied by `(1 − rebound)` and reduced by the share already displaced through slowing flows.
- Closing stocks: additional collection × recycling yield × mass × `(1 − rebound)`, reduced by wardrobe activation relative to disposed items. The overlap fraction is capped at one; zero disposal is handled explicitly by the formula's guarded denominator.
- Life-cycle flows: affected production × mass × (per-garment material efficiency + pre-consumer waste rate × manufacturing waste avoidance). This component does not use the rebound factor; rebound currently applies to slowing and closing only.

Each component receives its selected low/medium/high relative band. Default widths are 50%/25%/10%; editable bands must satisfy high ≤ medium ≤ low, each between 0 and 100%. Conservative aggregation sums absolute deviations; independent aggregation combines deviations in quadrature. These are modelling assumptions and scenario bounds, not statistically calibrated confidence intervals. Baseline is treated as a fixed point in this material calculation. Baseline input confidence controls **sensitivity perturbations**, not the material result's uncertainty bands.

Residual virgin demand is floored at zero. Material savings are not clipped, so theoretical savings above baseline remain visible with a warning. Additional production credits, described below, are capped at baseline demand to avoid claiming more avoided virgin production than the baseline contains.

Care checklist radar scores are qualitative, not tonnes of material or quantified energy savings. Systems radar scores derive from rebound; six risk notes remain qualitative. Additional worker indicators do not replace those notes or generate a composite social score. Radar axes are capped at 100 and are not a substitute for the underlying numeric results.

## Sensitivity

Each parameter is perturbed independently within its valid bounds. Its relative perturbation is the greater of 20% and its selected confidence band. Baseline/setup inputs have an explicit baseline confidence setting (legacy files default to medium). For a zero-valued parameter, use the parameter default as the reference scale, or 1% of its allowed span when the default is zero, then multiply by the perturbation fraction. Thus a zero input is not automatically classified as irrelevant.

Impact is the largest absolute change in central savings. Width impact is the largest absolute change in the aggregate interval width. The ranking score is `(impact + widthImpact) × confidenceBand`. This is a prioritisation heuristic, not a causal attribution or probability. Rankings do not yet cover the optional extended-outcome inputs.

## Additional outcome modules

All modules are optional and disabled by default. No emission or energy factors are supplied as universal defaults. Enter applicable measured activities and sourced factors for both the baseline and intervention, covering the same functional scope and year. Zero is an explicit input assumption, not evidence. Every enabled module requires source/boundary notes before final reports; record source, year, geography, uncertainty and exclusions there. The tool cannot verify source quality.

Positive **savings** mean avoided burdens; negative savings mean increased burdens. Environmental totals sum enabled modules only. Disabled modules are marked **not assessed**, not zero impact. Exclude overlaps between modules. In particular, production factors must exclude the freight and care activities entered separately, and additional process burdens must not already be counted in freight or care.

### Freight

For each baseline/intervention:

- Emissions = annual tonne-km × kg CO₂e per tonne-km.
- Energy = annual tonne-km × kWh per tonne-km.

Savings = baseline minus intervention. Include reverse logistics, differing distances, loads and transport modes in the scenario-level activity and weighted factors. Passenger travel is outside this module. Factors can include upstream fuel impacts when their boundaries are consistent.

### Care, drying and ironing

For each baseline/intervention:

- Electricity = annual wash loads × kWh/load + dryer loads × kWh/load + ironing hours × iron power (kW).
- Emissions = electricity × grid kg CO₂e/kWh.
- Water = wash loads × litres/load.

Savings = baseline minus intervention. Use aggregate annual loads for the assessed population, not garment counts, and consistently allocate shared loads. Water-supply emissions, detergents, heat from non-electric sources and wastewater impacts are excluded; record exclusions. Rebound in care is represented by the intervention's actual activity, not an additional automatic deduction.

### Production and circular processing

Credited avoided textile = minimum(material savings, baseline virgin demand), converted to kg independently at each material interval endpoint.

- Net energy saved = credited kg × avoided virgin production kWh/kg − additional circular process kWh.
- Net emissions avoided = credited kg × avoided virgin production kg CO₂e/kg − circular process kWh × process grid factor − additional non-electric process kg CO₂e.

Include repair, sorting, recycling and other incremental processes in the burdens. Use a justified virgin production displacement factor; material displacement alone does not establish carbon equivalence. Non-electric process emissions are entered directly. This module uses the material model's current substitution and overlap assumptions and does not establish a full consequential LCA.

### Workers and income

- Net employment change = FTE jobs created − FTE jobs displaced.
- Training = aggregate person-hours per year.
- Workers affected = people; this is a reach measure, not a benefit score.
- Annual aggregate wage change = intervention aggregate paid person-hours × average hourly wage − baseline equivalent.

Use the same population, period and currency (three-letter code) for both wage inputs. FTE uses the assessor's documented working-time convention. These indicators do not measure labour rights, wage adequacy, job quality, distributional effects or all societal impacts. No composite social benefit score or monetary valuation is inferred.

### Extended uncertainty

Every nonnegative activity and factor is independently varied by the configured relative uncertainty (default 25%). Products use lower×lower and upper×upper; sums add endpoints; a difference uses baseline lower minus intervention upper for the lower bound, and baseline upper minus intervention lower for the upper. This produces conservative interval bounds and preserves negative outcomes. The production credit additionally propagates the material interval; the baseline demand cap is fixed. Totals sum component bounds. Correlation, probability distributions and cross-module dependencies are not estimated. The material conservative/independent switch does not change this interval-arithmetic method.

## Validation status

Unit references independently calculate all five material contributions, overlap corrections, residuals, percentages, quadrature bounds and extended module examples. Browser checks exercise the production UI, outputs and storage. These establish implementation consistency with the documented equations, not external scientific acceptance. Domain-expert review and comparison to a validated reference LCA remain necessary before using results for public environmental claims. The bundled circular business-model PDF is contextual material, not evidence that every implemented coefficient or extension has been independently validated.
