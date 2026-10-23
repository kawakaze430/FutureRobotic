import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {languageDirectories} from '../lib/language-directories.ts';
import LanguageDirectory from '../app/language-directory.tsx';
import {freePaths} from '../lib/reference-data.ts';
const out='outputs/web',template=await readFile(`${out}/index.html`,'utf8'),pairs=JSON.parse(await readFile('lib/language-pairs.json','utf8'));
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let origin=null;if(process.env.PUBLIC_SITE_URL){const u=new URL(process.env.PUBLIC_SITE_URL);if(u.protocol!=='https:'||u.pathname!=='/'||u.username||u.password||u.hash||u.search)throw new Error('PUBLIC_SITE_URL must be a bare HTTPS origin');origin=u.origin;}
const indexed=!!origin&&process.env.PUBLIC_INDEXING_APPROVED==='true';
const routes=['/',...Object.values(freePaths),'/pricing','/faqs','/contact','/code-privacy','/privacy','/terms','/partnerships',...pairs.map(s=>'/'+s),...languageDirectories.map(d=>'/'+d.slug)];
async function page(path,title,body){const meta=`<meta name="robots" content="${indexed?'index,follow':'noindex,nofollow'}"/>${origin?`<link rel="canonical" href="${escape(origin+path)}"/>`:''}`;let html=template.replace('<title>FutureRobotic AI</title>',`<title>${escape(title)}</title>`).replace('</head>',meta+'</head>');if(body)html=html.replace('<div id="root"></div>',`<div id="root">${body}</div>`);const dir=path==='/'?out:out+path;await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',html);}
for(const path of routes){const d=languageDirectories.find(d=>'/'+d.slug===path);if(d){await page(path,`Convert from ${d.name} | FutureRobotic AI`,renderToStaticMarkup(React.createElement(LanguageDirectory,{source:d.name})));continue;}const slug=path.slice(1);if(pairs.includes(slug)){const [from,to]=slug.replace(/-converter$/,'').split('-to-').map(x=>x.replaceAll('_',' ').replaceAll('-',' '));await page(path,`${from} to ${to} converter | FutureRobotic AI`,`<main><h1>${escape(from)} to ${escape(to)} converter</h1><p>Convert source code with FutureRobotic AI. Review and test every generated result.</p><a href="/workspace">Open the workspace</a></main>`);}else await page(path,path==='/'?'FutureRobotic AI':path.slice(1).replaceAll('-',' ')+' | FutureRobotic AI');}
for(const path of ['/workspace','/shared']){await mkdir(out+path,{recursive:true});await writeFile(out+path+'/index.html',template.replace('</head>','<meta name="robots" content="noindex,nofollow,noarchive"/></head>'));}
await writeFile(`${out}/sitemap.xml`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexed?routes.map(p=>`<url><loc>${escape(origin+p)}</loc></url>`).join(''):''}</urlset>`);
await writeFile(`${out}/robots.txt`,indexed?`User-agent: *\nAllow: /\nDisallow: /workspace\nDisallow: /shared\nDisallow: /v1/\nDisallow: /auth/\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
console.log(JSON.stringify({pairRoutes:pairs.length,sourceDirectories:languageDirectories.length,indexingApproved:indexed,routes:routes.length}));
