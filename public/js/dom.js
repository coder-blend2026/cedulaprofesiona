// Helpers mínimos para construir DOM sin librerías.

const cleanups = []

/** Registra una función que se ejecuta antes de dibujar la siguiente pantalla (quitar listeners, etc.). */
export function onCleanup(fn) {
  cleanups.push(fn)
}

export function runCleanups() {
  while (cleanups.length) {
    try {
      cleanups.pop()()
    } catch {
      /* ignorar */
    }
  }
}

/** h('div', { className: 'x', onClick: fn }, hijo1, 'texto', [hijos]) */
export function h(tag, props, ...children) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue
    if (key === 'className') el.className = value
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value)
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value)
    else if (key in el && key !== 'list' && !key.includes('-')) el[key] = value
    else el.setAttribute(key, value === true ? '' : value)
  }
  append(el, children)
  return el
}

export function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    el.append(child.nodeType ? child : document.createTextNode(String(child)))
  }
  return el
}

/** Convierte un fragmento HTML/SVG (confiable, escrito en el código) en un elemento. */
export function html(markup) {
  const t = document.createElement('template')
  t.innerHTML = markup.trim()
  return t.content.firstElementChild
}

export function clear(el) {
  el.replaceChildren()
  return el
}
