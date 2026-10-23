import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';

const [root,outputDir]=process.argv.slice(2);
if(!root||!outputDir)throw new Error('Pass the directory containing FEATURE_STATUS.json and an output directory');
await fs.mkdir(outputDir,{recursive:true});
const data=JSON.parse(await fs.readFile(`${root}/FEATURE_STATUS.json`,'utf8'));
const wb=Workbook.create();
const overview=wb.worksheets.add('Overview');
const backlog=wb.worksheets.add('Backlog');
const statusOrder=['Implemented','Partial','Blocked','Not started'];
const colors={Implemented:['#E8F3EC','#1C6B43'],Partial:['#FFF3D7','#8A5A00'],Blocked:['#FCE6E6','#A12B2B'],'Not started':['#EEF1F4','#4D5B67']};
for(const sheet of [overview,backlog]){
 sheet.showGridLines=false;
 sheet.getRange(sheet===overview?'A1:J39':`A1:N${data.tasks.length+6}`).format.font={name:'Arial',size:10,color:'#20313E'};
}
overview.tabColor='#17384A';
backlog.tabColor='#7E9CAC';
const widthMap={A:15,B:45,C:3,D:10,E:40,F:15,G:13,H:13,I:15,J:12};
for(const [col,width]of Object.entries(widthMap))overview.getRange(`${col}1:${col}39`).format.columnWidth=width;
overview.getRange('A2').values=[['FutureRobotic AI release status']];
overview.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:'#17384A'};
overview.getRange('A3').values=[[`${data.baseline}. ${data.build_tasks?.length??0} carried items reviewed.`]];
overview.getRange('A3').format.font={italic:true,color:'#5E6F7B'};
overview.getRange('A4').values=[['Reviewed']];
overview.getRange('B4').values=[[new Date('2026-10-22T00:00:00Z')]];
overview.getRange('B4').setNumberFormat('dd mmm yyyy');
overview.getRange('D3').values=[['Current release: owner-private preview. AWS production is not verified.']];
overview.getRange('D3').format.font={color:'#9A3028',bold:true};
overview.getRange('A6:B6').values=[['Status','Work items']];
overview.getRange('A7:A10').values=statusOrder.map(s=>[s]);
overview.getRange('B7:B10').formulas=statusOrder.map((_,i)=>[`=COUNTIFS('Backlog'!$E$7:$E$1006,A${i+7})`]);
overview.getRange('A11:A13').values=[['Classified items'],['Total items'],['Unclassified']];
overview.getRange('B11').formulas=[['=SUM(B7:B10)']];
overview.getRange('B12').formulas=[["=COUNTA('Backlog'!$A$7:$A$1006)"]];
overview.getRange('B13').formulas=[['=B12-B11']];
overview.getRange('B7:B13').setNumberFormat('0');
overview.getRange('B7:B13').format.horizontalAlignment='right';
overview.getRange('A11:B12').format.font={bold:true};
overview.getRange('A15').values=[['Scope']];
overview.getRange('B15').values=[['Work items']];
overview.getRange('A16:A19').values=[['Reference'],['Production'],['External'],['Delivery']];
overview.getRange('B16:B19').formulas=[16,17,18,19].map(r=>[`=COUNTIFS('Backlog'!$D$7:$D$1006,A${r})`]);
overview.getRange('B16:B19').setNumberFormat('0');
overview.getRange('A21').values=[['Counts are task counts, not a production-readiness percentage.']];
overview.getRange('A22').values=[['The Backlog sheet contains remaining work, evidence and acceptance criteria.']];
overview.getRange('A21:A22').format.font={italic:true,color:'#5E6F7B'};

overview.getRange('D6:J6').values=[['Phase','Work package','Implemented','Partial','Blocked','Not started','Total']];
overview.getRange('D7:E20').values=data.phases.map(p=>[p.id,p.name]);
for(let row=7;row<=20;row++){
 overview.getRange(`F${row}:I${row}`).formulas=[statusOrder.map((_,c)=>`=COUNTIFS('Backlog'!$F$7:$F$1006,$D${row},'Backlog'!$E$7:$E$1006,${String.fromCharCode(70+c)}$6)`)];
 overview.getRange(`J${row}`).formulas=[[`=SUM(F${row}:I${row})`]];
}
overview.getRange('D7:J20').format.rowHeight=30;
overview.getRange('E7:E20').format.wrapText=true;
overview.getRange('F7:J20').setNumberFormat('0');
overview.getRange('F7:J20').format.horizontalAlignment='right';

overview.getRange('A25:B25').values=[['Blocker','Operation awaiting access or approval']];
overview.getRange('A26:B34').values=data.blockers.map(b=>[b.id,b.title]);
overview.getRange('A26:B34').format.rowHeight=32;
overview.getRange('B26:B34').format.wrapText=true;
overview.getRange('D25').values=[['Remaining work']];
overview.getRange('D26').values=[['Remaining engineering: anonymous dispatch, typed API contracts, French UI, operator console and deployment bootstrap.']];
overview.getRange('D28').values=[['All 126 carried partial items reviewed. 23 implemented; 59 partial; 44 await external gates.']];
overview.getRange('D30').values=[['100 tests passed. Database tests use PostgreSQL WASM; native contention remains blocked.']];
overview.getRange('D32').values=[['Edit status/evidence by stable ID. See BUILD03_REPORT.md and ops/README.md.']];
overview.getRange('D34').values=[['Summary counts include up to 1,000 backlog rows. New tasks must keep unique IDs.']];
overview.getRange('D36').values=[['Portable account application delivered. The private preview still uses Worker/browser storage.']];
overview.getRange('D25').format.font={bold:true,color:'#17384A'};
overview.getRange('A38').values=[['Build source: see release-manifest.json for the exact source commit.']];
overview.getRange('A38').format.font={italic:true,color:'#5E6F7B'};

const headers=['ID','Feature or task','Category','Scope','Status','Phase','Priority','Owner','Current evidence','Remaining work','Acceptance criteria','Reference','Blockers','Reviewed'];
backlog.getRange('A2').values=[['FutureRobotic AI feature and release backlog']];
backlog.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:'#17384A'};
backlog.getRange('A3').values=[['Change Status, Evidence and Remaining work after each build. Keep task IDs stable.']];
backlog.getRange('A4').values=[['Implemented means the named scope has evidence. It does not establish AWS production readiness.']];
backlog.getRange('A3:A4').format.font={color:'#5E6F7B',italic:true};
backlog.getRange('A6:N6').values=[headers];
const matrix=data.tasks.map(t=>[t.id,t.feature,t.category,t.scope,t.status,t.phase,t.priority,t.owner,t.evidence,t.remaining_work,t.acceptance,t.reference,t.blockers,new Date(t.last_reviewed+'T00:00:00Z')]);
const end=6+matrix.length;
backlog.getRange(`A7:N${end}`).values=matrix;
const widths=[14,47,31,15,17,10,10,25,55,66,66,30,20,17];
for(let c=0;c<widths.length;c++){
 const col=String.fromCharCode(65+c);backlog.getRange(`${col}1:${col}${end}`).format.columnWidth=widths[c];
}
for(let i=0;i<matrix.length;i++){const lines=Math.max(...matrix[i].map((v,c)=>Math.ceil((v instanceof Date?12:String(v??'').length)/Math.max(10,widths[c]*1.2))));backlog.getRange(`A${i+7}:N${i+7}`).format.rowHeight=Math.max(66,lines*14+12);}
backlog.getRange(`A7:N${end}`).format.verticalAlignment='top';
backlog.getRange(`A7:N${end}`).format.wrapText=true;
backlog.getRange(`N7:N${end}`).setNumberFormat('dd mmm yyyy');
backlog.getRange(`A7:A${end}`).format.font={bold:true,color:'#17384A'};
backlog.getRange('E7:E1006').dataValidation={rule:{type:'list',values:statusOrder}};
backlog.getRange('G7:G1006').dataValidation={rule:{type:'list',values:['P0','P1']}};
backlog.getRange('E7:E1006').format.font={bold:true};
for(const [status,[fill,color]] of Object.entries(colors)){
 backlog.getRange('E7:E1006').conditionalFormats.addCustom(`$E7="${status}"`,{fill,font:{color,bold:true}});
}
const table=backlog.tables.add(`A6:N${end}`,true,'ReleaseBacklog');
table.style='TableStyleMedium2';table.showFilterButton=true;
backlog.freezePanes.freezeRows(6);backlog.freezePanes.freezeColumns(2);

for(const r of ['A6:B6','A15:B15','D6:J6','A25:B25']){
 overview.getRange(r).format={fill:'#17384A',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:30,verticalAlignment:'center',horizontalAlignment:'center',wrapText:true};
}
backlog.getRange('A6:N6').format={fill:'#17384A',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:32,verticalAlignment:'center',horizontalAlignment:'center',wrapText:true};
for(let i=0;i<statusOrder.length;i++){
 const [fill,color]=colors[statusOrder[i]];overview.getRange(`A${i+7}:B${i+7}`).format.fill=fill;overview.getRange(`A${i+7}`).format.font={color,bold:true};
}
overview.getRange('B13').conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:'#FCE6E6',font:{color:'#A12B2B',bold:true}}});
overview.getRange('A7:B19').format.rowHeight=25;
overview.getRange('A2:J2').format.rowHeight=28;
overview.getRange('A4:J4').format.rowHeight=24;
overview.getRange('A21:J22').format.rowHeight=23;

wb.recalculate();
const countValues=()=>overview.getRange('B7:B10').values.map(r=>r[0]);
assert.deepEqual(countValues(),statusOrder.map(s=>data.totals[s]||0));
assert.equal(overview.getRange('B12').values[0][0],data.total_tasks);
assert.equal(overview.getRange('B13').values[0][0],0);
// Meaningful edit test: status counts update but other blocked operations remain visible.
const oldStatus=backlog.getRange('E7').values[0][0];
backlog.getRange('E7').values=[['Implemented']];wb.recalculate();
assert.equal(overview.getRange('B7').values[0][0],data.totals.Implemented+1);
assert.equal(overview.getRange('B9').values[0][0],data.totals.Blocked-1);
assert.ok(overview.getRange('B9').values[0][0]>0);
backlog.getRange('E7').values=[[oldStatus]];
// Future-row test: bounded summaries include a newly added task, then restore the artifact.
const next=end+1;
backlog.getRange(`A${next}:F${next}`).values=[['TEST-APPEND','Temporary extension check','Test','Production','Partial','P01']];wb.recalculate();
assert.equal(overview.getRange('B8').values[0][0],data.totals.Partial+1);
assert.equal(overview.getRange('B12').values[0][0],data.total_tasks+1);
backlog.getRange(`A${next}:F${next}`).clear({applyTo:'contents'});
wb.recalculate();
assert.deepEqual(countValues(),statusOrder.map(s=>data.totals[s]||0));
assert.equal(overview.getRange('B12').values[0][0],data.total_tasks);
const phaseTotal=overview.getRange('J7:J20').values.reduce((sum,r)=>sum+Number(r[0]),0);
assert.equal(phaseTotal,data.total_tasks);

const inspect=await wb.inspect({kind:'table',range:'Overview!A6:B13',include:'values,formulas',tableMaxRows:8,tableMaxCols:2,maxChars:3500});
console.log(inspect.ndjson);
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'final formula error scan',maxChars:2000});
console.log(errors.ndjson);
for(const [sheetName,range,file]of [['Overview','A1:J38','status-overview.png'],['Backlog','A1:H13','backlog-left.png'],['Backlog','I6:N12','backlog-evidence.png']]){
 if(sheetName==='Overview'&&process.env.BACKLOG_ONLY_RENDER==='1')continue;
 const preview=await wb.render({sheetName,range,scale:1,format:'png'});
 await fs.writeFile(`${outputDir}/${file}`,new Uint8Array(await preview.arrayBuffer()));
}
const output=await SpreadsheetFile.exportXlsx(wb);
await output.save(`${outputDir}/FutureRobotic_AI_Status_BUILD03.xlsx`);

await fs.writeFile(`${outputDir}/workbook-checks.json`,JSON.stringify({counts:data.totals,taskTotal:data.total_tasks,phaseTotal,statusEditRecalculated:true,appendedRowRecalculated:true,restored:true},null,2));
console.log(JSON.stringify({output:`${outputDir}/FutureRobotic_AI_Status_BUILD03.xlsx`,counts:data.totals,taskTotal:data.total_tasks}));
