// Original project artwork. Historical supplied artwork is retained outside the
// public directory for private reference; it is never part of the web build.
import {readFile,writeFile,mkdir,readdir,copyFile,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {supportedLanguages,languageCatalog} from '../lib/reference-data.ts';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marker='data-fr-original="true"',originals=[];
for(const folder of ['languages','previews']){
 await mkdir('reference/historical-public-assets/'+folder,{recursive:true});
 for(const file of await readdir('public/'+folder)){
  const path='public/'+folder+'/'+file,bytes=await readFile(path);
  if(bytes.toString('utf8').includes(marker))continue;
  const destination='reference/historical-public-assets/'+folder+'/'+file;
  try{await copyFile(path,destination,constants.COPYFILE_EXCL);}catch(error){if(error.code!=='EEXIST'||hash(await readFile(destination))!==hash(bytes))throw error;}
  await unlink(path);originals.push({path:destination,sha256:hash(bytes),releaseUse:false});
 }
}
const extras={'HTML':'html','CSS':'css','Visual Basic':'visual-basic','Solidity':'solidity'};
const slug=name=>languageCatalog.find(([label])=>label.toLowerCase()===name.toLowerCase())?.[1]??extras[name]??'generic';
const assets=[];
async function asset(path,body,description){await writeFile(path,body);assets.push({path,sha256:hash(body),description,provenance:'Original project vector artwork; generated from checked-in source without third-party product art',license:'Project-original; owner controls distribution terms'});}
for(const name of [...supportedLanguages,'Code']){
 const file=name==='Code'?'generic':slug(name),abbreviation=name==='Code'?'</>':name==='JavaScript'?'JS':name==='TypeScript'?'TS':name==='Python'?'Py':name.replace(/[^\p{L}\p{N}+#]/gu,'').slice(0,3);
 const hue=Number.parseInt(hash(name).slice(0,5),16)%360;
 await asset('public/languages/'+file+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" ${marker} width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="${escape(name)}"><rect x="3" y="3" width="90" height="90" rx="25" fill="hsl(${hue} 45% 94%)"/><rect x="10" y="10" width="76" height="76" rx="19" fill="none" stroke="hsl(${hue} 45% 65%)"/><text x="48" y="58" text-anchor="middle" font-family="monospace" font-size="${abbreviation.length>2?26:34}" font-weight="700" fill="hsl(${hue} 45% 28%)">${escape(abbreviation)}</text></svg>`,name+' identifier badge; language name used descriptively, no third-party logo reproduced');
}
const views={
 'workspace-original.svg':['Your coding workspace',['Convert','Explain','Check','Files'],'def greet(name):','    return f"Hello, {name}"','function greet(name) {','  return `Hello, ${name}`;','}'],
 'convert-original.svg':['Convert across languages',['Python','JavaScript'],'def total(values):','    return sum(values)','const total = values =>','  values.reduce((a, b) => a + b, 0);'],
 'generate-original.svg':['Build from a description',['Prompt','Review'],'Create a readable counter.','Keep the result small.','let count = 0;','const next = () => ++count;'],
 'explain-original.svg':['Understand your code',['Source','Explanation'],'for item in values:','    total += item','Each iteration adds one value.','Review edge cases and tests.'],
 'assistant-original.svg':['Refine with the assistant',['Context','Review change'],'You: Make the names clearer.','Assistant: Review this suggestion.','const activeUsers = users.filter(','  user => user.active',');'],
};
for(const [file,[title,tabs,...lines]] of Object.entries(views)){
 const rows=lines.map((line,index)=>`<text x="${index<2?75:575}" y="${190+(index<2?index:index-2)*45}" fill="${index<2?'#a8d9c6':'#d0bef7'}" font-family="monospace" font-size="20">${escape(line)}</text>`).join('');
 await asset('public/previews/'+file,`<svg xmlns="http://www.w3.org/2000/svg" ${marker} width="1120" height="640" viewBox="0 0 1120 640"><rect width="1120" height="640" rx="30" fill="#e9f4ef"/><rect x="24" y="24" width="1072" height="592" rx="20" fill="#132922"/><circle cx="53" cy="55" r="6" fill="#69bda0"/><circle cx="74" cy="55" r="6" fill="#adcfc0"/><circle cx="95" cy="55" r="6" fill="#e1e8e3"/><text x="125" y="63" fill="#f1f8f3" font-family="sans-serif" font-size="22">FutureRobotic AI · ${escape(title)}</text><path d="M24 88h1072M550 88v475" stroke="#355248"/>${tabs.map((tab,i)=>`<text x="${65+i*140}" y="126" fill="#9dd2bb" font-family="sans-serif" font-size="16">${escape(tab)}</text>`).join('')}${rows}<rect x="65" y="477" width="270" height="50" rx="12" fill="#a9e4c8"/><text x="90" y="509" fill="#143b2c" font-family="sans-serif" font-size="18">Review every result</text><text x="65" y="578" fill="#aac4b7" font-family="sans-serif" font-size="16">Original project illustration · example content</text></svg>`,title+' original illustrative code panels; displayed examples are not provider evidence');
}
await asset('public/previews/background-pattern.svg',`<svg xmlns="http://www.w3.org/2000/svg" ${marker} width="80" height="80" viewBox="0 0 80 80"><path d="M0 40h80M40 0v80" stroke="#c9dfd3" stroke-width=".6"/><circle cx="40" cy="40" r="2" fill="#7fbaa0"/></svg>`,'Original geometric grid');
const oldFavicon=await readFile('public/favicon.svg');
if(!oldFavicon.toString().includes(marker)){await copyFile('public/favicon.svg','reference/historical-public-assets/favicon.svg',constants.COPYFILE_EXCL);}
await asset('public/favicon.svg',`<svg xmlns="http://www.w3.org/2000/svg" ${marker} viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="9" fill="#13634d"/><path d="M11 24V9h12M11 16h9" fill="none" stroke="#d9fff0" stroke-width="3" stroke-linecap="round"/><circle cx="23" cy="9" r="2" fill="#9de3c7"/><circle cx="20" cy="16" r="2" fill="#9de3c7"/></svg>`,'Original FutureRobotic F circuit monogram');
const fonts=[];
for(const [file,license,source]of [['geist-sans.woff2','Geist-OFL.txt','https://github.com/vercel/geist-font/blob/main/OFL.txt'],['geist-mono.woff2','Geist-OFL.txt','https://github.com/vercel/geist-font/blob/main/OFL.txt'],['DejaVuSansMono.ttf','DejaVu-LICENSE.txt','https://dejavu-fonts.github.io/License.html']])fonts.push({path:'public/fonts/'+file,sha256:hash(await readFile('public/fonts/'+file)),licenseFile:'public/fonts/'+license,licenseSha256:hash(await readFile('public/fonts/'+license)),licenseSource:source,modification:'Font binary unchanged; license included with distribution'});
await writeFile('public/ASSET_MANIFEST.json',JSON.stringify({schemaVersion:1,artGenerator:'scripts/generate-original-assets.mjs',artwork:assets,fonts,historicalReferenceDirectory:'reference/historical-public-assets',historicalReferenceNotServed:true,limits:'Language names are descriptive identifiers. This manifest does not approve business policies or transfer third-party trademark rights.'},null,2)+'\n');
await writeFile('reference/historical-public-assets/README.md','# Historical supplied artwork\n\nPreserved for the private project reference and provenance. Files in this directory are excluded from the public static build; their commercial rights were not assumed. Current public artwork is generated original SVG with a release asset/font manifest in public/ASSET_MANIFEST.json.\n');
console.log(JSON.stringify({originalArtwork:assets.length,fontLicenses:fonts.length,historicalFilesMoved:originals.length}));
