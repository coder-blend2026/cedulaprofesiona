import { h, runCleanups } from './dom.js'
import { currentPath, enableLinkInterception, navigate, onRoute } from './router.js'
import { SiteNav } from './components/nav.js'
import { Footer, HeroSection, InfoPage } from './components/layout.js'
import { SearchPage } from './pages/search.js'
import { LoginPage } from './pages/login.js'
import { PanelPage } from './pages/panel.js'

const INFO_PAGES = {
  '/bienvenida': {
    title: 'Bienvenida',
    breadcrumb: 'Bienvenida',
    paragraphs: [
      'El Registro Nacional de Profesionistas, administrado por la Direccion General de Profesiones (DGP) de la Secretaria de Educacion Publica (SEP), es de acceso publico y permite consultar informacion de cedulas profesionales de forma oficial.',
      'Su proposito es facilitar la busqueda de profesionistas que cuentan con titulo registrado y cedula profesional con efectos de patente.',
      'La informacion publicada en este sitio se realiza con estricto apego a la Politica de Datos Abiertos y se actualiza periodicamente.',
    ],
  },
  '/cedulas-profesionales/validar-constancia': {
    title: 'Validar Constancia de Situacion Profesional',
    breadcrumb: 'Validar Constancia',
    paragraphs: [
      'En esta seccion podras validar la autenticidad de una constancia de situacion profesional.',
      'Proximamente se habilitara la consulta por folio y codigo de verificacion para confirmar su vigencia.',
    ],
  },
  '/terminos-y-condiciones': {
    title: 'Terminos y Condiciones',
    breadcrumb: 'Terminos y Condiciones',
    paragraphs: [
      'El uso de este portal implica la aceptacion de los terminos y condiciones publicados por la autoridad competente.',
      'Te recomendamos revisar este apartado para conocer alcances, responsabilidades y tratamiento de la informacion.',
    ],
  },
  '/especialistas/cirugia-plastica-estetica-y-reconstructiva': {
    title: 'Especialistas: Cirugia Plastica, Estetica y Reconstructiva',
    breadcrumb: 'Especialistas',
    paragraphs: [
      'Consulta informacion de profesionistas especialistas de acuerdo con su area de formacion.',
      'Este apartado sirve como referencia para identificar especialistas con registro oficial.',
    ],
  },
  '/cedulas-estatales': {
    title: 'Cedulas Estatales',
    breadcrumb: 'Cedulas Estatales',
    paragraphs: [
      'Aqui encontraras informacion relacionada con tramites y referencias de cedulas emitidas en las entidades federativas.',
      'Para detalles especificos, consulta tambien los portales de cada autoridad estatal.',
    ],
  },
  '/datos-abiertos/autorizaciones-provisionales': {
    title: 'Autorizaciones Provisionales',
    breadcrumb: 'Autorizaciones Provisionales',
    paragraphs: [
      'Conoce la informacion disponible sobre autorizaciones provisionales publicadas como datos abiertos.',
      'Los datasets se actualizan de forma periodica para su consulta y reutilizacion.',
    ],
  },
  '/datos-abiertos/titulos-electronicos': {
    title: 'Titulos Electronicos',
    breadcrumb: 'Titulos Electronicos',
    paragraphs: [
      'Este apartado concentra informacion de titulos electronicos dentro del esquema de datos abiertos.',
      'Puedes utilizar los recursos publicados para analisis, trazabilidad y consulta publica.',
    ],
  },
  '/contacto': {
    title: 'Contacto',
    breadcrumb: 'Contacto',
    paragraphs: [
      'Para dudas o aclaraciones, utiliza los canales oficiales de atencion de la Direccion General de Profesiones.',
      'Incluye el mayor detalle posible en tu solicitud para recibir una respuesta mas precisa.',
    ],
  },
  '/tramites': {
    title: 'Tramites',
    breadcrumb: 'Tramites',
    paragraphs: ['Consulta los tramites disponibles y sus requisitos dentro del portal institucional.'],
  },
  '/gobierno': {
    title: 'Gobierno',
    breadcrumb: 'Gobierno',
    paragraphs: ['Encuentra informacion institucional y enlaces oficiales del Gobierno de Mexico.'],
  },
}

const root = document.getElementById('root')

function render() {
  runCleanups()
  const path = currentPath()

  // Páginas sin menú ni pie: login y panel
  if (path === '/login' || path === '/panel-estudiantes') {
    document.title = path === '/login' ? 'Iniciar sesion' : 'Panel de Estudiantes'
    root.replaceChildren(h('div', { className: 'page' }, path === '/login' ? LoginPage() : PanelPage()))
    return
  }

  if (path === '/') return navigate('/bienvenida', { replace: true })

  let page
  if (path === '/cedulas-profesionales/busqueda') {
    page = SearchPage()
  } else if (INFO_PAGES[path]) {
    page = InfoPage(INFO_PAGES[path])
  } else {
    return navigate('/bienvenida', { replace: true })
  }

  document.title = 'cedulas verificadas'
  root.replaceChildren(h('div', { className: 'page' }, SiteNav(), HeroSection(), page, Footer()))
  window.scrollTo(0, 0)
}

enableLinkInterception()
onRoute(render)
render()
