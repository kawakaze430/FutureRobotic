'use client';
import {useEffect,useRef,type RefObject} from 'react';
/** Trap focus and make only background siblings inert; restore prior attributes. */
export function useDialogFocus(ref:RefObject<HTMLElement|null>,onClose:()=>void){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  const dialog=ref.current;if(!dialog)return;const previous=document.activeElement as HTMLElement|null;
  const altered:{element:HTMLElement;inert:boolean;hidden:string|null}[]=[];
  let child:HTMLElement=dialog;
  while(child.parentElement){const parent=child.parentElement;for(const sibling of Array.from(parent.children)){if(sibling===child||!(sibling instanceof HTMLElement))continue;altered.push({element:sibling,inert:sibling.inert,hidden:sibling.getAttribute('aria-hidden')});sibling.inert=true;sibling.setAttribute('aria-hidden','true');}if(parent===document.body)break;child=parent;}
  const focusable=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),iframe,[tabindex="0"]')).filter(element=>!element.hidden&&element.getClientRects().length>0);
  const first=()=>focusable()[0];first()?.focus();
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close.current();}if(event.key==='Tab'){const elements=focusable(),start=elements[0],end=elements.at(-1);if(event.shiftKey&&document.activeElement===start){event.preventDefault();end?.focus();}else if(!event.shiftKey&&document.activeElement===end){event.preventDefault();start?.focus();}}};
  const focus=(event:FocusEvent)=>{if(event.target instanceof Node&&!dialog.contains(event.target))first()?.focus();};
  document.addEventListener('keydown',key);document.addEventListener('focusin',focus);
  return()=>{document.removeEventListener('keydown',key);document.removeEventListener('focusin',focus);for(const {element,inert,hidden}of altered){element.inert=inert;if(hidden===null)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden',hidden);}previous?.focus();};
 },[ref]);
}
