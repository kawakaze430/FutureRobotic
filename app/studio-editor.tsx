'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {EditorView} from '@codemirror/view';
import {characters} from '../lib/input-policy';
import {loadCodeLanguage} from '../lib/code-syntax';
type Props={value:string;onChange:(value:string)=>void;language:string;label?:string;dark?:boolean;lineNumbers?:boolean;fontSize?:number;limit:number;onRun?:()=>void;placeholder?:string;readOnly?:boolean};
// Load grammars in the browser. Plain text stays usable if an extension cannot load.
export default function StudioEditor(props:Props){
 const host=useRef<HTMLDivElement>(null),view=useRef<EditorView|null>(null),current=useRef(props);
 current.current=props;
 const [limitMessage,setLimitMessage]=useState('');
 const [plain,setPlain]=useState(false),[ready,setReady]=useState(false),[grammar,setGrammar]=useState('Loading syntax…');
 const reconfigure=useRef<(()=>void)|null>(null);
 useEffect(()=>{
  if(plain)return;let alive=true;
  void Promise.all([import('codemirror'),import('@codemirror/state'),import('@codemirror/view'),import('@codemirror/commands'),import('@codemirror/language-data'),import('@codemirror/theme-one-dark')]).then(async([cm,state,ui,commands,data,theme])=>{
   if(!alive||!host.current)return;
   const options=new state.Compartment(),syntax=new state.Compartment();let generation=0;
   const configure=()=>{
    const p=current.current;
    view.current?.dispatch({effects:options.reconfigure([
     p.dark?theme.oneDark:[],p.lineNumbers!==false?ui.lineNumbers():[],
     ui.EditorView.theme({'&':{fontSize:`${p.fontSize??13}px`},'.cm-content':{fontFamily:'ui-monospace, SFMono-Regular, Consolas, monospace',minHeight:'300px'},'.cm-scroller':{overflow:'auto'},'.cm-gutters':{border:'none'}}),
     ui.EditorView.contentAttributes.of({'aria-label':p.label??'Source code',spellcheck:'false','aria-description':`Limit ${p.limit.toLocaleString()} characters. Control or Command Enter runs the tool. Escape then Tab leaves the editor.`}),
     state.EditorState.readOnly.of(!!p.readOnly),ui.EditorView.editable.of(!p.readOnly),
     ui.placeholder(p.placeholder??'Your input code here'),
    ])});
    const next=++generation;
    void loadCodeLanguage(p.language).then(({support,mode})=>{if(alive&&next===generation){view.current?.dispatch({effects:syntax.reconfigure(support)});setGrammar(`${p.language} ${mode==='native'?'syntax':'lexical syntax'}`);}}).catch(()=>{if(alive&&next===generation){view.current?.dispatch({effects:syntax.reconfigure([])});setGrammar(`${p.language} · syntax unavailable; use plain text`);}});
   };
   const basic=cm.minimalSetup;
   const v=new ui.EditorView({parent:host.current,state:state.EditorState.create({doc:current.current.value,extensions:[basic,options.of([]),syntax.of([]),
    ui.keymap.of([...commands.defaultKeymap,{key:'Mod-Enter',run:()=>{current.current.onRun?.();return true;}},{key:'Tab',run:commands.indentMore},{key:'Shift-Tab',run:commands.indentLess}]),
    state.EditorState.transactionFilter.of(tr=>{const p=current.current;if(tr.docChanged&&tr.annotation(state.Transaction.userEvent)&&characters(tr.newDoc.toString())>p.limit&&tr.newDoc.length>tr.startState.doc.length){setLimitMessage(`Input limit reached: ${p.limit.toLocaleString()} characters.`);return [];}if(tr.docChanged)setLimitMessage('');return tr;}),
    ui.EditorView.updateListener.of(update=>{if(update.docChanged)current.current.onChange(update.state.doc.toString());}),
   ]})});
   view.current=v;reconfigure.current=configure;configure();setReady(true);
  }).catch(()=>{if(alive){setPlain(true);setGrammar('Plain text editor');}});
  return()=>{alive=false;view.current?.destroy();view.current=null;reconfigure.current=null;setReady(false);};
 },[plain]);
 useEffect(()=>{const v=view.current;if(v&&v.state.doc.toString()!==props.value)v.dispatch({changes:{from:0,to:v.state.doc.length,insert:props.value}});},[props.value,ready]);
 useEffect(()=>{reconfigure.current?.();},[props.language,props.dark,props.lineNumbers,props.fontSize,props.limit,props.readOnly,ready]);
 return <div className={`studio-code-editor ${props.dark?'studio-dark':''}`}><div className="studio-editor-status"><small>{limitMessage|| (plain?'Plain text editor':grammar)}</small><button type="button" aria-pressed={plain} onClick={()=>setPlain(v=>!v)}>{plain?'Use code editor':'Use plain text'}</button></div><div ref={host} hidden={plain||!ready}/>{(plain||!ready)&&<textarea aria-label={props.label??'Source code'} value={props.value} readOnly={props.readOnly} spellCheck={false} placeholder={props.placeholder??'Your input code here'} onChange={e=>{if(characters(e.target.value)<=props.limit||e.target.value.length<props.value.length){props.onChange(e.target.value);setLimitMessage('');}else setLimitMessage(`Input limit reached: ${props.limit.toLocaleString()} characters.`);}} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();props.onRun?.();}}}/>}</div>;
}
