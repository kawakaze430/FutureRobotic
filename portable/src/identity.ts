import type { Db } from './db.js';
import { audit, fail, hash, id, iso, lock, token, type Principal } from './common.js';

// Only a server-side OAuth/OTP verification adapter may call this service.
// No HTTP endpoint accepts claims, user IDs or an email_verified flag from clients.
export interface VerifiedIdentity { issuer: 'google'|'github'|'email'; subject:string; email:string; emailVerified:true }
export class IdentityService {
  constructor(private db:Db) {}
  async establish(claim:VerifiedIdentity, link?:{principal:Principal; reauthenticatedAt:number}) {
    const email=claim.email.trim().toLowerCase();
    if (!claim.emailVerified || !['google','github','email'].includes(claim.issuer) || !claim.subject || claim.subject.length>200 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('UNVERIFIED_IDENTITY',401);
    return this.db.transaction(async tx => {
      await lock(tx,`identity:${claim.issuer}:${claim.subject}`);
      const existing=await tx.query('SELECT user_id FROM identities WHERE issuer=$1 AND subject=$2',[claim.issuer,claim.subject]);
      if (existing.rowCount) {
        if(link && existing.rows[0].user_id!==link.principal.userId) fail('IDENTITY_ALREADY_LINKED',409);
        return this.principal(tx,existing.rows[0].user_id);
      }
      // Serialize email creation too; matching email alone never links accounts.
      await lock(tx,`email:${email}`);
      const match=await tx.query('SELECT id FROM users WHERE email=$1',[email]);
      let p:Principal;
      if (link) {
        if (Date.now()-link.reauthenticatedAt>5*60000 || link.reauthenticatedAt>Date.now() || !Number.isFinite(link.reauthenticatedAt)) fail('REAUTHENTICATION_REQUIRED',401);
        const active=await tx.query('SELECT id FROM sessions WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>now()',[link.principal.sessionId,link.principal.userId]);
        if(!active.rowCount || (match.rowCount && match.rows[0].id!==link.principal.userId)) fail('IDENTITY_LINK_CONFLICT',409);
        p=await this.principal(tx,link.principal.userId);
      } else {
        if(match.rowCount) fail('EXPLICIT_IDENTITY_LINK_REQUIRED',409);
        const userId=id(),workspaceId=id();
        await tx.query('INSERT INTO users(id,email) VALUES($1,$2)',[userId,email]);
        await tx.query('INSERT INTO workspaces(id,owner_id) VALUES($1,$2)',[workspaceId,userId]);
        p={userId,workspaceId,sessionId:''};
      }
      await tx.query('INSERT INTO identities(id,user_id,issuer,subject,verified_email) VALUES($1,$2,$3,$4,$5)',[id(),p.userId,claim.issuer,claim.subject,email]);
      await audit(tx,p,link?'identity.linked':'account.created',p.userId,'identity');
      return p;
    });
  }
  private async principal(tx:Db,userId:string):Promise<Principal> {
    const r=await tx.query('SELECT w.id FROM workspaces w JOIN users u ON w.owner_id=u.id WHERE u.id=$1 AND u.status=\'active\'',[userId]);
    if(!r.rowCount) fail('ACCOUNT_UNAVAILABLE',401);
    return {userId,workspaceId:r.rows[0].id,sessionId:''};
  }
  async createSession(userId:string,previousSessionId?:string) {
    const sessionToken=token(),csrfToken=token(),sessionId=id();
    await this.db.transaction(async tx=>{
      const u=await tx.query('SELECT id FROM users WHERE id=$1 AND status=\'active\' FOR UPDATE',[userId]);
      if(!u.rowCount) fail('ACCOUNT_UNAVAILABLE',401);
      if(previousSessionId) await tx.query('UPDATE sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2',[previousSessionId,userId]);
      await tx.query('INSERT INTO sessions(id,user_id,token_hash,csrf_hash,expires_at) VALUES($1,$2,$3,$4,$5)',[sessionId,userId,hash(sessionToken),hash(csrfToken),iso(Date.now()+7*86400000)]);
    });
    return {sessionToken,csrfToken,sessionId};
  }
  async authenticate(sessionToken:string|undefined) {
    if(!sessionToken || !/^[A-Za-z0-9_-]{43}$/.test(sessionToken)) return fail('UNAUTHENTICATED',401);
    const r=await this.db.query('SELECT s.id,s.user_id,s.csrf_hash,w.id AS workspace_id FROM sessions s JOIN users u ON u.id=s.user_id JOIN workspaces w ON w.owner_id=u.id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status=\'active\'',[hash(sessionToken)]);
    if(!r.rowCount) fail('UNAUTHENTICATED',401);
    const row=r.rows[0]; return {principal:{userId:row.user_id,workspaceId:row.workspace_id,sessionId:row.id} as Principal,csrfHash:row.csrf_hash as string};
  }
  async revoke(p:Principal) {
    await this.db.transaction(async tx=>{
      await tx.query('UPDATE sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2',[p.sessionId,p.userId]);
      await audit(tx,p,'session.revoked',p.sessionId,'session');
    });
  }
}
