import {supportedLanguages} from './reference-data';

export type SyntaxKind='plain'|'keyword'|'string'|'comment'|'number'|'atom'|'operator';
export interface SyntaxChunk {text:string;kind:SyntaxKind}
export interface LexState {closing:string|null;comment:boolean;depth:number;escaped:boolean}
interface Spec {line:string[];block?:readonly[string,string];keywords:Set<string>;insensitive:boolean}
const common='if else elseIf elif then end endif for foreach while do until loop break continue return yield import from export module package namespace use using include require let const var val def fn fun func function class struct enum interface type trait impl new try catch finally throw throws raise match case switch when default public private protected static async await true false null nil none void this self super extends implements in is not and or xor with as begin';
const sets:Record<string,string>={
 Lisp:'define lambda cond car cdr cons list set! let* defun defmacro progn quote unquote quasiquote',
 SQL:'select insert update delete create alter drop table index view join inner left right outer on where having group by order asc desc limit offset union distinct values into set primary key references constraint transaction commit rollback null not exists returning grant revoke',
 Python:'lambda pass except assert del global nonlocal print range',
 Ruby:'unless elsif ensure rescue puts attr_reader attr_accessor require_relative',
 Haskell:'data deriving instance where let of qualified hiding infix infixl infixr',
 OCaml:'let rec fun function val sig struct type begin end open exception mutable',
 Ada:'procedure declare record subtype generic task accept pragma range reverse others elsif',
 Pascal:'program unit procedure implementation uses record repeat until writeln downto div mod',
 Redis:'get set del exists expire ttl incr decr mget mset hget hset lpush rpush lrange sadd smembers zadd zrange publish subscribe multi exec watch unwatch scan keys',
 Nim:'proc template macro iterator converter discard defer when object distinct ref ptr seq echo elif except',
 Zig:'pub comptime defer errdefer orelse catch error test unreachable packed extern opaque union',
 Elixir:'defmodule defp defmacro defprotocol defimpl defstruct defexception receive after rescue raise unless quote unquote alias require import',
 Gleam:'pub let assert case fn type opaque panic todo echo',
 Grain:'provide let rec match record variant enum import from module foreign throw try catch',
 Wren:'construct foreign static is as import for in System Fiber',
 Raku:'my our state sub method multi proto role grammar token regex rule say given when default',
 'Oberon+':'MODULE IMPORT CONST TYPE VAR PROCEDURE BEGIN END RETURN IF THEN ELSIF ELSE CASE OF WHILE DO REPEAT UNTIL FOR TO BY LOOP EXIT RECORD POINTER ARRAY SET DIV MOD OR IN IS NIL',
 Solidity:'pragma solidity contract library mapping address payable modifier event emit constructor returns memory storage calldata external internal immutable constant override virtual abstract assembly require revert assert wei ether',
 SAS:'proc data run input datalines cards set merge by retain array format informat output stop length label macro mend do end',
 VBScript:'dim redim sub function end select elseif then wend each next call byref byval option explicit property get set msgbox',
};
const lisp=new Set(['Lisp','Clojure','Scheme','Racket','Janet']);
const hash=new Set(['Python','PySpark','Ruby','Perl','R','Julia','Bash','PowerShell','Nim','Elixir','CoffeeScript','Raku']);
const dash=new Set(['SQL','PostgreSQL','MySQL','CQL','Haskell','Lua','Elm','Ada']);
const pascal=new Set(['Pascal','Delphi']);
export function syntaxSpec(language:string):Spec {
 if(!supportedLanguages.includes(language))throw new Error('Unsupported syntax language: '+language);
 const family=lisp.has(language)?'Lisp':['PostgreSQL','MySQL','CQL'].includes(language)?'SQL':language==='PySpark'?'Python':['Visual Basic','VB.NET','VBA','VB6'].includes(language)?'VBScript':pascal.has(language)?'Pascal':language;
 const extra=sets[family]??'';
 const line=lisp.has(language)?[';']:hash.has(language)?['#']:dash.has(language)?['--']:['Visual Basic','VBScript','VB.NET','VB6','VBA'].includes(language)?["'"]:['Assembly','Fortran','SAS'].includes(language)?language==='Assembly'?['#',';']:['!']:language==='MATLAB'?['%']:['//'];
 const block:readonly[string,string]=['OCaml','F#','Oberon+'].includes(language)?['(*','*)']:language==='Haskell'?['{-','-}']:language==='Lua'?['--[[',']]']:language==='HTML'?['<!--','-->']:pascal.has(language)?['{','}']:['/*','*/'];
 const insensitive=['SQL','PostgreSQL','MySQL','CQL','Visual Basic','VB.NET','VB6','VBA','VBScript','Pascal','Delphi','Ada','Fortran','COBOL','Redis','Oberon+'].includes(language);
 return {line,block,keywords:new Set((common+' '+extra).split(/\s+/).map(s=>insensitive?s.toLowerCase():s)),insensitive};
}
export const initialLexState=():LexState=>({closing:null,comment:false,depth:0,escaped:false});
/** Bounded lexical coloring; native parsers provide richer editor grammar where available. */
export function readSyntaxToken(line:string,start:number,state:LexState,spec:Spec):{end:number;kind:SyntaxKind}{
 let i=start;
 if(state.closing){
  while(i<line.length){if(!state.escaped&&line.startsWith(state.closing,i)){i+=state.closing.length;state.closing=null;state.escaped=false;return {end:i,kind:state.comment?'comment':'string'};}const c=line[i++];if(!state.comment)state.escaped=!state.escaped&&c==='\\';}
  const kind=state.comment?'comment':'string';if(!state.comment&&state.closing!=='`'&&state.closing.length===1){state.closing=null;state.escaped=false;}return {end:i,kind};
 }
 if(/\s/.test(line[i])){while(i<line.length&&/\s/.test(line[i]))i++;return {end:i,kind:'plain'};}
 if(spec.block&&line.startsWith(spec.block[0],i)){state.closing=spec.block[1];state.comment=true;const after=i+spec.block[0].length;return after===line.length?{end:after,kind:'comment'}:readSyntaxToken(line,after,state,spec);}
 if(spec.line.some(mark=>line.startsWith(mark,i)))return {end:line.length,kind:'comment'};
 const triple=['"""',"'''"].find(mark=>line.startsWith(mark,i));const quote=triple??(['"',"'",'`'].includes(line[i])?line[i]:null);
 if(quote){state.closing=quote;state.comment=false;state.escaped=false;const after=i+quote.length;if(after===line.length){if(quote.length===1&&quote!=='`')state.closing=null;return {end:after,kind:'string'};}return readSyntaxToken(line,after,state,spec);}
 const rest=line.slice(i),number=/^(?:0[xob][\da-f_]+|(?:\d[\d_]*\.?[\d_]*|\.\d+)(?:e[+-]?\d+)?)/i.exec(rest);
 if(number)return {end:i+number[0].length,kind:'number'};
 const word=/^[\p{L}_$][\p{L}\p{N}_$!?-]*/u.exec(rest);
 if(word){const value=spec.insensitive?word[0].toLowerCase():word[0];return {end:i+word[0].length,kind:spec.keywords.has(value)?'keyword':['true','false','null','nil','none'].includes(value.toLowerCase())?'atom':'plain'};}
 if(/[({[]/.test(line[i]))state.depth++;if(/[)}\]]/.test(line[i]))state.depth=Math.max(0,state.depth-1);
 return {end:i+1,kind:/[+*/%=!<>:&|?~^-]/.test(line[i])?'operator':'plain'};
}
export function syntaxChunks(code:string,language:string):SyntaxChunk[]{
 const spec=syntaxSpec(language),state=initialLexState(),chunks:SyntaxChunk[]=[];
 const append=(text:string,kind:SyntaxKind)=>{if(!text)return;const last=chunks.at(-1);if(last?.kind===kind)last.text+=text;else chunks.push({text,kind});};
 const lines=code.split('\n');for(let index=0;index<lines.length;index++){
  const line=lines[index];let position=0;while(position<line.length){const token=readSyntaxToken(line,position,state,spec);if(token.end<=position)throw new Error('Syntax scanner did not advance');append(line.slice(position,token.end),token.kind);position=token.end;}if(index<lines.length-1)append('\n',state.closing?(state.comment?'comment':'string'):'plain');
 }return chunks;
}
const aliases:Record<string,string>={'PySpark':'Python','MongoDB':'JavaScript','Elasticsearch':'JSON','Bash':'Shell','MATLAB':'Octave','Lisp':'Common Lisp','Racket':'Scheme','Visual Basic':'VBScript','VB6':'VBScript','VBA':'VBScript','Assembly':'Gas','ActionScript':'JavaScript','Delphi':'Pascal'};
export async function loadCodeLanguage(language:string){
 const spec=syntaxSpec(language),[{languages},cm]=await Promise.all([import('@codemirror/language-data'),import('@codemirror/language')]);
 const name=aliases[language]??language,native=languages.find(l=>l.name.toLowerCase()===name.toLowerCase()||l.alias.some(a=>a.toLowerCase()===name.toLowerCase()));
 if(native)return {support:await native.load(),mode:'native' as const};
 const parser=cm.StreamLanguage.define<LexState>({startState:initialLexState,copyState:s=>({...s}),token(stream,state){const start=stream.pos,token=readSyntaxToken(stream.string,start,state,spec);stream.pos=token.end;return token.kind==='plain'?null:token.kind;},indent(state,textAfter,context){return Math.max(0,state.depth-(/^[\])}]/.test(textAfter)?1:0))*context.unit;}});
 return {support:new cm.LanguageSupport(parser),mode:'lexical' as const};
}
