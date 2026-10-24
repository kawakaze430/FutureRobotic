import {PDFDocument,rgb,type PDFFont} from 'pdf-lib';
import {characters} from './input-policy';
import fontkit from '@pdf-lib/fontkit';
import {syntaxChunks,type SyntaxChunk,type SyntaxKind} from './code-syntax';
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
 const text=code.replace(/\r\n?/g,'\n').replace(/\t/g,'    ');
 const chunks=options.language==='Code'?[{text,kind:'plain' as const}]:syntaxChunks(text,options.language);
 const lines:SyntaxChunk[][]=[[]];let used=0,lineNumber=1;
 const append=(text:string,kind:SyntaxKind)=>{const row=lines.at(-1)!,previous=row.at(-1);if(previous?.kind===kind)previous.text+=text;else row.push({text,kind});};
 const number=()=>{if(options.lineNumbers){const prefix=String(lineNumber).padStart(4)+'  ';append(prefix,'plain');used=font.widthOfTextAtSize(prefix,options.fontSize);}};number();
 for(const chunk of chunks)for(const char of Array.from(chunk.text)){
  if(char==='\n'){lines.push([]);used=0;lineNumber++;number();continue;}
  const advance=font.widthOfTextAtSize(char,options.fontSize);if(used+advance>width-2*margin&&used>0){lines.push([]);used=0;}
  append(char,chunk.kind);used+=advance;
 }
 const colors:Record<SyntaxKind,ReturnType<typeof rgb>>={plain:foreground,keyword:dark?rgb(.77,.59,.96):rgb(.5,.22,.68),string:dark?rgb(.54,.83,.62):rgb(.09,.43,.25),comment:muted,number:dark?rgb(.98,.74,.45):rgb(.68,.34,.1),atom:dark?rgb(.98,.74,.45):rgb(.68,.34,.1),operator:dark?rgb(.45,.75,.88):rgb(.16,.41,.55)};
 const perPage=Math.max(1,Math.floor((height-2*margin-58)/lineHeight)),pages=Math.max(1,Math.ceil(lines.length/perPage));
 for(let i=0;i<pages;i++){
  const page=document.addPage([width,height]);page.drawRectangle({x:0,y:0,width,height,color:background});
  if(options.includeTitle!==false){const title=splitLine(options.title,font,12,width-2*margin)[0];page.drawText(title,{x:margin,y:height-margin-13,font,size:12,color:foreground});}
  page.drawText(`${options.language} / ${i+1} of ${pages}`,{x:margin,y:height-margin-32,font,size:8,color:muted});
  lines.slice(i*perPage,(i+1)*perPage).forEach((line,n)=>{let x=margin;for(const segment of line){page.drawText(segment.text,{x,y:height-margin-55-n*lineHeight,font,size:options.fontSize,color:colors[segment.kind]});x+=font.widthOfTextAtSize(segment.text,options.fontSize);}});
 }
 document.setTitle(options.title);document.setCreator('FutureRobotic AI');return new Blob([new Uint8Array(await document.save())],{type:'application/pdf'});
}
