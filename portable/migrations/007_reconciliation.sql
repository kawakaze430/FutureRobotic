-- Reconciliation adds evidence and corrections; it never rewrites financial history.
CREATE TABLE financial_reconciliation_observations (
 id uuid PRIMARY KEY,
 provider text NOT NULL,
 resource_kind text NOT NULL CHECK(resource_kind IN('checkout','subscription','adjustment','provider_run')),
 resource_id text NOT NULL,
 workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 fingerprint text NOT NULL CHECK(length(fingerprint)=64),
 outcome text NOT NULL CHECK(outcome IN('matched','corrected','mismatch','unknown','unsupported','stale')),
 reason text NOT NULL,
 snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,resource_kind,resource_id,fingerprint),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE TABLE financial_reconciliation_applications (
 id uuid PRIMARY KEY,
 observation_id uuid NOT NULL REFERENCES financial_reconciliation_observations(id),
 business_key text NOT NULL UNIQUE,
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE financial_reconciliation_cases (
 id uuid PRIMARY KEY,
 provider text NOT NULL,
 resource_kind text NOT NULL CHECK(resource_kind IN('checkout','subscription','adjustment','provider_run')),
 resource_id text NOT NULL,
 workspace_id uuid NOT NULL, owner_id uuid NOT NULL,
 last_observation_id uuid NOT NULL REFERENCES financial_reconciliation_observations(id),
 reason text NOT NULL,
 state text NOT NULL CHECK(state IN('open','resolved')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,resource_kind,resource_id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES workspaces(id,owner_id)
);
CREATE INDEX reconciliation_cases_open ON financial_reconciliation_cases(state,updated_at DESC,id DESC);
CREATE TABLE provider_cost_adjustments (
 run_id uuid PRIMARY KEY REFERENCES tool_runs(id),
 observation_id uuid NOT NULL REFERENCES financial_reconciliation_observations(id),
 evidence_id text NOT NULL,
 actual_micro_usd bigint NOT NULL CHECK(actual_micro_usd>=0),
 estimated_micro_usd bigint NOT NULL CHECK(estimated_micro_usd>=0),
 delta_micro_usd bigint NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(delta_micro_usd=actual_micro_usd-estimated_micro_usd)
);
CREATE TRIGGER reconciliation_observations_immutable BEFORE UPDATE OR DELETE ON financial_reconciliation_observations FOR EACH ROW EXECUTE FUNCTION reject_mutation();
CREATE TRIGGER reconciliation_applications_immutable BEFORE UPDATE OR DELETE ON financial_reconciliation_applications FOR EACH ROW EXECUTE FUNCTION reject_mutation();
CREATE TRIGGER provider_cost_adjustments_immutable BEFORE UPDATE OR DELETE ON provider_cost_adjustments FOR EACH ROW EXECUTE FUNCTION reject_mutation();
REVOKE ALL ON financial_reconciliation_observations,financial_reconciliation_applications,financial_reconciliation_cases,provider_cost_adjustments FROM PUBLIC;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fr_runtime') THEN
  GRANT SELECT,INSERT ON financial_reconciliation_observations,financial_reconciliation_applications,provider_cost_adjustments TO fr_runtime;
  GRANT SELECT,INSERT,UPDATE ON financial_reconciliation_cases TO fr_runtime;
  REVOKE UPDATE,DELETE,TRUNCATE ON financial_reconciliation_observations,financial_reconciliation_applications,provider_cost_adjustments FROM fr_runtime;
 END IF;
END $$;
