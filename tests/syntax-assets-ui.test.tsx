import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {EditorState} from '@codemirror/state';
import {syntaxTree} from '@codemirror/language';
import {supportedLanguages,logoFor} from '../lib/reference-data';
import {syntaxChunks,loadCodeLanguage} from '../lib/code-syntax';
import CodeResult from '../app/code-result';
import OperatorConsole from '../app/operator-console';
import {printDocument,defaultPDF} from '../lib/pdf-options';
test('EDT-003 every advertised language loads native or explicit lexical syntax and preserves all source bytes',async()=>{
 assert.equal(supportedLanguages.length,72);const sample='const café = "http://kept/🧪";\nreturn 42; /* literal <script> */\n';
 let native=0,lexical=0;
 for(const language of supportedLanguages){const {support,mode}=await loadCodeLanguage(language);mode==='native'?native++:lexical++;const state=EditorState.create({doc:sample,extensions:[support]});assert.equal(state.doc.toString(),sample);assert.equal(syntaxTree(state).length,sample.length);assert.equal(syntaxChunks(sample,language).map(c=>c.text).join(''),sample,language);}
 assert.ok(native>50);assert.ok(lexical>0);
});
test('EDT-003 strings and comments are bounded and source/output rendering never treats code as active HTML',()=>{
 const code='const url = "https://example.invalid/kept"; // comment\nreturn 42;';const tokens=syntaxChunks(code,'JavaScript');assert.ok(tokens.some(t=>t.kind==='string'&&t.text.includes('https://')));assert.ok(tokens.some(t=>t.kind==='comment'&&t.text.includes('comment')));assert.ok(tokens.some(t=>t.kind==='keyword'));
 const html=renderToStaticMarkup(<CodeResult code={'<script>alert("x")</script>'} language="HTML"/>);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;'));
 const broken='"unfinished\\\nnext\n';assert.equal(syntaxChunks(broken,'Python').map(t=>t.text).join(''),broken);
});
test('PDF-007 direct/print syntax classes retain source order, Unicode and safe markup; line numbers remain outside syntax spans',()=>{
 const html=printDocument('const café = "λ Привет";\n// comment',{...defaultPDF,language:'JavaScript'});assert.ok(html.includes('syntax-keyword'));assert.ok(html.includes('syntax-string'));assert.ok(html.includes('syntax-comment'));assert.ok(html.includes('λ Привет'));assert.ok(!html.includes('<span class="syntax-number">   1'));
 const hidden=printDocument('</pre><script>bad()</script>',{...defaultPDF,language:'HTML'});assert.ok(!hidden.includes('<script>'));
});
test('SEC-012 every release artwork/font has source provenance and a matching license/hash; language badges are original vectors',async()=>{
 const manifest=JSON.parse(await readFile('public/ASSET_MANIFEST.json','utf8'));assert.equal(manifest.historicalReferenceNotServed,true);assert.equal(manifest.fonts.length,3);
 for(const item of [...manifest.artwork,...manifest.fonts]){const bytes=await readFile(item.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.path);if(item.licenseFile)assert.equal(createHash('sha256').update(await readFile(item.licenseFile)).digest('hex'),item.licenseSha256);else assert.ok(bytes.toString().includes('data-fr-original="true"'));}
 for(const language of supportedLanguages)assert.ok((await readFile('public'+logoFor(language),'utf8')).includes('data-fr-original="true"'),language);
 assert.ok((await readFile('public/fonts/Geist-OFL.txt','utf8')).includes('SIL OPEN FONT LICENSE'));
});
test('AUT-009 operator UI begins locked and exposes no unverified account records or secret enrollment form',()=>{
 const html=renderToStaticMarkup(<OperatorConsole/>);assert.ok(html.includes('Operator authenticator code'));assert.ok(html.includes('Unlock operator console'));assert.ok(!html.includes('Save reviewed controls'));assert.ok(!html.includes('seedBase64'));
});
