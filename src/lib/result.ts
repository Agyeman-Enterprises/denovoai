export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: string; code?: string };
export type Result<T> = Ok<T> | Err;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function err(error: string, code?: string): Err {
  return { ok: false, error, code };
}

export function isOk<T>(result: Result<T>): result is Ok<T> {
  return result.ok;
}

export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
