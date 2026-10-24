'use client';
import React,{useMemo} from 'react';
import {parseStructuredReview,reviewLocationLabel,reviewLimits} from '../lib/structured-review';
import {MarkdownResult} from './result-reading';

const severityLabels={error:'Error',warning:'Warning',info:'Information'};
const invalidMessages={response_limit:'This review exceeded the structured response limit.',source_limit:'The source is too large to validate review locations.',invalid_json:'This review did not contain complete, valid issue JSON.',invalid_schema:'This review did not match the supported issue format.',invalid_location:'This review contains a location outside the supplied source.'};
export interface StructuredReviewProps {source:string;result:string;partial?:boolean}
export default function StructuredReview({source,result,partial=false}:StructuredReviewProps){
 const parsed=useMemo(()=>parseStructuredReview(result,source,partial),[result,source,partial]);
 if(parsed.kind==='text')return <MarkdownResult content={parsed.text}/>;
 if(parsed.kind==='pending')return <section className="structured-review" aria-label="Review in progress"><p role="status">Receiving review…</p><pre>{parsed.text}</pre></section>;
 if(parsed.kind==='invalid')return <section className="structured-review" aria-label="Unstructured review"><p role="status">{invalidMessages[parsed.reason]} The original reply is shown below; issue locations and severity could not be verified.</p><pre>{parsed.text.slice(0,reviewLimits.responseBytes)}</pre>{parsed.text.length>reviewLimits.responseBytes&&<p>The displayed reply is limited to {reviewLimits.responseBytes.toLocaleString()} characters. The full response remains available through the result download.</p>}</section>;
 const {review}=parsed;
 return <section className="structured-review markdown-result" aria-label="Code review issues"><p>AI review suggestions. Review and test corrections before applying them.</p>{review.summary&&<p>{review.summary}</p>}<p>{review.issues.length?`${review.issues.length} reported issue${review.issues.length===1?'':'s'}.`:'No issues were reported. This does not establish that the code is correct.'}</p><ol aria-label="Reported issues">{review.issues.map((issue,index)=><li key={index} className={`review-issue review-${issue.severity}`} data-severity={issue.severity}><strong>{severityLabels[issue.severity]}</strong><p>{issue.message}</p><p><small>{issue.location===null?'No specific source location provided':reviewLocationLabel(issue.location)}</small></p>{issue.correctedSnippet!==undefined&&<details><summary>Suggested correction (not applied)</summary><pre><code>{issue.correctedSnippet}</code></pre></details>}</li>)}</ol><details><summary>Original review response</summary><pre>{result}</pre></details></section>;
}
export {StructuredReview};
