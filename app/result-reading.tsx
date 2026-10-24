'use client';
import React,{useMemo,useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {diffLines} from 'diff';
import {safeMarkdownUrl} from '../lib/safe-markdown-url';
export function MarkdownResult({content}:{content:string}){
 return <div className="markdown-result"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeMarkdownUrl} components={{a:({children,href})=><a href={href} rel="noreferrer noopener" target="_blank">{children}</a>,img:({alt})=><span>[Image: {alt??'omitted'}]</span>}}>{content.slice(0,200000)}</ReactMarkdown></div>;
}
export function fixedCode(value:string){const match=/```[^\n]*\n([\s\S]*?)```/.exec(value);return match?match[1].trimEnd():value;}
export function changeSummary(before:string,after:string){
 if(before.length>100000||after.length>200000)return {parts:[],added:0,removed:0,limited:true};
 const parts=diffLines(before,after,{timeout:100});
 if(!parts)return {parts:[],added:0,removed:0,limited:true};
 return {parts,added:parts.filter(p=>p.added).reduce((n,p)=>n+(p.count??0),0),removed:parts.filter(p=>p.removed).reduce((n,p)=>n+(p.count??0),0),limited:false};
}
export function FixResult({source,result}:{source:string;result:string}){
 const [view,setView]=useState<'diff'|'code'>('diff');const code=fixedCode(result),diff=useMemo(()=>changeSummary(source,code),[source,code]);
 let old=0,line=0;
 return <div className="fix-result"><div className="result-view-tabs" role="group" aria-label="Fixed code view"><button aria-pressed={view==='diff'} onClick={()=>setView('diff')}>Changes</button><button aria-pressed={view==='code'} onClick={()=>setView('code')}>Fixed code</button></div><p className="change-summary">{diff.limited?'Diff limit reached. View the fixed code.':diff.added||diff.removed?`${diff.added} line${diff.added===1?'':'s'} added, ${diff.removed} removed. Review and test these changes.`:'No lines changed.'}</p>{view==='code'||diff.limited?<pre>{code}</pre>:<div className="inline-diff" aria-label="Line-by-line changes">{diff.parts.flatMap((part,p)=>part.value.split('\n').filter((_,i,a)=>i<a.length-1||a[i]!=='').map((text,i)=>{if(!part.added)old++;if(!part.removed)line++;return <div className={part.added?'diff-added':part.removed?'diff-removed':''} key={`${p}-${i}`}><span>{part.added?'':old}</span><span>{part.removed?'':line}</span><b>{part.added?'+':part.removed?'−':' '}</b><code>{text||' '}</code></div>;}))}</div>}<details><summary>What I changed</summary><p>{diff.added||diff.removed?`The displayed diff contains ${diff.added} added and ${diff.removed} removed lines. This summary is computed from the text. It does not claim compilation or execution.`:'The source and extracted fixed code have no text changes.'}</p></details></div>;
}
