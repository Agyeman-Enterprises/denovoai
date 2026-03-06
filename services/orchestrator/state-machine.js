/**
 * Simple, deterministic state machine for runs.
 * Each phase appends an event and produces artifacts.
 */
export const PHASES = [
  "intake",
  "spec",
  "design",
  "compose",
  "build",
  "verify",
  "deploy",
  "complete"
];

export function nextPhase(current) {
  const idx = PHASES.indexOf(current);
  return idx >= 0 && idx < PHASES.length - 1 ? PHASES[idx + 1] : null;
}
