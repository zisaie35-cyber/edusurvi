// lib/apiClient.ts
// Wrapper client pour les appels aux routes API protégées : attache le
// token de session (stocké par la page de connexion) en Authorization Bearer,
// et — si un super administrateur est "entré" dans une école — l'identifiant
// de cette école en en-tête X-Ecole-Id (voir lib/auth.ts:resolveEcoleId).
export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const activeEcoleId = typeof window !== 'undefined' ? localStorage.getItem('activeEcoleId') : null
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (activeEcoleId) headers.set('X-Ecole-Id', activeEcoleId)
  return fetch(input, { ...init, headers })
}
