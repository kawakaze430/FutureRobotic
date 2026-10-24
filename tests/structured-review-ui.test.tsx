import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import StructuredReview from '../app/structured-review';
import {parseStructuredReview,reviewLocationInSource,reviewLimits,structuredReviewSchema} from '../lib/structured-review';
import {structuredReviewInstruction,toolInstruction} from '../portable/src/tool-instructions';

// Human-authored response fixture: tests schema/rendering, not model quality,
// live inference or execution of the Python program.
const source='def average(values):\n    total = sum(values)\n    return total / len(values)';
const fixture={version:1,summary:'The empty input case needs a policy.',issues:[{severity:'error',message:'When values is empty, len(values) is zero, so this division raises ZeroDivisionError.',location:{line:3,column:12,endLine:3,endColumn:31},correctedSnippet:'if not values:\n    raise ValueError("values must not be empty")\nreturn sum(values) / len(values)'}]};
const result=JSON.stringify(fixture);
test('TOL-004 division-by-zero fixture validates and renders severity, source position and an unapplied correction',()=>{
 const parsed=parseStructuredReview(result,source);assert.equal(parsed.kind,'structured');
 const html=renderToStaticMarkup(<StructuredReview source={source} result={result}/>);
 assert.match(html,/Error/);assert.match(html,/Line 3, column 12/);assert.match(html,/ZeroDivisionError/);assert.match(html,/Suggested correction \(not applied\)/);assert.match(html,/Original review response/);
 assert.equal(html.includes('tests passed'),false);
});
test('TOL-004 supports complete JSON fences and preserves existing plain/Markdown reviews',()=>{
 assert.equal(parseStructuredReview('```json\n'+result+'\n```',source).kind,'structured');
 for(const text of ['# Review\n\n- Guard the denominator.','[Documentation](https://example.com)','The source contains `{}` and a JSON example.\n```json\n{"example":true}\n```']){
  assert.deepEqual(parseStructuredReview(text,source),{kind:'text',text});
 }
 const html=renderToStaticMarkup(<StructuredReview source={source} result={'# Review\n\n**Guard** the denominator.'}/>);assert.match(html,/<h1>Review<\/h1>/);assert.match(html,/<strong>Guard<\/strong>/);
});
test('TOL-004 incomplete streamed JSON remains pending until a final response can be validated',()=>{
 for(const text of ['{"version":1,','```json\n{"version":1,',result])assert.equal(parseStructuredReview(text,source,true).kind,'pending');
 const html=renderToStaticMarkup(<StructuredReview source={source} result={'{"version":1,'} partial/>);assert.match(html,/Receiving review/);assert.equal(html.includes('did not match'),false);assert.equal(html.includes('valid issue JSON'),false);
 const final=parseStructuredReview('{"version":1,',source);assert.equal(final.kind,'invalid');if(final.kind==='invalid')assert.equal(final.reason,'invalid_json');
});
test('TOL-004 rejects unknown/injected fields, unsupported severity and bounded issue/text overflow',()=>{
 const invalids=[{...fixture,executedTests:true},{...fixture,issues:[{...fixture.issues[0],severity:'urgent'}]},{...fixture,issues:[{...fixture.issues[0],apply:true}]},{...fixture,issues:Array.from({length:101},()=>fixture.issues[0])},{...fixture,summary:'s'.repeat(4001)},{...fixture,issues:[{...fixture.issues[0],message:'x'.repeat(2001)}]},{...fixture,issues:[{...fixture.issues[0],correctedSnippet:'x'.repeat(10001)}]},[{...fixture}]];
 for(const value of invalids)assert.equal(parseStructuredReview(JSON.stringify(value),source).kind,'invalid');
 assert.equal(parseStructuredReview('{"version":1,"summary":"x","issues":[],"__proto__":{"admin":true}}',source).kind,'invalid');
 assert.equal(({} as {admin?:boolean}).admin,undefined);
 const oversized='😀'.repeat(reviewLimits.responseBytes/3);const parsed=parseStructuredReview(oversized,source);assert.equal(parsed.kind,'invalid');if(parsed.kind==='invalid')assert.equal(parsed.reason,'response_limit');
});
test('TOL-004 validates one-based Unicode code-point ranges, CRLF and paired exclusive endpoints',()=>{
 const unicode='x = "😀"\r\nprint(x)\n';
 assert.equal(reviewLocationInSource(unicode,{line:1,column:6,endLine:1,endColumn:7}),true);
 assert.equal(reviewLocationInSource(unicode,{line:1,column:8}),true); // insertion at end
 assert.equal(reviewLocationInSource(unicode,{line:1,column:9}),false); // UTF-16 length is not a column count
 assert.equal(reviewLocationInSource(unicode,{line:2,column:1,endLine:1,endColumn:1}),false);
 assert.equal(reviewLocationInSource(unicode,{line:4,column:1}),false);
 for(const location of [{line:0,column:1},{line:1,column:0},{line:1,column:1,endLine:1},{line:3,column:40},{line:3,column:20,endLine:3,endColumn:12}])assert.equal(parseStructuredReview(JSON.stringify({...fixture,issues:[{...fixture.issues[0],location}]}),source).kind,'invalid');
 assert.equal(parseStructuredReview(JSON.stringify({...fixture,issues:[{...fixture.issues[0],location:null}]}),source).kind,'structured');
});
test('TOL-004 HTML, URL and correction payloads render only as inert text',()=>{
 const injected={...fixture,summary:'<script>alert(1)</script>',issues:[{...fixture.issues[0],message:'<img src=x onerror=alert(1)> [run](javascript:alert(1))',correctedSnippet:'</code><iframe src="https://attacker.invalid"></iframe>'}]};
 assert.equal(structuredReviewSchema.safeParse(injected).success,true); // text itself is safe to retain
 const html=renderToStaticMarkup(<StructuredReview source={source} result={JSON.stringify(injected)}/>);
 for(const tag of ['<script','<img','<iframe'])assert.equal(html.includes(tag),false);
 assert.match(html,/&lt;script&gt;/);assert.equal(html.includes('href="javascript:'),false);
 const invalidHtml=renderToStaticMarkup(<StructuredReview source={source} result={'{"version":1,"issues":<img src=x onerror=alert(1)>}'}/>);assert.equal(invalidHtml.includes('<img'),false);assert.match(invalidHtml,/original reply/);
});
test('TOL-004 empty issues and invalid locations do not fabricate clean-code or executed-test evidence',()=>{
 const clean=renderToStaticMarkup(<StructuredReview source={source} result={JSON.stringify({version:1,summary:'No definite issue identified.',issues:[]})}/>);assert.match(clean,/does not establish that the code is correct/);
 const invalid=renderToStaticMarkup(<StructuredReview source={source} result={JSON.stringify({...fixture,issues:[{...fixture.issues[0],location:{line:99,column:1}}]})}/>);assert.match(invalid,/outside the supplied source/);assert.equal(invalid.includes('data-severity'),false);
 assert.equal(toolInstruction('review'),structuredReviewInstruction);assert.match(structuredReviewInstruction,/Unicode code-point/);assert.match(structuredReviewInstruction,/Do not invent executed tests/);
});
