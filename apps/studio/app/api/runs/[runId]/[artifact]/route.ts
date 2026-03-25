import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET(
  _request: Request,
  { params }: { params: { runId: string; artifact: string } }
) {
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const artifactPath = path.join(
    repoRoot,
    "runs",
    params.runId,
    "artifacts",
    params.artifact
  );

  // Validate path to prevent directory traversal
  const artifactsDir = path.join(repoRoot, "runs", params.runId, "artifacts");
  if (!path.resolve(artifactPath).startsWith(path.resolve(artifactsDir))) {
    return NextResponse.json({ error: "Invalid artifact path" }, { status: 400 });
  }

  if (!fs.existsSync(artifactPath)) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  try {
    const content = fs.readFileSync(artifactPath, "utf8");
    const isJson = artifactPath.endsWith(".json");
    return NextResponse.json(
      isJson ? JSON.parse(content) : { content },
      { headers: { "Content-Type": isJson ? "application/json" : "text/plain" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read artifact" },
      { status: 500 }
    );
  }
}
