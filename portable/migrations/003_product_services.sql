CREATE TABLE auth_states (
 id text PRIMARY KEY, provider text NOT NULL CHECK(provider IN('google','github')),
 binding_hash text NOT NULL, verifier_cipher text NOT NULL, nonce text NOT NULL,
 expires_at timestamptz NOT NULL, consumed_at timestamptz
);
CREATE TABLE otp_challenges (
 id uuid PRIMARY KEY, email text NOT NULL, code_hash text NOT NULL,
 expires_at timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 0,
 status text NOT NULL CHECK(status IN('pending','sent','failed','consumed','locked')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_email ON otp_challenges(email,created_at DESC);
CREATE TABLE auth_windows (
 subject_hash text NOT NULL, operation text NOT NULL, window_start timestamptz NOT NULL,
 hits integer NOT NULL DEFAULT 1, PRIMARY KEY(subject_hash,operation,window_start)
);
CREATE TABLE bot_token_uses (token_hash text PRIMARY KEY, expires_at timestamptz NOT NULL);
CREATE TABLE operators (
 user_id uuid PRIMARY KEY REFERENCES users(id), role text NOT NULL CHECK(role IN('support','billing','operations','administrator')),
 totp_cipher text NOT NULL, enabled boolean NOT NULL DEFAULT false, last_step bigint NOT NULL DEFAULT -1
);
CREATE TABLE support_tickets (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 subject text NOT NULL, message text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN('open','closed')),
 created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE runtime_controls (
 id integer PRIMARY KEY CHECK(id=1), provider_enabled boolean NOT NULL DEFAULT false,
 runner_enabled boolean NOT NULL DEFAULT false, daily_budget_micro_usd bigint NOT NULL DEFAULT 0 CHECK(daily_budget_micro_usd>=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO runtime_controls(id) VALUES(1);
CREATE TABLE spend_days (
 day date PRIMARY KEY, held_micro_usd bigint NOT NULL DEFAULT 0 CHECK(held_micro_usd>=0),
 spent_micro_usd bigint NOT NULL DEFAULT 0 CHECK(spent_micro_usd>=0)
);
CREATE TABLE spend_holds (
 run_id uuid PRIMARY KEY REFERENCES tool_runs(id), day date NOT NULL REFERENCES spend_days(day),
 micro_usd bigint NOT NULL CHECK(micro_usd>=0), status text NOT NULL DEFAULT 'held' CHECK(status IN('held','spent','released'))
);
CREATE TABLE anonymous_usage (
 subject_hash text NOT NULL, day date NOT NULL, operation text NOT NULL CHECK(operation IN('ai','execution')),
 operation_key text NOT NULL, state text NOT NULL DEFAULT 'reserved' CHECK(state IN('reserved','completed','uncertain','released')),
 result text, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(subject_hash,day,operation,operation_key)
);
ALTER TABLE users ADD COLUMN selected_chat_id uuid REFERENCES chat_threads(id);
ALTER TABLE tool_runs ADD COLUMN evaluation_allowed boolean NOT NULL DEFAULT false;
ALTER TABLE tool_runs ADD COLUMN chat_thread_id uuid;
ALTER TABLE tool_runs ADD CONSTRAINT run_chat_owner FOREIGN KEY(chat_thread_id,workspace_id,owner_id) REFERENCES chat_threads(id,workspace_id,owner_id);
ALTER TABLE chat_messages ADD COLUMN run_id uuid REFERENCES tool_runs(id);
ALTER TABLE chat_messages ADD COLUMN state text NOT NULL DEFAULT 'complete' CHECK(state IN('complete','partial','failed','streaming'));
ALTER TABLE chat_messages ADD COLUMN operation_key text;
CREATE UNIQUE INDEX messages_operation ON chat_messages(thread_id,operation_key) WHERE operation_key IS NOT NULL;
CREATE TABLE run_events (
 run_id uuid NOT NULL REFERENCES tool_runs(id), sequence bigint GENERATED ALWAYS AS IDENTITY,
 event_type text NOT NULL CHECK(event_type IN('delta','status','done')), data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(run_id,sequence)
);
CREATE INDEX run_events_order ON run_events(run_id,sequence);
CREATE TABLE run_context_files (
 run_id uuid NOT NULL, revision_id uuid NOT NULL REFERENCES file_revisions(id),
 workspace_id uuid NOT NULL, owner_id uuid NOT NULL, name text NOT NULL, sha256 text NOT NULL, content text NOT NULL,
 PRIMARY KEY(run_id,revision_id), FOREIGN KEY(run_id,workspace_id,owner_id) REFERENCES tool_runs(id,workspace_id,owner_id)
);
CREATE TABLE share_snapshots (
 share_id uuid PRIMARY KEY REFERENCES shares(id), result text NOT NULL, language text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE evaluation_candidates (
 run_id uuid PRIMARY KEY REFERENCES tool_runs(id), owner_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE checkout_intents (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 request_key text NOT NULL, plan_id text NOT NULL REFERENCES plans(id), interval text NOT NULL CHECK(interval IN('month','year')),
 provider_transaction_id text UNIQUE, checkout_url text, country text NOT NULL,
 state text NOT NULL DEFAULT 'creating' CHECK(state IN('creating','ready','completed','uncertain','failed')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,request_key),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE billing_links (
 subscription_id text PRIMARY KEY, customer_id text NOT NULL, workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE payment_adjustments (
 provider_id text PRIMARY KEY, subscription_id text NOT NULL REFERENCES billing_links(subscription_id),
 kind text NOT NULL CHECK(kind IN('refund','chargeback','credit')), status text NOT NULL,
 amount_minor bigint NOT NULL CHECK(amount_minor>=0), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE execution_admission (
 workspace_id uuid PRIMARY KEY REFERENCES workspaces(id), last_admitted_at timestamptz NOT NULL DEFAULT '1970-01-01'
);
CREATE TABLE execution_jobs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, owner_id uuid NOT NULL, request_key text NOT NULL,
 language text NOT NULL CHECK(language IN('Python','JavaScript','C','C++','Java')),
 source text NOT NULL, source_hash text NOT NULL, state text NOT NULL DEFAULT 'queued' CHECK(state IN('queued','running','completed','failed','uncertain','cancelled')),
 result jsonb, lease_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,request_key),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE INDEX execution_pending ON execution_jobs(state,created_at);
ALTER TABLE chat_threads ADD COLUMN archived_at timestamptz;
CREATE TABLE quarantine_uploads (
 file_id uuid PRIMARY KEY REFERENCES files(id), revision_id uuid NOT NULL REFERENCES file_revisions(id),
 expected_sha256 text NOT NULL, expected_bytes bigint NOT NULL, object_key text NOT NULL,
 expires_at timestamptz NOT NULL, completed_at timestamptz
);
ALTER TABLE jobs DROP CONSTRAINT jobs_kind_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_kind_check CHECK(kind IN('dispatch','cleanup','reconcile','export','delete_account','delete_object','extract_text'));
ALTER TABLE jobs ADD COLUMN notified_at timestamptz;
