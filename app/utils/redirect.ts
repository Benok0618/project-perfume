export function safeRedirect(value: unknown, fallback = '/') {
  const target = Array.isArray(value) ? value[0] : value
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) return target
  return fallback
}
