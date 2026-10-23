import {languageCatalog} from './reference-data';
export const languageDirectories=languageCatalog.map(([name,slug])=>({name:name==='Matlab'?'MATLAB':name,slug:`convert-from-${slug}`}));
export const resolveDirectory=(slug:string)=>languageDirectories.find(d=>d.slug===slug)??null;
