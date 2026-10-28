import { h, html } from '../dom.js'
import { fetchPublicEstudiantes } from '../api.js'
import { currentSearchParams } from '../router.js'
import { downloadConstanciaPdf, estudianteToRow } from '../constancia.js'

const FILE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-6zm1 7V4.5L18.5 9H15zm-1 4h2v6h-2v-6zm-6 1.5A2.5 2.5 0 1 1 10.5 17 2.5 2.5 0 0 1 8 14.5z" fill="currentColor" /></svg>'
const HOME_ICON =
  '<svg class="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>'

export function SearchPage() {
  // ---- Estado (equivale al hook useSearch) ----
  const s = {
    tab: 'cedula',
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
    curp: '',
    numeroCedula: '',
    rows: [],
    show: false,
    page: 1,
    params: null,
    lastPage: 1,
    total: 0,
    loading: false,
    error: '',
  }
  let requestId = 0

  const formHost = h('div', null)
  const errorHost = h('div', null)
  const loadingHost = h('div', null)
  const resultsHost = h('div', null)

  async function load() {
    if (s.params === null) return
    const id = ++requestId
    s.loading = true
    s.error = ''
    renderStatus()
    renderResults()
    try {
      const res = await fetchPublicEstudiantes({ ...s.params, page: s.page })
      if (id !== requestId) return
      s.rows = res.data.map(estudianteToRow)
      s.lastPage = Math.max(1, res.meta.last_page)
      s.total = res.meta.total
    } catch (e) {
      if (id !== requestId) return
      s.error = e instanceof Error ? e.message : 'No se pudo cargar la lista.'
      s.rows = []
      s.lastPage = 1
      s.total = 0
    } finally {
      if (id === requestId) {
        s.loading = false
        renderStatus()
        renderResults()
      }
    }
  }

  function runSearch() {
    s.error = ''
    if (s.tab === 'cedula') {
      const c = s.numeroCedula.trim().toUpperCase()
      if (!c) {
        s.error = 'Ingresa el numero de cedula.'
        return renderStatus()
      }
      s.numeroCedula = c
      s.params = { search: c }
    } else {
      const n = s.nombre.trim().toUpperCase()
      const pa = s.primerApellido.trim().toUpperCase()
      if (!n || !pa) {
        s.error = 'Nombre y primer apellido son obligatorios.'
        return renderStatus()
      }
      const params = { nombre: n, primerApellido: pa }
      const sa = s.segundoApellido.trim().toUpperCase()
      if (sa) params.segundoApellido = sa
      const cu = s.curp.trim().toUpperCase()
      if (cu) params.curp = cu
      Object.assign(s, { nombre: n, primerApellido: pa, segundoApellido: sa, curp: cu })
      s.params = params
    }
    s.page = 1
    s.show = true
    renderForm()
    load()
  }

  function clearSearch() {
    Object.assign(s, {
      nombre: '', primerApellido: '', segundoApellido: '', curp: '', numeroCedula: '',
      rows: [], show: false, page: 1, params: null, error: '', lastPage: 1, total: 0, loading: false,
    })
    requestId++
    renderForm()
    renderStatus()
    renderResults()
  }

  function goTo(page) {
    s.page = Math.min(s.lastPage, Math.max(1, page))
    load()
  }

  // ---- Vistas ----
  const upperInput = (placeholder, key) =>
    h('input', {
      type: 'text',
      placeholder,
      value: s[key],
      autocapitalize: 'characters',
      autocorrect: 'off',
      spellcheck: 'false',
      onInput: (e) => {
        e.target.value = e.target.value.toUpperCase()
        s[key] = e.target.value
      },
      onKeydown: (e) => e.key === 'Enter' && runSearch(),
    })

  function renderForm() {
    const tabBtn = (key, label) =>
      h('button', {
        className: `tab ${s.tab === key ? 'active' : ''}`,
        type: 'button',
        onClick: () => {
          s.tab = key
          renderForm()
        },
      }, label)

    const fields =
      s.tab === 'cedula'
        ? h('label', { className: 'cedula-field' }, 'Número de Cédula*:', upperInput('Cédula', 'numeroCedula'))
        : [
            h('label', null, 'Nombre(s)*', upperInput('Nombre(s)', 'nombre')),
            h('label', null, 'Primer Apellido*', upperInput('Primer Apellido', 'primerApellido')),
            h('label', null, 'Segundo Apellido', upperInput('Segundo Apellido', 'segundoApellido')),
            h('label', { className: 'curp-label' }, h('div', { className: 'label-text-wrapper' }, 'CURP'), upperInput('CURP', 'curp')),
          ]

    formHost.replaceChildren(
      h(
        'section',
        { className: 'card' },
        h('div', { className: 'tabs' }, tabBtn('general', 'Datos generales'), tabBtn('cedula', 'Número de cédula')),
        h(
          'div',
          { className: `card__body ${s.tab === 'cedula' ? 'card__body--cedula' : ''}` },
          h('div', { className: 'form-grid' }, fields),
          h(
            'div',
            { className: 'actions' },
            h('button', { className: 'btn primary', type: 'button', onClick: runSearch }, 'Buscar'),
            h('button', { className: 'btn secondary', type: 'button', onClick: clearSearch }, 'Limpiar'),
            h('button', { className: 'btn muted', type: 'button', disabled: true }, 'Descargar CSV'),
          ),
        ),
      ),
    )
  }

  function renderStatus() {
    errorHost.replaceChildren(s.error ? h('p', { className: 'search-api-error', role: 'alert' }, s.error) : '')
    loadingHost.replaceChildren(s.loading && !s.show ? h('div', { className: 'loading-spinner' }, 'Buscando cédula...') : '')
  }

  function renderResults() {
    if (!s.show) return resultsHost.replaceChildren()

    const emptyRow = (text) => h('tr', null, h('td', { colSpan: 10, className: 'empty-state' }, text))
    const body =
      s.loading && s.rows.length === 0
        ? emptyRow('Cargando...')
        : s.rows.length === 0
          ? emptyRow('No se encontraron resultados')
          : s.rows.map((row) => {
              const btn = h('button', {
                type: 'button',
                className: 'constancia-btn',
                'aria-label': 'Descargar constancia en PDF',
                disabled: s.loading,
                onClick: async () => {
                  try {
                    await downloadConstanciaPdf(row)
                  } catch {
                    window.alert('No se pudo generar el PDF. Intenta de nuevo.')
                  }
                },
              })
              btn.append(html(FILE_ICON))
              return h(
                'tr',
                null,
                h('td', null, row.cedula),
                h('td', null, row.nombre),
                h('td', null, row.primerApellido),
                h('td', null, row.segundoApellido),
                h('td', { style: { textTransform: 'uppercase' } }, row.genero),
                h('td', null, row.institucion),
                h('td', null, row.profesion),
                h('td', null, row.entidad),
                h('td', null, row.anioRegistro),
                h('td', null, btn),
              )
            })

    const pagination =
      s.total > 0
        ? h(
            'div',
            { className: 'pagination', 'aria-label': 'Paginacion de resultados' },
            h('button', { type: 'button', className: 'page-btn', disabled: s.page === 1, onClick: () => goTo(s.page - 1) }, '«'),
            Array.from({ length: s.lastPage }, (_, i) => i + 1).map((p) =>
              h('button', { type: 'button', className: `page-btn ${s.page === p ? 'active' : ''}`, onClick: () => goTo(p) }, p),
            ),
            h('button', { type: 'button', className: 'page-btn', disabled: s.page === s.lastPage, onClick: () => goTo(s.page + 1) }, '»'),
          )
        : null

    const heads = ['Núm. Cédula', 'Nombre', 'Primer Apellido', 'Segundo Apellido', 'Género', 'Institución', 'Profesión', 'Entidad Federativa Institución', 'Año de Registro', 'Constancia']
    resultsHost.replaceChildren(
      h(
        'section',
        { className: 'result-card' },
        h('h3', { className: 'result-title' }, 'Resultados de la Búsqueda'),
        s.loading ? h('p', { className: 'result-loading' }, 'Cargando resultados...') : null,
        h(
          'div',
          { className: 'result-table-wrap' },
          h('table', { className: 'result-table' }, h('thead', null, h('tr', null, heads.map((t) => h('th', null, t)))), h('tbody', null, body)),
        ),
        pagination,
      ),
    )
  }

  renderForm()
  renderStatus()
  renderResults()

  // ?cedula=XXXX en la URL (viene del QR de la constancia): busca automáticamente
  const cedulaFromUrl = (currentSearchParams().get('cedula') || '').trim().toUpperCase()
  if (cedulaFromUrl) {
    s.tab = 'cedula'
    s.numeroCedula = cedulaFromUrl
    s.params = { search: cedulaFromUrl }
    s.show = true
    renderForm()
    load()
  }

  return h(
    'section',
    { className: 'content' },
    h(
      'div',
      { className: 'container' },
      h('div', { className: 'breadcrumb' }, html(HOME_ICON), h('span', null, 'Inicio'), h('span', { className: 'chevron' }, '/'), h('span', { className: 'current' }, 'Búsqueda de Cédulas Profesionales')),
      h('h2', { className: 'titlesection' }, 'Realiza tu búsqueda de forma segura y confiable.'),
      h('div', { className: 'rule' }),
      h(
        'p',
        { className: 'lead' },
        'Al ingresar los datos, los resultados te mostrarán que la persona profesionista cuenta con título registrado y cédula profesional expedida, cumpliendo con todos los requisitos de la ley. La información publicada en este sitio se realiza con estricto apego a la ',
        h('strong', null, ' Política de Datos Abiertos'),
        ' y en congruencia con los principios que rigen su publicación. Dicha información se actualiza de manera periódica; en consecuencia, la Secretaría de Educación Pública se deslinda de cualquier responsabilidad derivada de su uso, reproducción o modalidad que pudiera adquirir en sitios web distintos al oficial.',
      ),
      h(
        'section',
        { className: 'notice' },
        h('h3', null, 'Descarga la Constancia de Situación Profesional'),
        h('br'),
        h('p', null, 'Recuerda: ', h('strong', null, 'La emisión de la Constancia es completamente gratuita.')),
      ),
      formHost,
      errorHost,
      loadingHost,
      resultsHost,
    ),
  )
}
