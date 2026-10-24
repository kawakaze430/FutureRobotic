import {z} from 'zod/v4';

export const reviewLimits={responseBytes:200000,sourceCharacters:100000,issues:100,messageCharacters:2000,summaryCharacters:4000,snippetCharacters:10000} as const;
const position=z.strictObject({line:z.number().int().min(1).max(100001),column:z.number().int().min(1).max(100001),endLine:z.number().int().min(1).max(100001).optional(),endColumn:z.number().int().min(1).max(100001).optional()}).refine(value=>(value.endLine===undefined)===(value.endColumn===undefined),'An end location requires both line and column');
export const structuredReviewSchema=z.strictObject({
 version:z.literal(1),
 summary:z.string().max(reviewLimits.summaryCharacters),
 issues:z.array(z.strictObject({
  severity:z.enum(['error','warning','info']),
  message:z.string().min(1).max(reviewLimits.messageCharacters),
  location:position.nullable(),
  correctedSnippet:z.string().max(reviewLimits.snippetCharacters).optional(),
 })).max(reviewLimits.issues),
});
export type Review=z.infer<typeof structuredReviewSchema>;
export type ReviewIssue=Review['issues'][number];
export type ReviewLocation=NonNullable<ReviewIssue['location']>;
export type ReviewParseResult=
 | {kind:'structured';review:Review}
 | {kind:'text';text:string}
 | {kind:'pending';text:string}
 | {kind:'invalid';text:string;reason:'response_limit'|'source_limit'|'invalid_json'|'invalid_schema'|'invalid_location'};

// Columns count Unicode code points, beginning at 1. Tabs count as one code
// point, independently of their display width. End positions are exclusive.
export function reviewLocationInSource(source:string,location:ReviewLocation):boolean {
 const lines=source.split(/\r\n|\r|\n/);
 const valid=(line:number,column:number)=>Number.isInteger(line)&&Number.isInteger(column)&&line>=1&&line<=lines.length&&column>=1&&column<=Array.from(lines[line-1]).length+1;
 if(!valid(location.line,location.column))return false;
 if(location.endLine===undefined&&location.endColumn===undefined)return true;
 if(location.endLine===undefined||location.endColumn===undefined||!valid(location.endLine,location.endColumn))return false;
 return location.endLine>location.line||location.endLine===location.line&&location.endColumn>=location.column;
}

export function parseStructuredReview(result:string,source:string,partial=false):ReviewParseResult {
 // Bound parsing before allocating a JSON tree; the original result remains
 // available to callers and the renderer explicitly discloses display limits.
 if(result.length>reviewLimits.responseBytes||new TextEncoder().encode(result).byteLength>reviewLimits.responseBytes)return {kind:'invalid',text:result,reason:'response_limit'};
 const trimmed=result.trim();
 const fenced=/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/i.exec(trimmed);
 const jsonText=fenced?fenced[1].trim():trimmed;
 let jsonArray=false;
 if(jsonText.startsWith('[')){try{jsonArray=Array.isArray(JSON.parse(jsonText));}catch{/* A Markdown link or citation remains Markdown. */}}
 const candidate=jsonText.startsWith('{')||jsonArray||/^```json(?:\s|$)/i.test(trimmed)||/^```\s*\r?\n\s*\{/.test(trimmed);
 if(!candidate)return {kind:'text',text:result};
 if(partial)return {kind:'pending',text:result};
 if(source.length>reviewLimits.sourceCharacters*2||Array.from(source).length>reviewLimits.sourceCharacters)return {kind:'invalid',text:result,reason:'source_limit'};
 let value:unknown;try{value=JSON.parse(jsonText);}catch{return {kind:'invalid',text:result,reason:'invalid_json'};}
 const parsed=structuredReviewSchema.safeParse(value);
 if(!parsed.success)return {kind:'invalid',text:result,reason:'invalid_schema'};
 if(parsed.data.issues.some(issue=>issue.location!==null&&!reviewLocationInSource(source,issue.location)))return {kind:'invalid',text:result,reason:'invalid_location'};
 return {kind:'structured',review:parsed.data};
}

export function reviewLocationLabel(location:ReviewLocation):string {
 const start=`Line ${location.line}, column ${location.column}`;
 return location.endLine===undefined?start:`${start} to line ${location.endLine}, column ${location.endColumn} (end exclusive)`;
}
