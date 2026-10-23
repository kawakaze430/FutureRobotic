import {PDFDocument,rgb,type PDFFont} from 'pdf-lib';
import {characters} from './input-policy';
import fontkit from '@pdf-lib/fontkit';
import {valid,type PDFOptions} from './pdf-options';
export * from './pdf-options';
function splitLine(text:string,font:PDFFont,size:number,width:number){
 const result:string[]=[];let current='';for(const char of Array.from(text)){if(current&&font.widthOfTextAtSize(current+char,size)>width){result.push(current);current='';}current+=char;}result.push(current);return result;
}
export async function exportCodePDF(code:string,options:PDFOptions,fontBytes?:Uint8Array){
 valid(options);if(characters(code)>50000)throw new Error('PDF export supports up to 50,000 characters.');
 const document=await PDFDocument.create();document.registerFontkit(fontkit);
 if(!fontBytes){const r=await fetch('/fonts/DejaVuSansMono.ttf');if(!r.ok)throw new Error('The PDF font could not be loaded.');fontBytes=new Uint8Array(await r.arrayBuffer());}
 const font=await document.embedFont(fontBytes,{subset:true});const supported=new Set(font.getCharacterSet());
 const combined=(options.includeTitle!==false?options.title:'')+options.language+code;
 if(Array.from(combined).some(c=>!['\n','\r','\t'].includes(c)&&!supported.has(c.codePointAt(0)!)))throw new Error('Some characters need another font. Use Print to PDF to preserve them with your system fonts.');
 const dark=options.theme==='dark',background=dark?rgb(.06,.075,.09):rgb(1,1,1),foreground=dark?rgb(.88,.92,.95):rgb(.10,.15,.18),muted=dark?rgb(.55,.65,.68):rgb(.35,.43,.46);
 const width=595.28,height=841.89,margin=options.margin,lineHeight=options.fontSize*1.55;
 const lines=code.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n').flatMap((line,i)=>splitLine(`${options.lineNumbers?String(i+1).padStart(4)+'  ':''}${line}`,font,options.fontSize,width-2*margin));
 const perPage=Math.max(1,Math.floor((height-2*margin-58)/lineHeight)),pages=Math.max(1,Math.ceil(lines.length/perPage));
 for(let i=0;i<pages;i++){
  const page=document.addPage([width,height]);page.drawRectangle({x:0,y:0,width,height,color:background});
  if(options.includeTitle!==false){const title=splitLine(options.title,font,12,width-2*margin)[0];page.drawText(title,{x:margin,y:height-margin-13,font,size:12,color:foreground});}
  page.drawText(`${options.language} / ${i+1} of ${pages}`,{x:margin,y:height-margin-32,font,size:8,color:muted});
  lines.slice(i*perPage,(i+1)*perPage).forEach((line,n)=>page.drawText(line,{x:margin,y:height-margin-55-n*lineHeight,font,size:options.fontSize,color:foreground}));
 }
 document.setTitle(options.title);document.setCreator('FutureRobotic AI');return new Blob([new Uint8Array(await document.save())],{type:'application/pdf'});
}
