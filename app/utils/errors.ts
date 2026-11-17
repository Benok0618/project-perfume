export function apiErrorMessage(error: unknown, fallback: string) {
  const message = (error as { data?: { message?: string } })?.data?.message
  return typeof message === 'string' && message ? message : fallback
}
