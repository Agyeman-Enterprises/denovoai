import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 401 });

  // In production, verify API key against api_keys table
  // For snippet, return the path info
  return NextResponse.json({ version: "v1", path: path.join("/"), message: "Public API endpoint" });
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 401 });

  const body = await request.json();
  return NextResponse.json({ version: "v1", path: path.join("/"), received: body });
}
