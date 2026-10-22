import parameters from '../../data/parameters.json';
import questions from '../../data/questions.json';
import benchmarks from '../../data/benchmarks.json';
import bands from '../../data/confidence.json';
import examples from '../../data/examples.json';
export {parameters,questions,benchmarks,bands,examples};
export type Confidence=keyof typeof bands;
export type Scenario=Omit<typeof examples[number],'confidence'|'mode'|'region'|'notes'> & {confidence:Record<string,Confidence>;mode:'conservative'|'independent';region:'UK'|'EU'|'US';notes:Array<{text:string;risk:'low'|'medium'|'high'}>};
export type Inputs=Record<string,number>;
export type Range={central:number;low:number;high:number};
export function fresh():Scenario{const s=structuredClone(examples[0]) as Scenario;s.name='Untitled assessment';s.confirmed={substitutionRate:false,reboundFactor:false};return s;}
export function validate(s:Scenario):string[]{const errors:string[]=[];
 if(!s||s.version!==1||typeof s.name!=='string'||typeof s.description!=='string'||!['UK','EU','US'].includes(s.region)||!['conservative','independent'].includes(s.mode))return ['Please choose a valid RCA scenario (version 1).'];
 for(const p of parameters){const v=(s.inputs as Inputs)?.[p.id];if(typeof v!=='number'||!Number.isFinite(v)||v<p.min||v>p.max)errors.push(`${p.label}: enter a number between ${p.min} and ${p.max}.`);}
 for(const q of questions)if(!Object.keys(bands).includes(s.confidence?.[q.id]))errors.push(`Choose confidence for ${q.effect} / ${q.column}.`);
 for(const k of Object.keys(bands) as Confidence[])if(!Number.isFinite(s.bands?.[k])||s.bands[k]<0||s.bands[k]>1)errors.push('Uncertainty bands must be between 0 and 1.');
 if(!Array.isArray(s.checklist)||s.checklist.length!==3||s.checklist.some(v=>![0,.5,1].includes(v)))errors.push('Please complete the care checklist.');
 if(!Array.isArray(s.notes)||s.notes.length!==6||s.notes.some(n=>typeof n.text!=='string'||!['low','medium','high'].includes(n.risk)))errors.push('Please provide valid Systems notes.');
 if(typeof s.confirmed?.substitutionRate!=='boolean'||typeof s.confirmed?.reboundFactor!=='boolean')errors.push('Please confirm substitution and rebound assumptions.');return errors;}
export function parseScenario(text:string):Scenario{let s:Scenario;try{s=JSON.parse(text)}catch{throw Error('This file is not valid JSON.')}const e=validate(s);if(e.length)throw Error(e.join(' '));return s;}
