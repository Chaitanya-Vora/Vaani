const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vaani_token') : null
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
  if (res.status === 401) {
    if (typeof window !== 'undefined') { clearToken(); window.location.href = '/auth/login' }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  auth: {
    signup: (body: object) => req('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login:  (body: object) => req('/api/auth/login',  { method: 'POST', body: JSON.stringify(body) }),
  },
  dashboard: {
    me:         () => req('/api/dashboard/me'),
    stats:      () => req('/api/dashboard/stats'),
    compliance: () => req('/api/dashboard/compliance'),
    commitments:() => req('/api/dashboard/commitments'),
    clients:    () => req('/api/dashboard/clients'),
    update:     (body: object) => req('/api/dashboard/me', { method: 'PATCH', body: JSON.stringify(body) }),
  },
  automations: {
    list:   () => req<any[]>('/api/automations/'),
    create: (body: object) => req('/api/automations/', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string)   => req(`/api/automations/${id}`, { method: 'DELETE' }),
  },
  billing: {
    plans:     () => req('/api/billing/plans'),
    subscribe: (plan: string) => req(`/api/billing/subscribe/${plan}`, { method: 'POST' }),
  },
  health: () => req('/api/health'),
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('vaani_token', token)
  document.cookie = `vaani_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
}
export function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('vaani_token') : null }
export function clearToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('vaani_token')
  document.cookie = 'vaani_token=; path=/; max-age=0'
}
export function isAuthed() { return !!getToken() }
