CREATE TABLE users (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE CHECK (email=lower(trim(email))),
 display_name text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','deleting','deleted')),
 preferences jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE identities (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
 issuer text NOT NULL, subject text NOT NULL, verified_email text,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(issuer,subject)
);
CREATE TABLE sessions (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), token_hash text NOT NULL UNIQUE,
 csrf_hash text NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE workspaces (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL UNIQUE REFERENCES users(id), name text NOT NULL DEFAULT 'Personal workspace',
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,owner_id)
);
CREATE TABLE plans (
 id text PRIMARY KEY, name text NOT NULL, context_limit integer NOT NULL CHECK(context_limit>0),
 advanced_credits integer NOT NULL CHECK(advanced_credits>=0), file_limit integer NOT NULL CHECK(file_limit>=0)
);
INSERT INTO plans VALUES ('free','Free',25000,5,0),('pro','Pro',25000,50,100),('premium','Premium',100000,200,250);
CREATE TABLE prices (
 id text PRIMARY KEY, plan_id text NOT NULL REFERENCES plans(id), provider text NOT NULL,
 provider_price_id text NOT NULL, currency text NOT NULL CHECK(length(currency)=3),
 amount_minor integer NOT NULL CHECK(amount_minor>=0), interval text NOT NULL CHECK(interval IN('month','year')),
 active boolean NOT NULL DEFAULT false, UNIQUE(provider,provider_price_id)
);
CREATE TABLE subscriptions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 provider text NOT NULL, provider_id text NOT NULL, plan_id text NOT NULL REFERENCES plans(id),
 status text NOT NULL CHECK(status IN('active','past_due','cancelled','trialing')), period_start timestamptz NOT NULL,
 period_end timestamptz NOT NULL CHECK(period_end>period_start),
 last_event_at timestamptz NOT NULL, UNIQUE(provider,provider_id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE billing_events (
 provider text NOT NULL, event_id text NOT NULL, payload_hash text NOT NULL,
 workspace_id uuid NOT NULL, owner_id uuid NOT NULL, occurred_at timestamptz NOT NULL,
 status text NOT NULL CHECK(status IN('processed','ignored')), received_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(provider,event_id), FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE allowance_accounts (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 bucket text NOT NULL CHECK(bucket IN('advanced','standard','execution')), period_key text NOT NULL,
 granted integer NOT NULL DEFAULT 0 CHECK(granted>=0), reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0),
 consumed integer NOT NULL DEFAULT 0 CHECK(consumed>=0), CHECK(reserved+consumed<=granted),
 UNIQUE(workspace_id,bucket,period_key), UNIQUE(id,workspace_id,owner_id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE tool_runs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 tool text NOT NULL, source text NOT NULL, instructions text NOT NULL DEFAULT '', language text NOT NULL,
 target_language text, model text NOT NULL, idempotency_key text NOT NULL, request_hash text NOT NULL,
 status text NOT NULL DEFAULT 'queued' CHECK(status IN('queued','dispatching','running','completed','failed','cancel_requested','cancelled','uncertain')),
 error_code text, trace_id text NOT NULL, retention_until timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(workspace_id,idempotency_key), UNIQUE(id,workspace_id,owner_id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE INDEX runs_page ON tool_runs(workspace_id,created_at DESC,id DESC);
CREATE TABLE reservations (
 id uuid PRIMARY KEY, run_id uuid NOT NULL UNIQUE, account_id uuid NOT NULL, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 units integer NOT NULL CHECK(units>0), status text NOT NULL DEFAULT 'held' CHECK(status IN('held','settled','released')),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(account_id,workspace_id,owner_id) REFERENCES allowance_accounts(id,workspace_id,owner_id),
 FOREIGN KEY(run_id,workspace_id,owner_id) REFERENCES tool_runs(id,workspace_id,owner_id)
);
CREATE TABLE allowance_ledger (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES allowance_accounts(id), business_key text NOT NULL UNIQUE,
 kind text NOT NULL CHECK(kind IN('grant','reserve','settle','release')), granted_delta integer NOT NULL DEFAULT 0,
 reserved_delta integer NOT NULL DEFAULT 0, consumed_delta integer NOT NULL DEFAULT 0,
 run_id uuid REFERENCES tool_runs(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE result_versions (
 id uuid PRIMARY KEY, run_id uuid NOT NULL, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(run_id,version), FOREIGN KEY(run_id,workspace_id,owner_id) REFERENCES tool_runs(id,workspace_id,owner_id)
);
CREATE TABLE notes (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL, run_id uuid,
 content text NOT NULL, version integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id),
 FOREIGN KEY(run_id,workspace_id,owner_id) REFERENCES tool_runs(id,workspace_id,owner_id)
);
CREATE TABLE chat_threads (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL, title text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,workspace_id,owner_id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE chat_messages (
 id uuid PRIMARY KEY, thread_id uuid NOT NULL, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 role text NOT NULL CHECK(role IN('user','assistant')), content text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(thread_id,workspace_id,owner_id) REFERENCES chat_threads(id,workspace_id,owner_id)
);
CREATE INDEX messages_page ON chat_messages(thread_id,created_at,id);
CREATE TABLE files (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL, name text NOT NULL,
 status text NOT NULL CHECK(status IN('staged','ready','deleted')), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,workspace_id,owner_id), FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE file_revisions (
 id uuid PRIMARY KEY, file_id uuid NOT NULL, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0), object_key text NOT NULL UNIQUE, sha256 text NOT NULL CHECK(length(sha256)=64),
 size_bytes bigint NOT NULL CHECK(size_bytes>=0), media_type text NOT NULL,
 extraction_status text NOT NULL DEFAULT 'pending' CHECK(extraction_status IN('pending','ready','rejected','deleted')),
 extracted_text text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(file_id,revision),
 FOREIGN KEY(file_id,workspace_id,owner_id) REFERENCES files(id,workspace_id,owner_id)
);
CREATE TABLE shares (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL, token_hash text NOT NULL UNIQUE,
 run_id uuid, file_id uuid, expires_at timestamptz NOT NULL, revoked_at timestamptz,
 CHECK((run_id IS NULL)<>(file_id IS NULL)),
 FOREIGN KEY(run_id,workspace_id,owner_id) REFERENCES tool_runs(id,workspace_id,owner_id),
 FOREIGN KEY(file_id,workspace_id,owner_id) REFERENCES files(id,workspace_id,owner_id)
);
CREATE TABLE jobs (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN('dispatch','cleanup','reconcile','export','delete_account','delete_object')),
 dedupe_key text NOT NULL UNIQUE, payload jsonb NOT NULL, trace_id text NOT NULL,
 status text NOT NULL DEFAULT 'queued' CHECK(status IN('queued','running','completed','dead')),
 attempts integer NOT NULL DEFAULT 0, max_attempts integer NOT NULL DEFAULT 5 CHECK(max_attempts>0),
 available_at timestamptz NOT NULL DEFAULT now(), lease_token uuid, lease_until timestamptz,
 last_error text, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE INDEX jobs_claim ON jobs(status,available_at);
CREATE TABLE rate_windows (
 subject_hash text NOT NULL, operation text NOT NULL, window_start timestamptz NOT NULL, hits integer NOT NULL CHECK(hits>0),
 PRIMARY KEY(subject_hash,operation,window_start)
);
CREATE TABLE concurrency_leases (
 id uuid PRIMARY KEY, subject_hash text NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX leases_subject ON concurrency_leases(subject_hash,expires_at);
CREATE TABLE account_exports (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), content jsonb NOT NULL,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_events (
 id uuid PRIMARY KEY, actor_id uuid REFERENCES users(id), workspace_id uuid REFERENCES workspaces(id),
 action text NOT NULL, resource_id text, metadata jsonb NOT NULL DEFAULT '{}',
 trace_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'append-only relation'; END $$;
CREATE TRIGGER ledger_immutable BEFORE UPDATE OR DELETE ON allowance_ledger FOR EACH ROW EXECUTE FUNCTION reject_mutation();
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_mutation();
