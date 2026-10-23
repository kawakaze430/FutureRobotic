import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PDFDocument} from 'pdf-lib';
import {zipSync,strToU8} from 'fflate';
import {MarkdownResult,FixResult,changeSummary,fixedCode} from '../app/result-reading';
import {exportCodePDF,defaultPDF,pdfMargins,pdfSizes,printDocument} from '../lib/pdf-export';
import {observedPairs,resolvePair} from '../lib/language-pairs';
import {importProjectZip} from '../lib/project-archive';
import {planCatalog,modelCatalog} from '../lib/product-policy';
import PlanComparison from '../app/plan-comparison';
const font=new Uint8Array(await readFile('public/fonts/DejaVuSansMono.ttf'));
test('EDT-008 Markdown renders tables/code but never raw HTML, scripts, remote images or unsafe links',()=>{
 const html=renderToStaticMarkup(<MarkdownResult content={'# Review\n\n| Test | Result |\n|---|---|\n| Parse | OK |\n\n```js\nconst x = "<script>";\n```\n\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1))\n![tracker](https://attacker.invalid/pixel)\n[docs](https://example.com)'}/>);
 assert.ok(html.includes('<h1>Review</h1>'));assert.ok(html.includes('<table>'));assert.ok(html.includes('<code class="language-js">'));
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('javascript:'));assert.ok(html.includes('rel="noreferrer noopener"'));
});
test('TOL-006/007 missing-colon diff identifies one replaced line and exports clean fixed code',()=>{
 const before='def hello()\n    print("hello")\n',answer='```python\ndef hello():\n    print("hello")\n```';const code=fixedCode(answer),d=changeSummary(before,code+'\n');assert.equal(d.added,1);assert.equal(d.removed,1);assert.ok(!code.includes('```'));
 const html=renderToStaticMarkup(<FixResult source={before} result={answer}/>);assert.ok(html.includes('Fixed code'));assert.ok(html.includes('diff-added'));assert.ok(html.includes('What I changed'));assert.ok(!html.includes('Tests passed'));
 assert.equal(changeSummary('x'.repeat(100001),'x').limited,true);
});
test('WEB-014 all 68 observed converter URLs resolve to valid language pairs',()=>{
 assert.equal(observedPairs.length,68);for(const slug of observedPairs)assert.ok(resolvePair(slug),slug);assert.deepEqual(resolvePair('python-to-javascript-converter'),{source:'Python',target:'JavaScript'});assert.equal(resolvePair('made-up-converter'),null);
});
test('WEB-008 plans and comparison show the same billing amounts and server model tiers',()=>{
 const html=renderToStaticMarkup(<PlanComparison annual={true}/>);for(const plan of planCatalog.slice(1)){assert.ok(html.includes(String(plan.yearly/100)));assert.ok(html.includes(String(plan.advancedCredits)));}assert.ok(html.includes('approved'));assert.equal(modelCatalog.find(m=>m.id==='advanced-code')!.minimumPlan,'pro');
});
test('FIL-004/005 browser ZIP import validates CRC and excludes secrets/dependencies',()=>{
 const zip=zipSync({'src/main.py':strToU8('print("hello")'),'node_modules/pkg/a.js':strToU8('excluded'),'.env':strToU8('SECRET=not-a-key')});const result=importProjectZip(zip);assert.equal(result.files.length,1);assert.equal(result.files[0].content,'print("hello")');assert.equal(result.excluded.length,2);
 assert.throws(()=>importProjectZip(zipSync({'../escape.py':strToU8('x')})));
});
test('PDF-003/004/005 all font sizes, themes and margin presets export valid multipage PDFs',async()=>{
 for(const fontSize of pdfSizes)for(const theme of ['light','dark'] as const)for(const margin of pdfMargins){const blob=await exportCodePDF('const π = "café";\n'.repeat(75),{...defaultPDF,fontSize,theme,margin},font);const pdf=await PDFDocument.load(await blob.arrayBuffer());assert.ok(pdf.getPageCount()>=2);assert.equal(pdf.getTitle(),defaultPDF.title);for(const p of pdf.getPages())assert.equal(p.getWidth(),595.28);}
});
test('PDF-007 long lines paginate, unsupported glyphs are explicit and print HTML escapes active content',async()=>{
 const blob=await exportCodePDF('x'.repeat(9000),defaultPDF,font);assert.ok((await PDFDocument.load(await blob.arrayBuffer())).getPageCount()>1);
 await assert.rejects(exportCodePDF('🧪',defaultPDF,font),/another font/);await assert.rejects(exportCodePDF('x',{...defaultPDF,fontSize:999},font),/Invalid/);
 const html=printDocument('</pre><script>alert("x")</script>',defaultPDF);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('window.print()'));
});
