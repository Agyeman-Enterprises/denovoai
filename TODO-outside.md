# Outside-sandbox steps for full functionality

## Environment / secrets
- Set `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `VERCEL_TOKEN` in `.env.local`.
- Ensure `psql`, `supabase`, and `vercel` CLIs are on PATH.

## Run pipeline
- Run `npm install` in `templates/saas-crud` and `apps/studio` (or workspace) with network access.
- Re-run orchestrator to generate a fresh run with installed deps: `node services/orchestrator/run.js --prompt "..."`
- Apply DB schema: `psql "$DATABASE_URL" < runs/<run-id>/artifacts/schema.bundle.sql`.
- Deploy: `cd runs/<run-id>/workspace && vercel --token $VERCEL_TOKEN --prod --confirm --env-file .env.local`.

## Studio
- Start Studio dev server: `cd apps/studio && npm install && npm run dev`.
- Wire Studio API to orchestrator if running separately (may need absolute paths or a small backend proxy).

## Tests/build
- In each run workspace: `npm test` (Playwright) and `npm run build` once deps installed.

## Optional hardening
- Replace stub Vercel deployer with project creation + env sync.
- Persist runs/event store in a database instead of filesystem.
- Add authentication for Studio if exposed.
