'use client';
import React,{useEffect,useState} from 'react';
import {ReferenceBrand} from './reference-home';
import {cloudRequest} from '../lib/cloud-workspace';
import {MarkdownResult} from './result-reading';
export default function SharedResult(){const [result,setResult]=useState<{result:string;language:string;expires_at:string}|null>(null),[error,setError]=useState('');useEffect(()=>{const token=new URLSearchParams(window.location.hash.slice(1)).get('token')??'';if(!token){setError('This share link is incomplete.');return;}cloudRequest('/v1/public/shares/resolve','POST',{token}).then(setResult).catch(()=>setError('This share link is unavailable, expired or revoked.'));},[]);return <main className="shared-result-page wrap"><ReferenceBrand/><h1>Shared code result</h1>{error?<p role="alert">{error}</p>:result?<><p>Read-only snapshot · {result.language} · Expires {new Date(result.expires_at).toLocaleString()}</p><MarkdownResult content={'```'+result.language+'\n'+result.result+'\n```'}/></>:<p>Loading the shared result…</p>}</main>;}
