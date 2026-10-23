# Isolated runner source

This is an unverified deployment component. No untrusted code was run on the application host. Native Docker/gVisor isolation and resource probes remain blocked by B01/B02.

The trusted gateway verifies a short-lived Ed25519 capability bound to the job ID, language, source digest and stdin digest. It does not receive an application database or AI credential. The app worker owns the private signing key; runner hosts receive only its public key. A job can execute only one of five fixed language commands. User code is passed through stdin JSON and is never interpolated into a host shell command.

Each job uses a digest-pinned image, `runsc`, a separate disposable container, no network, no host mounts, a read-only root filesystem, no Linux capabilities, a non-root UID, PID/CPU/memory limits, bounded tmpfs and bounded output. The entrypoint applies process CPU/file/descriptor limits and kills its process group on time or output limits. Node/Java memory requires cgroup enforcement rather than an address-space rlimit. The host gateway also kills and removes its named container after wall timeout.

Deployment requirements:

- Use a separate runner VPC/account boundary with no routes to the application VPC, RDS, private files or cloud metadata accessible to job containers.
- Build and scan a patched runner image; record its exact digest. Bake runsc and the trusted gateway into an approved immutable host image.
- Terminate private TLS/mTLS in front of the loopback gateway. Allow requests only from the execution dispatcher. Do not publish the gateway on the internet.
- Never mount a Docker socket into an untrusted job. The trusted gateway host alone controls its isolated daemon.
- Run `node --test runner/tests/policy.test.mjs` for local capability/command checks. Run the full native probe harness on the isolated host before enabling RUNNER_ENABLED.
- Drain admission with the database runner kill switch, wait for active leases, replace the fleet/image, execute all escape/resource probes, then re-enable admission. Failed/crashed sent jobs become uncertain and require reconciliation; never blindly replay them.

The local JavaScript browser worker remains available independently. Its five-second browser limit is separate from this remote runner's per-phase three-second limits and ten-second host wall limit.
