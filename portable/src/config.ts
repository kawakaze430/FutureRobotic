import { readFileSync } from 'node:fs';
import { Postgres } from './db.js';
export function databaseFromEnvironment() {
  const connectionString=process.env.DATABASE_URL??(process.env.DB_HOSTNAME&&process.env.DB_PASSWORD?`postgresql://${encodeURIComponent(process.env.DB_USERNAME??'fr_runtime')}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOSTNAME}:${process.env.DB_PORT??'5432'}/${encodeURIComponent(process.env.DB_DATABASE??'futurerobotic')}`:undefined);
  if(!connectionString)throw new Error('DATABASE_URL is required');
  let url:URL;
  try{url=new URL(connectionString);}catch{throw new Error('DATABASE_URL is invalid');}
  if(!['postgres:','postgresql:'].includes(url.protocol))throw new Error('PostgreSQL URL required');
  const production=process.env.NODE_ENV==='production';
  const hasSslOverride=['ssl','sslmode','sslcert','sslkey','sslrootcert'].some(key=>url.searchParams.has(key));
  if(production&&(!process.env.PG_CA_FILE||hasSslOverride))throw new Error('Production requires PG_CA_FILE; remove URL SSL overrides');
  const max=Number(process.env.DB_POOL_MAX??10);
  if(!Number.isInteger(max)||max<1||max>100)throw new Error('DB_POOL_MAX must be an integer from 1 to 100');
  return new Postgres({connectionString,max,ssl:production?{rejectUnauthorized:true,ca:readFileSync(process.env.PG_CA_FILE!,'utf8')}:undefined});
}
