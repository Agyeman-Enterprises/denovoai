# Knowledge Engine (stub)

Purpose: ingest signals from runs, promote patterns, and guide the module composer.

Current state:
- `signals.example.json`: example signals captured from demo runs.
- `patterns.example.json`: example promoted patterns.

Next steps:
- Replace JSON files with a real database (SQLite or Supabase).
- Add ingestion endpoints to accept run telemetry.
- Implement promotion rules (e.g., pattern must appear in 10 successful runs).
