export function approvedPublicOrigin(){
 const value=process.env.PUBLIC_SITE_URL;if(!value)return null;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash?url.origin:null;}catch{return null;}
}
export function pageSEO(path:string){const origin=approvedPublicOrigin(),index=!!origin&&process.env.PUBLIC_INDEXING_APPROVED==='true';return {alternates:origin?{canonical:origin+path}:undefined,robots:{index,follow:index}};}
