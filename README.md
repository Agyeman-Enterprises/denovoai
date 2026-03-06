# DeNovo (Skeleton MVP)

This repo is a runnable scaffold of the DeNovo AI creation platform described in `DENOVO.txt`. It is designed to be beginner-friendly while giving senior engineers a credible architecture to inspect and extend.

## What exists now
- Monorepo layout: `apps/`, `services/`, `packages/`, `templates/`, `.github/`.
- Module governance defaults: platform core, use-case core, feature modules, stable vs experimental channels.
- Example data: registry seeds, use-case rule map, knowledge-engine stubs, lockfile specimen.
- Tiny demo scripts to show how the orchestrator resolves modules and produces a lockfile.

## Quick start
```bash
node services/orchestrator/run.js --prompt "Build a gardening community with photo uploads"
```
Outputs:
- Artifacts under `runs/<id>/artifacts/` (ProductSpec, SystemDesign, RunLockfile).
- Run log at `runs/<id>/run-log.json`.
- Generated static app at `runs/<id>/app/index.html` showing modules/features/tests.

### Environment
- Copy `.env.example` to `.env.local` (already git-ignored) and fill in your Supabase project values.
- Current `.env.local` is pre-populated with the Supabase URL and service role key you provided; keep it private.

### Git remote
Repo is initialized with origin set to `https://github.com/Agyeman-Enterprises/denovoai.git`. Run `git fetch` when you want to pull or compare with that remote.

## Next steps (suggested)
- Wire real LLM calls into `services/orchestrator/agents/`.
- Implement persistent storage (Supabase or SQLite) for runs, events, and knowledge signals.
- Replace the stub module registry with generated modules under `modules/`.
- Build `apps/studio` as a Next.js UI that drives the orchestrator.
