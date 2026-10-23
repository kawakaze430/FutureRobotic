export const planCatalog = [
 {id:'free',name:'Free',monthly:0,yearly:0,advancedCredits:5,contextLimit:25000,fileLimit:0},
 {id:'pro',name:'Pro',monthly:1900,yearly:12000,advancedCredits:50,contextLimit:25000,fileLimit:100},
 {id:'premium',name:'Premium',monthly:3900,yearly:24000,advancedCredits:200,contextLimit:100000,fileLimit:250},
] as const;
export const modelCatalog = [
 {id:'standard-auto',name:'Auto · Standard',tier:'standard',minimumPlan:'free',maxOutputTokens:4096,retention:'Provider data policy must be approved before this route is enabled.'},
 {id:'advanced-code',name:'Advanced · Code',tier:'advanced',minimumPlan:'pro',maxOutputTokens:8192,retention:'Provider data policy must be approved before this route is enabled.'},
] as const;
export type ModelId=typeof modelCatalog[number]['id'];
export const excludedFolders=new Set(['node_modules','.git','.svn','.hg','.next','.nuxt','.cache','.venv','venv','__pycache__','dist','build','coverage','vendor','target','.idea','.vscode']);
export const excludedFile=(path:string)=>path.split('/').some(p=>excludedFolders.has(p.toLowerCase()))||/(^|\/)\.env(?:\.|$)|\.(?:pem|key|p12|pfx)$|(^|\/)id_(rsa|ed25519)$/i.test(path);
export const supportedTextExtensions=new Set('txt md markdown json jsonc js mjs cjs jsx ts tsx py pyw java c h cc cpp hpp cs go rs rb php swift kt kts dart sql html htm css scss sass less sh bash zsh ps1 r rmd yaml yml toml xml csv tsv ini cfg conf env-example vue svelte ex exs erl hrl hs lhs lua pl pm jl scala groovy sol clj cljs cljc edn fs fsx vb vbs bat cmd dockerfile makefile cmake tex rst proto graphql gql'.split(' '));
