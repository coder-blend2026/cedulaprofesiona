import { h } from '../dom.js'

const EMPTY = {
  cedula: '', nombre: '', primerApellido: '', segundoApellido: '', curp: '',
  genero: '', institucion: '', profesion: '', entidad: '', anioRegistro: '', seccion: '',
}

function fromEstudiante(row) {
  if (!row) return { ...EMPTY }
  const v = {}
  for (const k of Object.keys(EMPTY)) v[k] = row[k] ?? ''
  return v
}

function validate(values) {
  const err = {}

  const cedula = values.cedula.trim()
  if (!cedula) err.cedula = 'La cedula profesional es obligatoria.'
  else if (cedula.length < 3) err.cedula = 'La cedula debe tener al menos 3 caracteres.'
  else if (cedula.length > 64) err.cedula = 'Maximo 64 caracteres.'

  const nombre = values.nombre.trim()
  if (!nombre) err.nombre = 'El nombre es obligatorio.'
  else if (nombre.length < 2) err.nombre = 'Escribe al menos 2 caracteres.'

  const pa = values.primerApellido.trim()
  if (!pa) err.primerApellido = 'El primer apellido es obligatorio.'
  else if (pa.length < 2) err.primerApellido = 'Escribe al menos 2 caracteres.'

  if (values.segundoApellido.trim().length > 120) err.segundoApellido = 'Maximo 120 caracteres.'
  if (values.curp.trim().length > 32) err.curp = 'Maximo 32 caracteres.'
  if (!values.genero.trim()) err.genero = 'Selecciona una opcion de genero.'

  const inst = values.institucion.trim()
  if (!inst) err.institucion = 'La institucion es obligatoria.'
  else if (inst.length < 2) err.institucion = 'Escribe al menos 2 caracteres.'

  const prof = values.profesion.trim()
  if (!prof) err.profesion = 'La profesion o titulo es obligatorio.'
  else if (prof.length < 2) err.profesion = 'Escribe al menos 2 caracteres.'

  const ent = values.entidad.trim()
  if (!ent) err.entidad = 'La entidad federativa es obligatoria.'
  else if (ent.length < 2) err.entidad = 'Escribe al menos 2 caracteres.'

  const anio = values.anioRegistro.trim()
  if (!anio) err.anioRegistro = 'El anio de registro es obligatorio.'
  else if (!/^\d{4}$/.test(anio)) err.anioRegistro = 'Usa un anio valido de 4 digitos (ej. 2024).'
  else {
    const current = new Date().getFullYear()
    if (Number(anio) < 1950 || Number(anio) > current + 1) err.anioRegistro = `El anio debe estar entre 1950 y ${current + 1}.`
  }

  if (values.seccion.trim().length > 255) err.seccion = 'Maximo 255 caracteres.'
  return err
}

function toPayload(v) {
  return {
    cedula: v.cedula.trim(),
    nombre: v.nombre.trim(),
    primerApellido: v.primerApellido.trim(),
    segundoApellido: v.segundoApellido.trim() || undefined,
    curp: v.curp.trim() ? v.curp.trim().toUpperCase() : undefined,
    genero: v.genero.trim(),
    institucion: v.institucion.trim(),
    profesion: v.profesion.trim(),
    entidad: v.entidad.trim(),
    anioRegistro: v.anioRegistro.trim(),
    seccion: v.seccion.trim() || undefined,
  }
}

/**
 * Modal de alta / edición.
 * options: { mode: 'create'|'edit', initial, onSubmit(payload) => Promise, onClose }
 * Devuelve { close, setError, setSubmitting }.
 */
export function openEstudianteForm({ mode, initial, onSubmit, onClose }) {
  const values = fromEstudiante(initial)
  let submitting = false

  const inputs = {}
  const errorSpans = {}

  const field = (key, label, { required = false, wide = false, type = 'input', props = {}, hint } = {}) => {
    const id = `ef-${key}`
    const control =
      type === 'select'
        ? h(
            'select',
            { id, className: 'panel-field__input' },
            h('option', { value: '' }, 'Selecciona'),
            h('option', { value: 'FEMENINO' }, 'Femenino'),
            h('option', { value: 'MASCULINO' }, 'Masculino'),
            h('option', { value: 'OTRO' }, 'Otro'),
          )
        : h('input', { id, className: 'panel-field__input', autocomplete: 'off', ...props })
    control.value = values[key]
    control.addEventListener(type === 'select' ? 'change' : 'input', (e) => {
      if (key === 'curp') e.target.value = e.target.value.toUpperCase()
      values[key] = e.target.value
      showError(key, '')
    })
    inputs[key] = control
    errorSpans[key] = h('span', { id: `${id}-err`, className: 'panel-field__error' })
    errorSpans[key].hidden = true

    return h(
      'div',
      { className: 'panel-field' + (wide ? ' panel-field--wide' : '') },
      h('label', { className: 'panel-field__label', htmlFor: id }, label, required ? [' ', h('span', { className: 'req' }, '*')] : null),
      control,
      errorSpans[key],
      hint ? h('span', { className: 'panel-field__hint' }, hint) : null,
    )
  }

  function showError(key, msg) {
    errorSpans[key].textContent = msg
    errorSpans[key].hidden = !msg
    inputs[key].className = 'panel-field__input' + (msg ? ' panel-field__input--error' : '')
    inputs[key].setAttribute('aria-invalid', String(!!msg))
  }

  const cedulaField = field('cedula', 'Cedula profesional', {
    required: true,
    props: mode === 'edit' ? { readOnly: true } : {},
    hint: mode === 'edit' ? 'La cedula no se puede modificar.' : undefined,
  })

  const section = (legend, ...content) => {
    const fs = h('fieldset', { className: 'estudiante-form__section' }, h('legend', { className: 'estudiante-form__legend' }, legend), ...content)
    sections.push(fs)
    return fs
  }
  const sections = []

  const alertHost = h('div', null)
  const cancelBtn = h('button', { type: 'button', className: 'btn secondary', onClick: requestClose }, 'Cancelar')
  const saveBtn = h('button', { type: 'submit', className: 'btn primary' }, mode === 'edit' ? 'Guardar cambios' : 'Registrar')
  const closeBtn = h('button', { type: 'button', className: 'panel-modal-close', 'aria-label': 'Cerrar', onClick: requestClose }, '×')

  const form = h(
    'form',
    { className: 'estudiante-form', noValidate: true, onSubmit: handleSubmit },
    section('Identificacion', h('p', { className: 'estudiante-form__hint' }, 'Datos unicos del registro profesional.'), cedulaField),
    section(
      'Datos personales',
      h(
        'div',
        { className: 'estudiante-form__grid' },
        field('nombre', 'Nombre', { required: true }),
        field('primerApellido', 'Primer apellido', { required: true }),
        field('segundoApellido', 'Segundo apellido'),
        field('curp', 'CURP', { props: { maxLength: 32 } }),
        field('genero', 'Genero', { required: true, type: 'select' }),
      ),
    ),
    section(
      'Formacion e institucion',
      h(
        'div',
        { className: 'estudiante-form__grid' },
        field('institucion', 'Institucion', { required: true, wide: true }),
        field('profesion', 'Profesion / titulo', { required: true, wide: true }),
        field('entidad', 'Entidad federativa', { required: true }),
        field('anioRegistro', 'Anio de registro', { required: true, props: { inputMode: 'numeric', maxLength: 4, placeholder: 'Ej. 2024' } }),
        field('seccion', 'Seccion', { wide: true, props: { maxLength: 255 } }),
      ),
    ),
    h('div', { className: 'panel-modal-footer' }, cancelBtn, saveBtn),
  )

  const backdrop = h(
    'div',
    {
      className: 'panel-modal-backdrop',
      role: 'presentation',
      onClick: (ev) => ev.target === ev.currentTarget && requestClose(),
    },
    h(
      'div',
      { className: 'panel-modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ef-title' },
      h('div', { className: 'panel-modal-header' }, h('h2', { id: 'ef-title', className: 'panel-modal-title' }, mode === 'edit' ? 'Editar estudiante' : 'Registrar estudiante'), closeBtn),
      h('div', { className: 'panel-modal-body' }, alertHost, form),
    ),
  )

  function requestClose() {
    if (!submitting) close()
  }
  function close() {
    document.removeEventListener('keydown', onKey)
    backdrop.remove()
    onClose && onClose()
  }
  const onKey = (e) => e.key === 'Escape' && requestClose()

  function setSubmitting(on) {
    submitting = on
    sections.forEach((fs) => (fs.disabled = on))
    cancelBtn.disabled = closeBtn.disabled = saveBtn.disabled = on
    saveBtn.textContent = on ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Registrar'
  }

  function setError(msg) {
    alertHost.replaceChildren(msg ? h('div', { className: 'panel-modal-alert', role: 'alert' }, msg) : '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(values)
    for (const key of Object.keys(EMPTY)) showError(key, errs[key] || '')
    if (Object.keys(errs).length) return
    setError('')
    await onSubmit(toPayload(values), { setError, setSubmitting, close })
  }

  document.addEventListener('keydown', onKey)
  document.body.append(backdrop)
  setTimeout(() => (mode === 'create' ? inputs.cedula : inputs.nombre).focus(), 50)

  return { close, setError, setSubmitting }
}
