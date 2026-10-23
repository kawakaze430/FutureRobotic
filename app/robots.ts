import {approvedPublicOrigin} from '../lib/seo';
export default function robots(){const origin=approvedPublicOrigin(),approved=!!origin&&process.env.PUBLIC_INDEXING_APPROVED==='true';return {rules:approved?{userAgent:'*',allow:'/',disallow:['/workspace','/shared','/v1/','/auth/','/api/']}:{userAgent:'*',disallow:'/'},sitemap:approved?origin+'/sitemap.xml':undefined};}
