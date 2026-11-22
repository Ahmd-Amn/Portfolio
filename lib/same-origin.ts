export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  try {
    const source = new URL(origin)
    return (source.protocol === 'https:' || source.protocol === 'http:') && source.host === host
  } catch {
    return false
  }
}
