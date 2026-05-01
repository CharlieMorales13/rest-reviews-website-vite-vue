/** Returns true if the JWT is expired, malformed, or lacks an `exp` claim. Returns true on any decode error (fail-safe). */
export function isTokenExpired(token: string): boolean {
  try {
    const segment = token.split('.')[1];
    if (!segment) return true;
    const payload = JSON.parse(atob(segment));
    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
