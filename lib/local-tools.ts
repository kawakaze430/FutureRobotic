import {samples} from './studio-data';

export function exampleConversion(input:string,source:string,target:string){
  const normalize=(s:string)=>s.trim().replace(/\r\n/g,'\n');
  for(const sample of samples){
    if(source===sample.source&&target===sample.target&&normalize(input)===normalize(sample.input))return {code:sample.output,note:sample.note};
    if(source===sample.target&&target===sample.source&&normalize(input)===normalize(sample.output))return {code:sample.input,note:'Reverse translation from the built-in example library.'};
  }
  return null;
}
export function detectLanguage(name:string){
  const map:Record<string,string>={py:'Python',js:'JavaScript',mjs:'JavaScript',jsx:'JavaScript',ts:'TypeScript',tsx:'TypeScript',java:'Java',cpp:'C++',c:'C',cs:'C#',go:'Go',rs:'Rust',rb:'Ruby',php:'PHP',swift:'Swift',kt:'Kotlin',dart:'Dart',sql:'SQL',html:'HTML',css:'CSS',sh:'Bash',ps1:'PowerShell',r:'R'};
  return map[name.split('.').pop()?.toLowerCase()||'']||'JavaScript';
}
export function removeComments(code:string,language:string):string{
  const hash=['Python','Ruby','Bash','PowerShell','R','Perl','Julia','Tcl'].includes(language);
  const sql=['SQL','PostgreSQL','MySQL'].includes(language);
  const slash=['JavaScript','TypeScript','Java','C++','C','C#','Go','Rust','PHP','Swift','Kotlin','Dart','Scala','CSS','Groovy','Solidity'].includes(language);
  if(!hash&&!sql&&!slash)throw new Error('Local comment removal supports Python, JavaScript, TypeScript, C-family languages, SQL, Ruby, Bash, R, and related languages. Choose a supported language.');
  let out='',i=0,previous='';
  while(i<code.length){
    const c=code[i],next=code[i+1];
    // Preserve a shell shebang. In Python, triple-quoted strings are code too.
    if(i===0&&c==='#'&&next==='!'){const end=code.indexOf('\n',i);if(end<0)return code;out+=code.slice(0,end);i=end;continue;}
    if(c==='"'||c==="'"||(!sql&&c==='`')){
      const triple=hash&&code.slice(i,i+3)===c.repeat(3);
      const quote=triple?c.repeat(3):c;out+=quote;i+=quote.length;
      while(i<code.length){
        if(code[i]==='\\'){out+=code.slice(i,i+2);i+=2;continue;}
        if(code.slice(i,i+quote.length)===quote){
          out+=quote;i+=quote.length;
          if(sql&&code[i]===c){out+=code[i++];continue;}
          break;
        }
        out+=code[i++];
      }
      previous='string';continue;
    }
    if((hash&&c==='#')||(sql&&c==='-'&&next==='-')||(slash&&c==='/'&&next==='/')){
      while(i<code.length&&code[i]!=='\n')i++;
      continue;
    }
    if((slash||sql)&&c==='/'&&next==='*'){
      out+=' ';i+=2;
      while(i<code.length&&!(code[i]==='*'&&code[i+1]==='/')){if(code[i]==='\n')out+='\n';i++;}
      i=Math.min(i+2,code.length);continue;
    }
    // A JavaScript regex literal may contain slashes or comment-like text.
    if((language==='JavaScript'||language==='TypeScript')&&c==='/'&&(!previous||/[=(:,!&|?;{}\[]/.test(previous)||previous==='return')){
      out+=c;i++;let charClass=false;
      while(i<code.length){const ch=code[i];out+=ch;i++;if(ch==='\\'){out+=code[i++]||'';continue;}if(ch==='[')charClass=true;if(ch===']')charClass=false;if(ch==='/'&&!charClass)break;}
      previous='regex';continue;
    }
    out+=c;i++;
    if(/[A-Za-z_$]/.test(c)){let token=c;while(i<code.length&&/[\w$]/.test(code[i])){token+=code[i];out+=code[i++];}previous=token;}
    else if(!/\s/.test(c))previous=c;
  }
  return out.split('\n').map(l=>l.replace(/[ \t]+$/,'')).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}

export function downloadText(text:string,name:string,mime='text/plain;charset=utf-8'){
  downloadBlob(new Blob([text],{type:mime}),name);
}
export function downloadBlob(blob:Blob,name:string){
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}

// A compact, multi-page PDF writer. Code is escaped before insertion into PDF strings.
export function codePDF(code:string,title='FutureRobotic AI',language='Code',lineNumbers=true):Blob{
  const ascii=(s:string)=>Array.from(s).map(c=>c.charCodeAt(0)>126||c.charCodeAt(0)<32?'?':c).join('');
  const escape=(s:string)=>ascii(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  const lines:string[]=[];code.replace(/\t/g,'    ').split('\n').forEach((l,i)=>{const prefix=lineNumbers?`${String(i+1).padStart(3,' ')}  `:'';const text=prefix+l;if(!text.length)lines.push('');else for(let j=0;j<text.length;j+=96)lines.push(text.slice(j,j+96));});
  const pages:string[][]=[];for(let i=0;i<lines.length;i+=53)pages.push(lines.slice(i,i+53));if(!pages.length)pages.push(['']);
  const objects:string[]=[];const pageIds=pages.map((_,i)=>5+i*2);
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  pages.forEach((lines,i)=>{
    const content=`0.07 0.31 0.23 rg\nBT /F2 14 Tf 46 793 Td (${escape(title)}) Tj ET\n0.4 0.4 0.4 rg\nBT /F1 9 Tf 46 772 Td (${escape(language)} - page ${i+1} of ${pages.length}) Tj ET\n0.14 0.16 0.15 rg\nBT /F1 8.5 Tf 12 TL 46 747 Td\n${lines.map(l=>`(${escape(l)}) Tj T*`).join('\n')}\nET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6+i*2} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const xref=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf],{type:'application/pdf'});
}
