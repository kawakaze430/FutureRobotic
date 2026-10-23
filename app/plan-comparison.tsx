'use client';
import React from 'react';
import {planCatalog} from '../lib/product-policy';
export default function PlanComparison({annual}:{annual:boolean}){
 const rows=[['Price',...planCatalog.map(p=>p.id==='free'?'$0':`$${(annual?p.yearly:p.monthly)/100} / ${annual?'year':'month'}`)],['AI credits (current policy)',...planCatalog.map(p=>p.id==='free'?`${p.advancedCredits} initial credits`:`${p.advancedCredits} / month`)],['Request context',...planCatalog.map(p=>p.contextLimit.toLocaleString('en-US')+' characters')],['Cloud file allowance',...planCatalog.map(p=>p.fileLimit?String(p.fileLimit):'Browser files only')],['Standard usage',...planCatalog.map(()=> 'Fair-use policy under review')],['Billing availability',...planCatalog.map(p=>p.id==='free'?'Local tools available':'Requires approved merchant setup')]];
 return <section className="plan-comparison"><h2>Compare plans</h2><p>Proposed USD catalog. Checkout stays disabled until prices, countries and service limits are approved.</p><div><table><thead><tr><th scope="col">Feature</th>{planCatalog.map(p=><th scope="col" key={p.id}>{p.name}</th>)}</tr></thead><tbody>{rows.map(([title,...values])=><tr key={title}><th scope="row">{title}</th>{values.map((v,i)=><td key={i}>{v}</td>)}</tr>)}</tbody></table></div></section>;
}
