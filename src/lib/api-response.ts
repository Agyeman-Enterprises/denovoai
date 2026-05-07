import { NextResponse } from "next/server";
import type { Result } from "./result";

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiErr(message: string, status = 400, code?: string): NextResponse {
  return NextResponse.json({ ok: false, error: message, code }, { status });
}

export function apiFromResult<T>(result: Result<T>, errorStatus = 400): NextResponse {
  if (result.ok) return apiOk(result.data);
  return apiErr(result.error, errorStatus, result.code);
}
