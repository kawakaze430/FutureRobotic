ALTER TABLE operators ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version > 0);
ALTER TABLE operators ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Enrollment/rotation/revocation require the protected migration/admin role.
-- No HTTP handler can insert these rows or change operator secrets/roles.
CREATE TABLE operator_admin_events (
 id uuid PRIMARY KEY, request_key text NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES users(id), action text NOT NULL CHECK(action IN('enroll','rotate','revoke')),
 role text NOT NULL CHECK(role IN('support','billing','operations','administrator')),
 version integer NOT NULL CHECK(version>0), enabled boolean NOT NULL,
 request_hash text NOT NULL, reason text NOT NULL CHECK(length(reason) BETWEEN 10 AND 240),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER operator_admin_events_immutable BEFORE UPDATE OR DELETE ON operator_admin_events FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TABLE operator_sessions (
 session_id uuid PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES operators(user_id), operator_version integer NOT NULL,
 verified_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 CHECK(expires_at>verified_at AND expires_at<=verified_at+interval '5 minutes')
);
CREATE INDEX operator_session_expiry ON operator_sessions(expires_at);

CREATE TABLE operator_action_receipts (
 id uuid PRIMARY KEY, actor_id uuid NOT NULL REFERENCES operators(user_id),
 request_key text NOT NULL, action text NOT NULL CHECK(action IN('support.status','controls.update','billing.reconcile')),
 resource_id text NOT NULL, request_hash text NOT NULL, result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(actor_id,request_key)
);
CREATE TRIGGER operator_action_receipts_immutable BEFORE UPDATE OR DELETE ON operator_action_receipts FOR EACH ROW EXECUTE FUNCTION reject_mutation();

-- Existing deployed runtime roles must receive only the intended new privileges.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fr_runtime') THEN
  REVOKE ALL ON operator_admin_events FROM fr_runtime;
  GRANT SELECT,INSERT,UPDATE,DELETE ON operator_sessions TO fr_runtime;
  GRANT SELECT,INSERT ON operator_action_receipts TO fr_runtime;
  REVOKE UPDATE,DELETE,TRUNCATE ON operator_action_receipts FROM fr_runtime;
  REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON operators FROM fr_runtime;
  GRANT UPDATE(last_step) ON operators TO fr_runtime;
 END IF;
END $$;
