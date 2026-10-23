-- Forward-only upgrade: indexes for tenant-scoped reads and maintenance scans.
CREATE INDEX subscriptions_workspace_period ON subscriptions(workspace_id,owner_id,period_end DESC);
CREATE INDEX files_workspace_page ON files(workspace_id,owner_id,created_at DESC,id DESC) WHERE status<>'deleted';
CREATE INDEX revisions_file ON file_revisions(file_id,revision DESC);
CREATE INDEX notes_run ON notes(run_id,workspace_id,owner_id);
CREATE INDEX runs_retention ON tool_runs(retention_until) WHERE status IN('completed','failed','cancelled');
CREATE INDEX reservations_expiry ON reservations(expires_at,run_id) WHERE status='held';
CREATE INDEX exports_expiry ON account_exports(expires_at);
CREATE INDEX audit_workspace_time ON audit_events(workspace_id,created_at DESC);
