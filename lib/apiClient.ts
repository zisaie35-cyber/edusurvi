// lib/apiClient.ts
// Wrapper client pour les appels aux routes API protégées : attache le
// token de session (stocké par la page de connexion) en Authorization Bearer.
export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}
