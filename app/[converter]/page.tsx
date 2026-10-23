import FutureApp from '../future-app';
import LanguageDirectory from '../language-directory';
import {notFound} from 'next/navigation';
import {observedPairs,resolvePair} from '../../lib/language-pairs';
import {languageDirectories,resolveDirectory} from '../../lib/language-directories';
import {pageSEO} from '../../lib/seo';
export function generateStaticParams(){return [...observedPairs,...languageDirectories.map(d=>d.slug)].map(converter=>({converter}));}
export async function generateMetadata({params}:{params:Promise<{converter:string}>}){const slug=(await params).converter,pair=resolvePair(slug),directory=resolveDirectory(slug);return {...pageSEO('/'+slug),title:pair?`${pair.source} to ${pair.target} Converter | FutureRobotic AI`:directory?`Convert from ${directory.name} | FutureRobotic AI`:'Converter | FutureRobotic AI',description:pair?`Convert ${pair.source} code to ${pair.target}, review the result and continue in FutureRobotic AI.`:directory?`Choose a target language for your ${directory.name} code.`:undefined};}
export default async function LanguagePair({params}:{params:Promise<{converter:string}>}){const slug=(await params).converter,directory=resolveDirectory(slug);if(directory)return <LanguageDirectory source={directory.name}/>;const pair=resolvePair(slug);if(!pair)notFound();return <FutureApp initialPair initialPage="free" initialTool="convert" initialSource={pair.source} initialTarget={pair.target}/>;}
