import { toast as sonner } from 'sonner'

/** Show a success toast. */
export function toastSuccess(message: string, description?: string): void {
  sonner.success(message, { description })
}

/** Show an error toast. Strips technical prefixes before display. */
export function toastError(message: string, description?: string): void {
  const clean = message
    .replace(/^(Error|error):\s*/i, '')
    .replace(/^(Failed to|failed to)\s*/i, 'Could not ')
  sonner.error(clean, { description })
}

/** Show an informational toast. */
export function toastInfo(message: string, description?: string): void {
  sonner.info(message, { description })
}

/** Show a loading toast — returns the toast ID so you can dismiss it. */
export function toastLoading(message: string): string | number {
  return sonner.loading(message)
}

/** Dismiss a toast by ID. */
export function toastDismiss(id: string | number): void {
  sonner.dismiss(id)
}

/**
 * Wrap an async operation with loading/success/error toasts.
 *
 * @example
 * await toastPromise(saveRecord(), {
 *   loading: 'Saving...',
 *   success: 'Saved!',
 *   error:   'Could not save. Try again.',
 * })
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string },
): Promise<T> {
  return sonner.promise(promise, messages) as unknown as Promise<T>
}
