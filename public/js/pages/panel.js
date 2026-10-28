import { h } from '../dom.js'
import {
  ApiError,
  createEstudiante,
  deleteEstudiante,
  fetchEstudiantesAutenticados,
  getStoredToken,
  logout,
  updateEstudiante,
} from '../api.js'
import { navigate } from '../router.js'
import { estudianteToRow } from '../constancia.js'
import { openEstudianteForm } from '../components/estudianteForm.js'
import { openConstanciaPreview } from '../components/constanciaModal.js'

/** Panel protegido: si no hay token, manda al login. */
export function PanelPage() {
  if (!getStoredToken()) {
    queueMicrotask(() => navigate('/login', { replace: true }))
    return h(
      'section',
      { className: 'login-wrap' },
      h('div', { className: 'container login-wrap__inner' }, h('p', { className: 'login-message' }, 'Redirigiendo al inicio de sesion...')),
    )
  }

  const s = { rows: [], page: 1, lastPage: 1, total: 0, applied: '', loading: true, error: '' }

  const statusHost = h('div', null)
  const tbody = h('tbody', null)
  const paginationHost = h('div', null)
  const filterInput = h('input', { type: 'search', placeholder: 'Buscar por nombre, cedula, profesion...', 'aria-label': 'Filtro de busqueda' })

  async function loadList() {
    s.loading = true
    s.error = ''
    render()
    try {
      const res = await fetchEstudiantesAutenticados(s.page, s.applied.trim() || undefined)
      s.rows = res.data
      s.lastPage = Math.max(1, res.meta.last_page)
      s.total = res.meta.total
    } catch (e) {
      s.error = e instanceof Error ? e.message : 'No se pudo cargar la lista.'
      s.rows = []
    } finally {
      s.loading = false
      render()
    }
  }

  function openForm(row) {
    openEstudianteForm({
      mode: row ? 'edit' : 'create',
      initial: row,
      onSubmit: async (payload, ui) => {
        ui.setSubmitting(true)
        try {
          const saved = row ? await updateEstudiante(row.id, payload) : await createEstudiante(payload)
          ui.close()
          await loadList()
          openConstanciaPreview(estudianteToRow(saved))
        } catch (e) {
          ui.setError(e instanceof ApiError ? e.fieldMessage || e.message : 'Error al guardar el estudiante.')
          ui.setSubmitting(false)
        }
      },
    })
  }

  async function onDelete(id) {
    if (!window.confirm('Estas seguro de eliminar este estudiante?')) return
    try {
      await deleteEstudiante(id)
      if (s.rows.length <= 1 && s.page > 1) s.page -= 1
      await loadList()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'No se pudo eliminar.')
    }
  }

  async function onLogout() {
    try {
      await logout()
    } catch {
      /* el token se borra en el servicio */
    }
    navigate('/login', { replace: true })
  }

  function setPage(p) {
    s.page = Math.min(s.lastPage, Math.max(1, p))
    loadList()
  }

  function render() {
    statusHost.replaceChildren(
      s.error ? h('p', { className: 'student-panel__error' }, s.error) : '',
      s.loading ? h('p', { className: 'student-panel__muted' }, 'Cargando...') : '',
    )

    tbody.replaceChildren(
      ...(!s.loading && s.rows.length === 0
        ? [h('tr', null, h('td', { colSpan: 11, className: 'student-panel__empty' }, 'No hay estudiantes. Usa "Agregar estudiante" o ajusta el filtro.'))]
        : s.rows.map((row) =>
            h(
              'tr',
              null,
              h('td', null, row.cedula),
              h('td', null, row.nombre),
              h('td', null, `${row.primerApellido} ${row.segundoApellido ?? ''}`),
              h('td', null, row.genero),
              h('td', null, row.institucion),
              h('td', null, row.profesion),
              h('td', null, row.entidad),
              h('td', null, row.anioRegistro),
              h('td', null, row.seccion || '—'),
              h('td', null, h('button', { type: 'button', className: 'btn secondary student-panel__constancia-btn', onClick: () => openConstanciaPreview(estudianteToRow(row)) }, 'Ver')),
              h(
                'td',
                null,
                h(
                  'div',
                  { className: 'student-panel__table-actions' },
                  h('button', { className: 'btn secondary', type: 'button', onClick: () => openForm(row) }, 'Editar'),
                  h('button', { className: 'btn student-panel__delete-btn', type: 'button', onClick: () => onDelete(row.id) }, 'Eliminar'),
                ),
              ),
            ),
          )),
    )

    // Ventana de hasta 7 números de página
    const windowSize = 7
    const start = Math.max(1, Math.min(s.page - Math.floor(windowSize / 2), s.lastPage - windowSize + 1))
    const end = Math.min(s.lastPage, Math.max(windowSize, start + windowSize - 1))
    const numbers = Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i)

    paginationHost.replaceChildren(
      s.total > 0
        ? h(
            'div',
            { className: 'student-panel__pagination', 'aria-label': 'Paginacion' },
            h('span', { className: 'student-panel__muted' }, `Total: ${s.total} · Pagina ${s.page} de ${s.lastPage}`),
            h(
              'div',
              { className: 'student-panel__pagination-btns' },
              h('button', { type: 'button', className: 'btn secondary', disabled: s.page <= 1 || s.loading, onClick: () => setPage(s.page - 1) }, 'Anterior'),
              numbers.map((p) =>
                h('button', { type: 'button', className: `btn secondary ${p === s.page ? 'student-panel__page--active' : ''}`, disabled: s.loading, onClick: () => setPage(p) }, p),
              ),
              h('button', { type: 'button', className: 'btn secondary', disabled: s.page >= s.lastPage || s.loading, onClick: () => setPage(s.page + 1) }, 'Siguiente'),
            ),
          )
        : '',
    )
  }

  const applyFilter = () => {
    s.applied = filterInput.value.trim()
    s.page = 1
    loadList()
  }
  filterInput.addEventListener('keydown', (e) => e.key === 'Enter' && applyFilter())

  const heads = ['Cedula', 'Nombre', 'Apellidos', 'Genero', 'Institucion', 'Profesion', 'Entidad', 'Anio', 'Seccion', 'Constancia', 'Acciones']

  const view = h(
    'section',
    { className: 'student-panel' },
    h(
      'div',
      { className: 'container student-panel__inner' },
      h(
        'header',
        { className: 'student-panel__header' },
        h('img', { src: '/img/logo_blanco.svg', alt: 'Gobierno de Mexico' }),
        h(
          'div',
          { className: 'student-panel__header-text' },
          h('h1', null, 'Panel de Estudiantes'),
          h('p', null, 'Gestiona registros alineados al modelo de la API (cedula, nombre, profesion, etc.).'),
        ),
        h('button', { type: 'button', className: 'btn secondary student-panel__logout', onClick: onLogout }, 'Cerrar sesion'),
      ),
      h(
        'section',
        { className: 'student-panel__card student-panel__card--table' },
        h(
          'div',
          { className: 'student-panel__toolbar' },
          h('h2', null, 'Estudiantes registrados'),
          h('div', { className: 'student-panel__toolbar-actions' }, h('button', { type: 'button', className: 'btn primary', onClick: () => openForm(null) }, 'Agregar estudiante')),
          h('div', { className: 'student-panel__filter' }, filterInput, h('button', { type: 'button', className: 'btn secondary', onClick: applyFilter }, 'Buscar')),
        ),
        statusHost,
        h(
          'div',
          { className: 'student-panel__table-wrap student-panel__table-scroll' },
          h(
            'table',
            { className: 'student-panel__table student-panel__table--dense student-panel__table--striped' },
            h('thead', null, h('tr', null, heads.map((t) => h('th', null, t)))),
            tbody,
          ),
        ),
        paginationHost,
      ),
    ),
  )

  loadList()
  return view
}
