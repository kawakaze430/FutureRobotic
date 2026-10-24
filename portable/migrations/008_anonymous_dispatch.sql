-- Public requests have no account identity and never create a fake user or workspace.
CREATE TABLE anonymous_sessions (
 id uuid PRIMARY KEY, token_hash text NOT NULL UNIQUE, csrf_hash text NOT NULL,
 subject_hash text NOT NULL, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX anonymous_sessions_expiry ON anonymous_sessions(expires_at);
CREATE TABLE anonymous_requests (
 id uuid PRIMARY KEY, session_id uuid NOT NULL REFERENCES anonymous_sessions(id),
 subject_hash text NOT NULL, day date NOT NULL, operation text NOT NULL CHECK(operation IN('ai','execution')),
 request_key text NOT NULL, request_hash text NOT NULL, payload jsonb NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN('queued','dispatching','completed','failed','uncertain','cancelled')),
 output text NOT NULL DEFAULT '', execution_result jsonb, error_code text,
 lease_until timestamptz, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(subject_hash,day,operation,request_key)
);
CREATE INDEX anonymous_requests_pending ON anonymous_requests(operation,state,created_at,id);
CREATE INDEX anonymous_requests_expiry ON anonymous_requests(expires_at);
CREATE TABLE anonymous_spend_holds (
 request_id uuid PRIMARY KEY REFERENCES anonymous_requests(id),
 day date NOT NULL REFERENCES spend_days(day), micro_usd bigint NOT NULL CHECK(micro_usd>0),
 status text NOT NULL DEFAULT 'held' CHECK(status IN('held','spent','released'))
);

REVOKE ALL ON anonymous_sessions,anonymous_requests,anonymous_spend_holds FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fr_runtime') THEN
  GRANT SELECT,INSERT,UPDATE ON anonymous_sessions,anonymous_requests,anonymous_spend_holds TO fr_runtime;
 END IF;
END $$;
