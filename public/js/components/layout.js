import { h } from '../dom.js'

export function HeroSection() {
  return h(
    'section',
    { className: 'hero' },
    h('div', {
      className: 'container',
      style: {
        backgroundImage: "url('/img/backgroundheroweb.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      },
    }),
  )
}

const plain = { style: { textDecoration: 'none' } }

export function Footer() {
  const accordion = (title, ...content) => {
    const body = h('div', { className: 'footer__accordion-content' }, ...content)
    const toggle = h(
      'button',
      {
        type: 'button',
        className: 'footer__accordion-toggle',
        'aria-expanded': 'false',
        onClick: () => {
          const open = body.classList.toggle('is-open')
          toggle.setAttribute('aria-expanded', String(open))
        },
      },
      h('h4', null, title),
      h('span', { className: 'chevron' }, 'v'),
    )
    return h('div', { className: 'footer__col' }, toggle, body)
  }

  const social = (label, img) =>
    h('a', { href: '#', className: 'social__item', 'aria-label': label }, h('img', { src: `/img/${img}`, alt: '' }))

  return h(
    'footer',
    { className: 'footer' },
    h(
      'div',
      { className: 'container footer__inner' },
      h('p', { className: 'footer__version' }, 'RNP v1.6.15'),
      h('div', { className: 'footer__brand' }, h('img', { src: '/img/logo_blanco.svg', alt: 'Gobierno de Mexico' })),
      accordion(
        'Enlaces',
        h('a', { href: '#', ...plain }, 'Datos abiertos de la SABG'),
        h('a', { href: '#', ...plain }, 'Marco Juridico'),
        h('a', { href: '#', ...plain }, 'Plataforma Nacional de Transparencia'),
        h('a', { href: '#', ...plain }, 'Transparencia para el pueblo'),
        h('a', { href: '#', ...plain }, 'Alerta'),
      ),
      accordion(
        '¿Que es gob.mx?',
        h(
          'p',
          null,
          'Es el portal unico de tramites, informacion y participacion ciudadana.',
          h('a', { className: 'footer__inline-link', href: '#', ...plain }, ' Leer mas'),
        ),
        h('a', { href: '#', ...plain }, 'Portal de datos abiertos'),
        h('a', { href: '#', ...plain }, 'Declaracion de accesibilidad'),
        h('a', { href: '#', ...plain }, 'Terminos y Condiciones'),
      ),
      h(
        'div',
        { className: 'footer__col' },
        h('h4', { className: 'footer__title-link' }, 'Denuncia contra servidores publicos'),
        h('h4', null, 'Siguenos en'),
        h(
          'div',
          { className: 'social' },
          social('Facebook', 'facebook.png'),
          social('X', 'twitter.png'),
          social('Instagram', 'instagram.png'),
          social('YouTube', 'youtube.png'),
        ),
        h('div', { className: 'support' }, h('img', { className: 'support__icon-image', src: '/img/079.png', alt: '' })),
      ),
    ),
  )
}

export function InfoPage({ title, breadcrumb, paragraphs }) {
  return h(
    'section',
    { className: 'content' },
    h(
      'div',
      { className: 'container' },
      h(
        'div',
        { className: 'breadcrumb' },
        h('span', { className: 'home' }, 'Inicio'),
        h('span', { className: 'chevron' }, '/'),
        h('span', { className: 'current' }, breadcrumb),
      ),
      h('h2', null, title),
      h('div', { className: 'rule' }),
      h('div', { className: 'info-copy' }, paragraphs.map((p) => h('p', null, p))),
    ),
  )
}
