import pairs from './language-pairs.json';
import {languageCatalog,supportedLanguages} from './reference-data';
const aliases:Record<string,string>={csharp:'C#','c++':'C++','vb.net':'VB.NET','objective-c':'Objective-C',objective_c:'Objective-C',matlab:'MATLAB',fsharp:'F#',shell:'Bash',visualbasic:'Visual Basic',visualbasicnet:'VB.NET'};
export const observedPairs=pairs;
export function languageFromSlug(slug:string){const alias=aliases[slug];if(alias&&supportedLanguages.includes(alias))return alias;return languageCatalog.find(([name,icon])=>icon===slug||name.toLowerCase().replaceAll(' ','-')===slug)?.[0]??supportedLanguages.find(n=>n.toLowerCase()===slug)??null;}
export function resolvePair(slug:string){if(!pairs.includes(slug))return null;const [from,to]=slug.replace(/-converter$/,'').split('-to-');const source=languageFromSlug(from),target=languageFromSlug(to);return source&&target?{source,target}:null;}
