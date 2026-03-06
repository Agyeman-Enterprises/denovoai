# DeNovo Studio (UI stub)

Intent:
- Collect prompts and constraints.
- Show detected mode, auto-included modules, and optional modules.
- Allow toggling experimental modules with explicit confirmation.
- Display run timeline and links to lockfile, repo, deployment.

Current state:
- Placeholder only; no UI code yet.

Suggested tech:
- Next.js (App Router) + Tailwind
- Use `services/module-engine/resolve.js` via an API route for SSR.
