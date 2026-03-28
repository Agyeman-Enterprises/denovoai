import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "denovo-studio", timestamp: new Date().toISOString() });
}
