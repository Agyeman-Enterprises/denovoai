import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";

// Launch orchestrator run (best effort); returns stdout and run listing refresh signal.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = body?.prompt || "Build a community app";

  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const script = path.join(repoRoot, "services", "orchestrator", "run.js");

  return new Promise<Response>((resolve) => {
    execFile("node", [script, "--prompt", prompt], { cwd: repoRoot }, (err, stdout, stderr) => {
      if (err) {
        resolve(
          NextResponse.json(
            { ok: false, error: err.message, stdout: stdout?.toString(), stderr: stderr?.toString() },
            { status: 500 }
          )
        );
      } else {
        resolve(
          NextResponse.json({
            ok: true,
            stdout: stdout?.toString(),
            stderr: stderr?.toString()
          })
        );
      }
    });
  });
}
