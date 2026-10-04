// Supabase's PostgrestError is a plain object, not `instanceof Error` —
// `err instanceof Error ? err.message : fallback` silently drops its real
// message everywhere a calculator screen catches a failed query.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') return err.message
  return fallback
}
