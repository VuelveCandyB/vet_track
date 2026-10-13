// Routes a vaccinator-only user (see isVaccinatorOnly in lib/auth.ts) may open.
// Pure function so proxy.ts can use it without server-only imports.
// Server actions run on the path of the page that calls them, so the horse
// profile (/horses/[id]) stays reachable for the vaccination action.

// True when the user's only role is 'vaccinator'. Users with vaccinator plus
// other roles keep normal access.
export function isOnlyVaccinator(roles: string[]): boolean {
  return roles.length === 1 && roles[0] === 'vaccinator'
}

const ALLOWED_EXACT =new Set(['/horses', '/login', '/reset-password', '/api/log-login'])

const ALLOWED_PREFIXES = ['/auth/', '/cambiar-contrasena']

const HORSE_PROFILE = /^\/horses\/[^/]+$/

export function isPathAllowedForVaccinator(pathname: string): boolean {
  if (ALLOWED_EXACT.has(pathname)) return true
  if (HORSE_PROFILE.test(pathname)) return true
  return ALLOWED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}
