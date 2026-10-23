import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {commentLanguages,removeCodeComments} from '../lib/comment-removal';
import {supportedLanguages} from '../lib/reference-data';
import {extensions} from '../lib/studio-data';
import {languageDirectories,resolveDirectory} from '../lib/language-directories';
import LanguageDirectory from '../app/language-directory';
import HelpCenter,{helpArticles} from '../app/help-center';
import {toolGuides} from '../app/tool-guide';
import StudioEditor from '../app/studio-editor';
import {defaultPDF,printDocument} from '../lib/pdf-options';
import {inputLimit,characters} from '../lib/input-policy';
const fixtures:Record<string,string>={
 Python:'url = "# kept" # REMOVE\ntext = """# still kept"""',JavaScript:'const url = /[/*]/g; const s = "// kept"; // REMOVE',TypeScript:'const url: string = "// kept"; /* REMOVE */',Java:'class Main { String url="// kept"; /* REMOVE */ }',C:'#include <stdio.h>\nint main(){ char *url="// kept"; /* REMOVE */ return 0; }','C++':'int main(){ auto url=R"(// kept)"; /* REMOVE */ return 0; }','C#':'class Main { string url="// kept"; /* REMOVE */ }',Go:'package main\nfunc main(){ url := "// kept" // REMOVE\n _ = url }',Rust:'fn main(){ let url="// kept"; /* REMOVE */ println!("{}",url); }',PHP:'$url = "// kept"; // REMOVE\necho $url;',CSS:'a::after { content: "/* kept */"; /* REMOVE */ }',SQL:"SELECT '-- kept'; -- REMOVE",PostgreSQL:"SELECT $tag$ -- kept $tag$; -- REMOVE",MySQL:"SELECT '-- kept'; # REMOVE",Ruby:'url = "# kept" # REMOVE',Bash:'url="# kept" # REMOVE',Lua:'url = "-- kept" -- REMOVE',Haskell:'url = "-- kept" -- REMOVE',Kotlin:'val url = "// kept" // REMOVE',Swift:'let url = "// kept" // REMOVE',Dart:'var url = "// kept"; // REMOVE',HTML:'<p title="kept">text</p><!-- REMOVE -->',PowerShell:'$url = "# kept" # REMOVE',R:'url <- "# kept" # REMOVE',Julia:'url = "# kept" # REMOVE',Scala:'val url = "// kept" // REMOVE',
};
test('TOL-009 all 26 enabled comment grammars remove comments and preserve strings and line positions',async()=>{
 assert.equal(commentLanguages.length,26);for(const language of commentLanguages){const source=fixtures[language];assert.ok(source,language);const result=await removeCodeComments(source,language);assert.ok(result.includes('kept'),language);assert.ok(!result.includes('REMOVE'),language);assert.equal(result.length,source.length,language);assert.equal(result.split('\n').length,source.split('\n').length,language);}
});
test('TOL-009 nested comments, regex slashes, interpolation, shebang and SQL literal escapes remain intact',async()=>{
 const cases:[string,string,string][]=[['JavaScript','const x = `url // kept ${1 /* REMOVE */}`;','url // kept'],['Rust','fn main(){ /* outer /* inner REMOVE */ end */ let x="kept"; }','"kept"'],['Python','#!/usr/bin/env python3\nx="# kept" # REMOVE','#!/usr/bin/env python3'],['PostgreSQL',"SELECT 'it''s -- kept'; -- REMOVE","'it''s -- kept'"],['PHP','<?php $x="// kept"; /* REMOVE */ ?>','// kept']];
 for(const [language,source,kept]of cases){const result=await removeCodeComments(source,language);assert.ok(result.includes(kept),language);assert.ok(!result.includes('REMOVE'),language);}
 await assert.rejects(removeCodeComments('x','Unverified language'),/not enabled/);
});
test('EDT-007/009 every selectable language has an explicit code download extension',()=>{
 assert.equal(supportedLanguages.length,72);for(const language of supportedLanguages)assert.ok(extensions[language],language);
 assert.equal(extensions.PySpark,'py');assert.equal(extensions['VB.NET'],'vb');assert.equal(extensions.PostgreSQL,'sql');
});
test('WEB-013 68 unique source directories link to real free-tool targets',()=>{
 assert.equal(languageDirectories.length,68);assert.equal(new Set(languageDirectories.map(d=>d.slug)).size,68);
 for(const d of languageDirectories)assert.equal(resolveDirectory(d.slug)?.name,d.name);
 const html=renderToStaticMarkup(<LanguageDirectory source="Python"/>);assert.ok(html.includes('from=Python&amp;to=JavaScript'));assert.ok(!html.includes('href="/undefined'));assert.ok(html.includes('Choose a target language'));
});
test('WEB-009 help supports stable share anchors and factual categorized answers',()=>{
 assert.ok(new Set(helpArticles.map(a=>a.category)).size>=5);assert.equal(new Set(helpArticles.map(a=>a.id)).size,helpArticles.length);
 const html=renderToStaticMarkup(<HelpCenter/>);for(const a of helpArticles){assert.ok(html.includes(`id="${a.id}"`));assert.ok(html.includes(`href="#${a.id}"`));}assert.ok(html.includes('Search help'));
});
test('EDT-012 every tool has its own three-step instructions and usable example',()=>{
 assert.equal(Object.keys(toolGuides).length,8);assert.equal(new Set(Object.values(toolGuides).map(v=>v.heading)).size,8);for(const guide of Object.values(toolGuides)){assert.equal(guide.steps.length,3);assert.ok(guide.example.trim());assert.ok(guide.description.length>60);}
});
test('PDF-006 title inclusion and line numbers are independent in the printable preview',()=>{
 const hidden=printDocument('first\nsecond',{...defaultPDF,title:'UNIQUE_TITLE',includeTitle:false,lineNumbers:false});assert.ok(!hidden.includes('<h1>'));assert.ok(hidden.includes('<pre>first\nsecond</pre>'));
 const numbered=printDocument('first\nsecond',{...defaultPDF,includeTitle:false,lineNumbers:true});assert.ok(!numbered.includes('<h1>'));assert.ok(numbered.includes('   1  first\n   2  second'));
 const titled=printDocument('first',{...defaultPDF,includeTitle:true,lineNumbers:false});assert.ok(titled.includes('<h1>'));assert.ok(titled.includes('<pre>first</pre>'));
});
test('EDT-003/010 source editor has an accessible fallback and Unicode-aware tool limits',()=>{
 const html=renderToStaticMarkup(<StudioEditor value="const x = 1;" language="JavaScript" onChange={()=>{}} limit={4000}/>);assert.ok(html.includes('aria-label="Source code"'));assert.ok(html.includes('Use plain text'));
 assert.equal(inputLimit('convert',false),4000);assert.equal(inputLimit('convert',true),25000);assert.equal(inputLimit('convert',true,'premium'),100000);assert.equal(inputLimit('pdf',false),50000);assert.equal(inputLimit('run',true),10000);assert.equal(characters('😀x'),2);
});
