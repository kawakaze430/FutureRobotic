ALTER TABLE support_tickets ADD COLUMN request_key text;
ALTER TABLE support_tickets ADD COLUMN request_hash text;
CREATE UNIQUE INDEX support_request_key ON support_tickets(workspace_id,owner_id,request_key) WHERE request_key IS NOT NULL;

CREATE TABLE support_deliveries (
 ticket_id uuid PRIMARY KEY REFERENCES support_tickets(id),
 state text NOT NULL DEFAULT 'queued' CHECK(state IN('queued','sending','sent','delivered','uncertain','dead','bounced','complained','suppressed')),
 generation integer NOT NULL DEFAULT 1 CHECK(generation>0),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 provider_message_id text,
 last_error text,
 send_started_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 delivered_at timestamptz
);
CREATE INDEX support_delivery_state ON support_deliveries(state,updated_at);
CREATE UNIQUE INDEX support_provider_message ON support_deliveries(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE TABLE support_delivery_events (
 event_id text PRIMARY KEY,
 ticket_id uuid NOT NULL REFERENCES support_tickets(id),
 generation integer NOT NULL,
 provider_message_id text NOT NULL,
 event_kind text NOT NULL CHECK(event_kind IN('sent','delivered','bounced','complained')),
 body_sha256 text NOT NULL CHECK(length(body_sha256)=64),
 occurred_at timestamptz NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER support_event_immutable BEFORE UPDATE OR DELETE ON support_delivery_events FOR EACH ROW EXECUTE FUNCTION reject_mutation();
CREATE TABLE support_delivery_actions (
 ticket_id uuid NOT NULL REFERENCES support_tickets(id),
 request_key text NOT NULL,
 actor_id uuid NOT NULL REFERENCES users(id),
 job_id uuid NOT NULL REFERENCES jobs(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(ticket_id,request_key)
);
CREATE TRIGGER support_action_immutable BEFORE UPDATE OR DELETE ON support_delivery_actions FOR EACH ROW EXECUTE FUNCTION reject_mutation();

ALTER TABLE jobs DROP CONSTRAINT jobs_kind_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_kind_check CHECK(kind IN('dispatch','cleanup','reconcile','export','delete_account','delete_object','extract_text','delete_history','history_export','support_ack'));

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fr_runtime') THEN
  GRANT SELECT,INSERT,UPDATE ON support_deliveries TO fr_runtime;
  GRANT SELECT,INSERT ON support_delivery_events,support_delivery_actions TO fr_runtime;
  REVOKE UPDATE,DELETE,TRUNCATE ON support_delivery_events,support_delivery_actions FROM fr_runtime;
 END IF;
END $$;
