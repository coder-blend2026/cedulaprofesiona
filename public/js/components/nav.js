import { h, html, onCleanup } from '../dom.js'
import { currentPath, href } from '../router.js'

const SEARCH_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4a7 7 0 1 0 4.7 12.2l3.6 3.6 1.4-1.4-3.6-3.6A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" fill="currentColor" /></svg>'
const MENU_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor" /></svg>'

const TRAMITES = 'https://www.gob.mx/segob/documentos/tramites-y-servicios-17706'
const GOBIERNO = 'https://www.gob.mx/gobierno'

/** Enlace interno con clase "active" cuando coincide con la ruta (como NavLink). */
export function navLink(to, props, ...children) {
  const path = currentPath()
  const isActive = path === to || path.startsWith(to + '/')
  const { className, activeClass = 'active', ...rest } = props || {}
  const cls = [className, isActive ? activeClass : ''].filter(Boolean).join(' ')
  return h('a', { href: href(to), 'data-link': '', className: cls || undefined, 'aria-current': isActive ? 'page' : undefined, ...rest }, ...children)
}

export function SiteNav() {
  const state = { topbar: false, subnav: false, mobile: null }
  let dropdownTop = 80

  const dropLinkClass = (to) => 'nav-drop__link' + (currentPath() === to ? ' nav-drop__link--active' : '')
  const dropLink = (to, label) =>
    h('a', { href: href(to), 'data-link': '', className: dropLinkClass(to), onClick: closeAll }, label)

  // ---- Barra superior ----
  const topbarBtn = h('button', { type: 'button', className: 'icon-btn icon-btn--menu', onClick: toggleTopbar })
  topbarBtn.append(html(MENU_ICON))

  const searchActive = currentPath() === '/cedulas-profesionales/busqueda'
  const searchLink = h('a', {
    href: href('/cedulas-profesionales/busqueda'),
    'data-link': '',
    className: 'icon-btn icon-btn--search' + (searchActive ? ' icon-btn--active' : ''),
    'aria-label': 'Buscar cédulas profesionales',
  })
  searchLink.append(html(SEARCH_ICON))

  const dropSearch = h('a', {
    href: href('/cedulas-profesionales/busqueda'),
    'data-link': '',
    className: 'nav-drop__link nav-drop__link--search' + (searchActive ? ' nav-drop__link--active' : ''),
    onClick: closeAll,
  })
  const dropSearchIcon = html(SEARCH_ICON)
  dropSearchIcon.classList.add('nav-drop__search-icon')
  dropSearch.append(dropSearchIcon)

  const topbarPanel = h(
    'div',
    { className: 'nav-drop-panel nav-drop-panel--topbar', role: 'region', 'aria-label': 'Accesos trámites y gobierno' },
    h(
      'div',
      {
        className: 'container nav-drop-panel__inner',
        style: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' },
      },
      h('a', { href: TRAMITES, className: 'nav-drop__link', onClick: closeAll }, 'Trámites'),
      h('a', { href: GOBIERNO, className: 'nav-drop__link', onClick: closeAll }, 'Gobierno'),
      dropSearch,
    ),
  )

  const logo = h('img', { src: '/img/logo_blanco.svg', alt: 'Gobierno de México' })
  const topbar = h(
    'header',
    { className: 'topbar' },
    h(
      'div',
      { className: 'container topbar__inner' },
      h('div', { className: 'brand', 'aria-label': 'Gobierno de México' }, logo),
      h(
        'nav',
        { className: 'topbar__nav', 'aria-label': 'Accesos superiores' },
        h('a', { href: TRAMITES }, 'Trámites'),
        h('a', { href: GOBIERNO }, 'Gobierno'),
        searchLink,
        topbarBtn,
      ),
    ),
  )

  // ---- Subnav ----
  const subnavBtn = h('button', { type: 'button', className: 'subnav__menu-btn', onClick: toggleSubnav })
  subnavBtn.append(html(MENU_ICON))

  const dropdown = (to, label, items) =>
    h(
      'div',
      { className: 'subnav__item has-dropdown' },
      navLink(to, null, label),
      h('div', { className: 'subnav__dropdown', role: 'menu' }, items.map(([t, l]) => navLink(t, { role: 'menuitem' }, l))),
    )

  const mobileTriggers = {}
  const trigger = (key, label) => {
    const btn = h(
      'button',
      {
        type: 'button',
        className: 'mobile-nav-panel__trigger',
        onClick: () => {
          state.mobile = state.mobile === key ? null : key
          if (state.mobile) dropdownTop = computeTop(btn)
          sync()
        },
      },
      h('span', { className: 'mobile-nav-panel__label' }, label),
      h('span', { className: 'mobile-nav-panel__caret', 'aria-hidden': 'true' }, '▾'),
    )
    mobileTriggers[key] = btn
    return btn
  }

  const popupHost = h('div', null)
  const mobilePanel = h(
    'div',
    { className: 'nav-drop-panel nav-drop-panel--subnav', role: 'region' },
    h(
      'div',
      { className: 'container nav-drop-panel__inner nav-drop-panel__inner--sub' },
      h(
        'nav',
        { className: 'mobile-nav-panel', 'aria-label': 'Secciones principales' },
        trigger('inicio', 'Inicio'),
        trigger('cedulas', 'Cédulas Profesionales'),
        navLink(
          '/especialistas/cirugia-plastica-estetica-y-reconstructiva',
          { className: 'mobile-nav-panel__link mobile-nav-panel__link--long', activeClass: '', onClick: closeAll },
          'Especialistas: Cirugía Plástica, Estética y Reconstructiva',
        ),
        navLink('/cedulas-estatales', { className: 'mobile-nav-panel__link', activeClass: '', onClick: closeAll }, 'Cédulas Estatales'),
        trigger('datos', 'Datos Abiertos'),
        navLink('/contacto', { className: 'mobile-nav-panel__link', activeClass: '', onClick: closeAll }, 'Contacto'),
      ),
      popupHost,
    ),
  )

  const popups = {
    inicio: [
      ['/bienvenida', 'Bienvenida'],
      ['/terminos-y-condiciones', 'Términos y Condiciones'],
    ],
    cedulas: [
      ['/cedulas-profesionales/busqueda', 'Búsqueda'],
      ['/cedulas-profesionales/validar-constancia', 'Validar Constancia'],
    ],
    datos: [
      ['/datos-abiertos/autorizaciones-provisionales', 'Autorizaciones provisionales'],
      ['/datos-abiertos/titulos-electronicos', 'Títulos electrónicos'],
    ],
  }

  const subnav = h(
    'div',
    { className: 'subnav' },
    h(
      'div',
      { className: 'container subnav__inner' },
      subnavBtn,
      dropdown('/bienvenida', 'Inicio', [
        ['/bienvenida', 'Bienvenida'],
        ['/terminos-y-condiciones', 'Términos y Condiciones'],
      ]),
      dropdown('/cedulas-profesionales/busqueda', 'Cédulas Profesionales', [
        ['/cedulas-profesionales/busqueda', 'Búsqueda'],
        ['/cedulas-profesionales/validar-constancia', 'Validar Constancia'],
      ]),
      navLink('/especialistas/cirugia-plastica-estetica-y-reconstructiva', null, 'Especialistas'),
      navLink('/cedulas-estatales', null, 'Cédulas Estatales'),
      dropdown('/datos-abiertos/autorizaciones-provisionales', 'Datos Abiertos', [
        ['/datos-abiertos/autorizaciones-provisionales', 'Autorizaciones'],
        ['/datos-abiertos/titulos-electronicos', 'Títulos'],
      ]),
      navLink('/contacto', null, 'Contacto'),
    ),
    mobilePanel,
  )

  function computeTop(btn) {
    const panel = btn.closest('.nav-drop-panel--subnav')
    return btn.offsetTop + btn.offsetHeight - (panel ? panel.scrollTop : 0)
  }

  function closeAll() {
    state.topbar = false
    state.subnav = false
    state.mobile = null
    sync()
  }
  function toggleTopbar() {
    state.subnav = false
    state.mobile = null
    state.topbar = !state.topbar
    sync()
  }
  function toggleSubnav() {
    state.topbar = false
    state.subnav = !state.subnav
    if (!state.subnav) state.mobile = null
    sync()
  }

  function sync() {
    topbarPanel.classList.toggle('nav-drop-panel--open', state.topbar)
    topbarPanel.setAttribute('aria-hidden', String(!state.topbar))
    topbarBtn.setAttribute('aria-expanded', String(state.topbar))
    topbarBtn.setAttribute('aria-label', state.topbar ? 'Cerrar menú superior' : 'Abrir menú superior')
    mobilePanel.classList.toggle('nav-drop-panel--open', state.subnav)
    mobilePanel.setAttribute('aria-hidden', String(!state.subnav))
    subnavBtn.setAttribute('aria-expanded', String(state.subnav))
    subnavBtn.setAttribute('aria-label', state.subnav ? 'Cerrar menú de secciones' : 'Abrir menú de secciones')

    for (const [key, btn] of Object.entries(mobileTriggers)) {
      btn.classList.toggle('mobile-nav-panel__trigger--open', state.mobile === key)
      btn.setAttribute('aria-expanded', String(state.mobile === key))
    }

    popupHost.replaceChildren()
    if (state.subnav && state.mobile) {
      const close = () => {
        state.mobile = null
        sync()
      }
      const content = h(
        'div',
        { className: 'mobile-dropdown-popup__content', onClick: (e) => e.stopPropagation() },
        h('button', { className: 'mobile-dropdown-popup__close', 'aria-label': 'Cerrar submenú', onClick: close }, '×'),
        popups[state.mobile].map(([to, label]) => dropLink(to, label)),
      )
      const popup = h('div', { className: 'mobile-dropdown-popup', onClick: close }, content)
      popup.style.setProperty('--mobile-dropdown-top', dropdownTop + 'px')
      popupHost.append(popup)
    }
  }

  // Escape cierra los menús; al pasar a escritorio también se cierran.
  const onKey = (e) => {
    if (e.key === 'Escape' && (state.topbar || state.subnav)) closeAll()
  }
  const mq = window.matchMedia('(min-width: 641px)')
  const onMq = () => mq.matches && closeAll()
  document.addEventListener('keydown', onKey)
  mq.addEventListener('change', onMq)
  onCleanup(() => {
    document.removeEventListener('keydown', onKey)
    mq.removeEventListener('change', onMq)
  })

  sync()
  return h('div', { className: 'site-nav' }, h('div', { className: 'topbar-stack' }, topbar, topbarPanel), subnav)
}
