const TOKEN_KEY = 'rnp_access_token'
export const BASE = '/app'

export function getApiBase() {
  return '/api'
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  /** Mensaje de los errores de validación de campos, si los hay. */
  get fieldMessage() {
    const errs = this.body && this.body.errors
    return errs ? Object.values(errs).flat().join(' ') : ''
  }
}

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** fetch contra /api con token Bearer. Opciones: { auth = true, method, body (objeto) } */
export async function apiFetch(path, { auth = true, body, headers: extra, ...rest } = {}) {
  const headers = new Headers(extra)
  headers.set('Accept', 'application/json')
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const token = getStoredToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const url = `${getApiBase()}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const payload = await parseJsonSafe(res)

  if (res.status === 401 && auth) {
    clearStoredToken()
    const loginPath = `${BASE}/login`
    if (window.location.pathname !== loginPath) {
      window.location.assign(loginPath)
    }
  }

  if (!res.ok) {
    const msg = (payload && payload.message) || res.statusText || 'Error de red'
    throw new ApiError(msg, res.status, payload)
  }
  return payload
}

export function qs(params) {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') u.set(k, String(v))
  }
  const s = u.toString()
  return s ? `?${s}` : ''
}

// ---- Servicios ----

export async function login(email, password) {
  const data = await apiFetch('/login', { method: 'POST', auth: false, body: { email, password } })
  setStoredToken(data.access_token)
  return data
}

export async function logout() {
  try {
    await apiFetch('/logout', { method: 'POST' })
  } finally {
    clearStoredToken()
  }
}

export function fetchPublicEstudiantes(params = {}) {
  const { page = 1, ...query } = params
  return apiFetch(`/public/estudiantes${qs({ page, ...query })}`, { auth: false })
}

export function fetchEstudiantesAutenticados(page = 1, search, seccion) {
  return apiFetch(`/estudiantes${qs({ page, search, seccion })}`)
}

/** Laravel envolvía el recurso en { data }; se desenvuelve aquí. */
export async function createEstudiante(body) {
  return (await apiFetch('/estudiantes', { method: 'POST', body })).data
}

export async function updateEstudiante(id, body) {
  return (await apiFetch(`/estudiantes/${id}`, { method: 'PUT', body })).data
}

export function deleteEstudiante(id) {
  return apiFetch(`/estudiantes/${id}`, { method: 'DELETE' })
}
