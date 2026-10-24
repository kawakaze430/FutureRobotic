import React from 'react';
import {syntaxChunks} from '../lib/code-syntax';
export default function CodeResult({code,language}:{code:string;language:string}){
 return <pre className="code-result" data-language={language}><code>{syntaxChunks(code,language).map((chunk,index)=><span key={index} className={chunk.kind==='plain'?undefined:`syntax-${chunk.kind}`}>{chunk.text}</span>)}</code></pre>;
}
