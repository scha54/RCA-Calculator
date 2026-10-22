import {describe,it,expect} from 'vitest';
import {calculate,evaluate} from '../src/engine/calculate';
import {examples,parseScenario,type Scenario} from '../src/engine/model';
for(const example of examples){const s=example as Scenario;describe(s.name,()=>{
 it('has ordered nonnegative ranges',()=>{const r=calculate(s);for(const v of [...r.cells,r.total,r.after]){expect(v.low).toBeGreaterThanOrEqual(0);expect(v.central).toBeGreaterThanOrEqual(v.low);expect(v.high).toBeGreaterThanOrEqual(v.central)}});
 it('100% rebound removes slowing and closing',()=>{expect(calculate({...s,inputs:{...s.inputs,reboundFactor:1}}).cells.filter(c=>/closing|slowing/.test(c.id)).every(c=>c.central===0)).toBe(true)});
 it('zero substitution removes slowing',()=>{expect(calculate({...s,inputs:{...s.inputs,substitutionRate:0}}).cells.filter(c=>c.id.startsWith('slowing')).every(c=>c.central===0)).toBe(true)});
 it('flows scale with sales and stocks with participation',()=>{const a=calculate(s),b=calculate({...s,inputs:{...s.inputs,itemsSold:s.inputs.itemsSold*2}});a.cells.forEach((v,i)=>expect(b.cells[i].central).toBeCloseTo(v.central*(v.id.endsWith('Flows')?2:1)));const c=calculate({...s,inputs:{...s.inputs,itemsSold:s.inputs.itemsSold*2,participatingCustomers:s.inputs.participatingCustomers*2}});expect(c.total.central).toBeCloseTo(a.total.central*2)});
});}
it('handles zero denominators',()=>{const s=examples[0] as Scenario;const r=calculate({...s,inputs:{...s.inputs,itemsSold:0,itemsDisposedPerPersonPerYear:0}});expect(Number.isFinite(r.percent.central)).toBe(true)});
it('rejects malformed and out-of-range inputs',()=>{expect(()=>parseScenario('{}')).toThrow();expect(()=>parseScenario('broken')).toThrow();expect(()=>calculate({...examples[0],inputs:{...examples[0].inputs,reboundFactor:2}} as Scenario)).toThrow();expect(()=>evaluate('1/0',{})).toThrow()});
it('independent bounds are narrower',()=>{const s=examples[0] as Scenario;expect(calculate({...s,mode:'independent'}).total.high).toBeLessThanOrEqual(calculate(s).total.high)});
it('matches a hand calculation',()=>expect(calculate(examples[0] as Scenario).cells[0].central).toBeCloseTo(3.06));
