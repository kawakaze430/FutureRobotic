export const commentLanguages=['Python','JavaScript','TypeScript','Java','C','C++','C#','Go','Rust','PHP','CSS','SQL','PostgreSQL','MySQL','Ruby','Bash','Lua','Haskell','Kotlin','Swift','Dart','HTML','PowerShell','R','Julia','Scala'] as const;
// Grammar token ranges preserve regexes, strings, interpolation, and line positions.
// Unsupported grammars fail explicitly rather than guessing from delimiters.
export async function removeCodeComments(source:string,language:string){
 if(!commentLanguages.includes(language as typeof commentLanguages[number]))throw new Error('Choose a language listed in the comment remover. Other grammars are not enabled.');
 const {languages}=await import('@codemirror/language-data');
 const aliases:Record<string,string>={Bash:'Shell',PostgreSQL:'SQL',MySQL:'SQL'};
 const name=aliases[language]??language,description=languages.find(l=>l.name.toLowerCase()===name.toLowerCase()||l.alias.some(a=>a.toLowerCase()===name.toLowerCase()));
 if(!description)throw new Error(`The ${language} comment grammar is unavailable.`);
 let support=await description.load();
 if(language==='PHP'){const {php}=await import('@codemirror/lang-php');support=php({plain:!/^\s*<\?/.test(source)});}
 if(['SQL','PostgreSQL','MySQL'].includes(language)){const {sql,PostgreSQL,MySQL,StandardSQL}=await import('@codemirror/lang-sql');support=sql({dialect:language==='PostgreSQL'?PostgreSQL:language==='MySQL'?MySQL:StandardSQL});}
 const tree=support.language.parser.parse(source),ranges:{from:number;to:number}[]=[];
 tree.iterate({enter(node){if(/comment/i.test(node.name)){if(node.from===0&&source.startsWith('#!'))return false;ranges.push({from:node.from,to:node.to});return false;}if(node.type.isError)throw new Error('This snippet could not be parsed safely. Correct its syntax before removing comments.');}});
 let result='',at=0;for(const range of ranges){result+=source.slice(at,range.from)+source.slice(range.from,range.to).replace(/[^\r\n\t ]/g,' ');at=range.to;}return result+source.slice(at);
}
