import {approvedPublicOrigin} from '../lib/seo';
import {observedPairs} from '../lib/language-pairs';
import {languageDirectories} from '../lib/language-directories';
import {freePaths} from '../lib/reference-data';
export default function sitemap(){const origin=approvedPublicOrigin();if(!origin||process.env.PUBLIC_INDEXING_APPROVED!=='true')return [];return ['/',...Object.values(freePaths),'/faqs','/pricing','/contact','/code-privacy',...observedPairs.map(s=>'/'+s),...languageDirectories.map(d=>'/'+d.slug)].map(path=>({url:origin+path}));}
