// Limits count Unicode code points, matching PostgreSQL length(text).
export const characters=(value:string)=>Array.from(value).length;
export const takeCharacters=(value:string,limit:number)=>Array.from(value).slice(0,Math.max(0,limit)).join('');
export function inputLimit(tool:string,signedIn:boolean,plan='free') {
 if(tool==='pdf')return 50000;
 if(tool==='run')return 10000;
 if(tool==='comments')return 100000;
 return signedIn?(plan==='premium'?100000:25000):4000;
}
export const executionLanguages=['Python','JavaScript','C','C++','Java'] as const;
