import { inflateSync } from 'fflate';
import { excludedFile, supportedTextExtensions } from './product-policy.js';
export interface ArchiveEntry {name:string;bytes:Uint8Array;size:number;method:number;crc:number;excluded:boolean}
const MAX_ARCHIVE=2_000_000,MAX_TOTAL=2_000_000,MAX_FILE=100_000,MAX_FILES=100;
export function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
const bad=(message:string):never=>{throw new Error(message);};
export function inspectZip(input:Uint8Array):ArchiveEntry[]{
 if(input.length>MAX_ARCHIVE||input.length<22)bad('ZIP must be smaller than 2 MB and use the standard ZIP format.');
 const d=new DataView(input.buffer,input.byteOffset,input.byteLength),u16=(n:number)=>d.getUint16(n,true),u32=(n:number)=>d.getUint32(n,true);
 let end=-1;for(let i=input.length-22;i>=Math.max(0,input.length-65557);i--)if(u32(i)===0x06054b50&&i+22+u16(i+20)===input.length){end=i;break;}
 if(end<0)bad('Invalid ZIP directory.');
 const count=u16(end+10),start=u32(end+16),directorySize=u32(end+12);
 if(u16(end+4)||u16(end+6)||u16(end+8)!==count||count>MAX_FILES||start+directorySize!==end)bad('Split, ZIP64, oversized or inconsistent archives are not accepted.');
 const result:ArchiveEntry[]=[],seen=new Set<string>();let offset=start,total=0;
 for(let i=0;i<count;i++){
  if(offset+46>end||u32(offset)!==0x02014b50)bad('Invalid ZIP entry.');
  const flags=u16(offset+8),method=u16(offset+10),crc=u32(offset+16),compressed=u32(offset+20),size=u32(offset+24),n=u16(offset+28),extra=u16(offset+30),comment=u16(offset+32),local=u32(offset+42),attributes=u32(offset+38);
  if(offset+46+n+extra+comment>end)bad('Invalid ZIP directory lengths.');
  const name=new TextDecoder('utf-8',{fatal:true}).decode(input.subarray(offset+46,offset+46+n)).normalize('NFC');
  if(!name||name.length>240||/[\\\x00-\x1f:]/.test(name)||name.startsWith('/')||name.split('/').some(p=>p==='..'||p==='.')||(attributes>>>16&0xf000)===0xa000)bad('Unsafe archive path or symbolic link.');
  const canonical=name.toLowerCase();if(seen.has(canonical))bad('Duplicate archive paths.');seen.add(canonical);
  if(flags&1||![0,8].includes(method)||size===0xffffffff||compressed===0xffffffff||local+30>start||u32(local)!==0x04034b50)bad('Unsupported ZIP encoding, encryption or size.');
  const ln=u16(local+26),le=u16(local+28),dataStart=local+30+ln+le;
  const localName=new TextDecoder('utf-8',{fatal:true}).decode(input.subarray(local+30,local+30+ln)).normalize('NFC');
  if(localName!==name||u16(local+8)!==method||dataStart+compressed>start)bad('ZIP local header does not match its directory.');
  const directory=name.endsWith('/'),excluded=directory||excludedFile(name);
  if(size>MAX_FILE||size>Math.max(1000,compressed*100)||(total+=size)>MAX_TOTAL)bad('Archive expansion limit exceeded.');
  if(!excluded){const extension=name.split('/').at(-1)!.split('.').pop()!.toLowerCase();if(!supportedTextExtensions.has(extension))bad(`Unsupported project file: ${name}`);}
  result.push({name,bytes:input.subarray(dataStart,dataStart+compressed),size,method,crc,excluded});offset+=46+n+extra+comment;
 }
 if(offset!==end)bad('Unexpected ZIP directory data.');return result;
}
export function importProjectZip(input:Uint8Array){
 const files:{name:string;content:string;size:number}[]=[],excluded:string[]=[];
 for(const entry of inspectZip(input)){
  if(entry.excluded){excluded.push(entry.name);continue;}
  // Fixed output buffers bound browser decompression memory. Server import additionally
  // uses zlib maxOutputLength and must revalidate before accepting uploaded context.
  const bytes=entry.method===0?entry.bytes:inflateSync(entry.bytes,{out:new Uint8Array(entry.size)});
  if(bytes.length!==entry.size||crc32(bytes)!==entry.crc)bad('ZIP checksum or expanded length mismatch.');
  const content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(content.includes('\0'))bad('Binary files are not accepted as code context.');
  files.push({name:entry.name,content,size:bytes.length});
 }return {files,excluded};
}
