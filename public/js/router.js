import { BASE } from './api.js'

const listeners = []

/** Ruta actual sin el prefijo /app, p. ej. "/cedulas-profesionales/busqueda". */
export function currentPath() {
  let p = window.location.pathname
  if (p === BASE || p.startsWith(BASE + '/')) p = p.slice(BASE.length)
  p = p.replace(/\/+$/, '')
  return p === '' ? '/' : p
}

export function currentSearchParams() {
  return new URLSearchParams(window.location.search)
}

export function href(to) {
  return BASE + (to === '/' ? '/' : to)
}

export function navigate(to, { replace = false } = {}) {
  const url = href(to)
  if (url === window.location.pathname + window.location.search) return
  window.history[replace ? 'replaceState' : 'pushState']({}, '', url)
  listeners.forEach((fn) => fn())
}

export function onRoute(fn) {
  listeners.push(fn)
  window.addEventListener('popstate', fn)
}

/** Enlaces internos <a data-link>: navegan sin recargar la página. */
export function enableLinkInterception() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-link]')
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    const url = new URL(a.href)
    navigate(url.pathname.slice(BASE.length) + url.search || '/')
  })
}
