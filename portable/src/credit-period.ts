// UTC calendar months are anchored to the original billing day. Jan 31 -> Feb 28 -> Mar 31.
export function creditWindow(periodStart:string|Date,periodEnd:string|Date,now=Date.now()){
 const anchor=new Date(periodStart),end=new Date(periodEnd);
 if(!Number.isFinite(+anchor)||!Number.isFinite(+end)||+end<=+anchor||now<+anchor||now>=+end)return null;
 const at=(offset:number)=>{const day=anchor.getUTCDate();const d=new Date(anchor);d.setUTCDate(1);d.setUTCMonth(anchor.getUTCMonth()+offset);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d;};
 let offset=Math.max(0,(new Date(now).getUTCFullYear()-anchor.getUTCFullYear())*12+new Date(now).getUTCMonth()-anchor.getUTCMonth());
 if(+at(offset)>now)offset--;while(+at(offset+1)<=now)offset++;
 return {start:at(offset).toISOString(),end:new Date(Math.min(+end,+at(offset+1))).toISOString()};
}
