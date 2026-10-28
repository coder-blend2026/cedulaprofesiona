import { h } from '../dom.js'
import { buildConstanciaVerificationUrl, constanciaQrDataUrl, downloadConstanciaPdf } from '../constancia.js'

/** Abre la vista previa de la constancia (datos + QR + botón de descarga). */
export function openConstanciaPreview(data) {
  const qrBox = h('div', null, h('p', { className: 'constancia-preview-qr-fallback' }, 'Generando QR...'))
  const errorBox = h('div', null)
  const downloadBtn = h('button', { type: 'button', className: 'btn primary' }, 'Descargar PDF')

  const close = () => {
    document.removeEventListener('keydown', onKey)
    backdrop.remove()
  }
  const onKey = (e) => e.key === 'Escape' && close()

  const row = (label, value) => h('div', null, h('dt', null, label), h('dd', null, value))

  downloadBtn.addEventListener('click', async () => {
    errorBox.replaceChildren()
    downloadBtn.disabled = true
    downloadBtn.textContent = 'Generando...'
    try {
      await downloadConstanciaPdf(data)
    } catch {
      errorBox.append(h('p', { className: 'constancia-preview-error' }, 'No se pudo generar el PDF. Intenta de nuevo.'))
    } finally {
      downloadBtn.disabled = false
      downloadBtn.textContent = 'Descargar PDF'
    }
  })

  const backdrop = h(
    'div',
    { className: 'modal-backdrop constancia-preview-backdrop', role: 'presentation', onClick: close },
    h(
      'div',
      {
        className: 'modal-card constancia-preview-card',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'constancia-preview-title',
        onClick: (e) => e.stopPropagation(),
      },
      h(
        'div',
        { className: 'modal-header' },
        h('h4', { id: 'constancia-preview-title' }, 'Constancia de situacion profesional'),
        h('button', { type: 'button', 'aria-label': 'Cerrar', onClick: close }, '×'),
      ),
      h(
        'div',
        { className: 'modal-body constancia-preview-body' },
        h(
          'p',
          { className: 'constancia-preview-lead' },
          'Vista previa de los datos que incluye el PDF. El codigo QR dirige a la busqueda publica por numero de cedula.',
        ),
        h(
          'div',
          { className: 'constancia-preview-grid' },
          h(
            'dl',
            { className: 'constancia-preview-dl' },
            row('Cedula', data.cedula),
            row('Nombre completo', `${data.nombre} ${data.primerApellido} ${data.segundoApellido}`),
            row('Genero', data.genero),
            row('Institucion', data.institucion),
            row('Profesion', data.profesion),
            row('Entidad', data.entidad),
            row('Anio de registro', data.anioRegistro),
          ),
          h(
            'div',
            { className: 'constancia-preview-qr' },
            qrBox,
            h(
              'a',
              { className: 'constancia-preview-link', href: buildConstanciaVerificationUrl(data.cedula), target: '_blank', rel: 'noreferrer' },
              'Abrir busqueda publica con esta cedula',
            ),
          ),
        ),
        errorBox,
        h(
          'div',
          { className: 'constancia-preview-actions' },
          h('button', { type: 'button', className: 'btn secondary', onClick: close }, 'Cerrar'),
          downloadBtn,
        ),
      ),
    ),
  )

  document.addEventListener('keydown', onKey)
  document.body.append(backdrop)

  constanciaQrDataUrl(data.cedula)
    .then((src) => {
      qrBox.replaceChildren(
        h('img', { src, alt: 'Codigo QR para verificar la cedula en el portal publico', width: 160, height: 160 }),
      )
    })
    .catch(() => {
      qrBox.replaceChildren(h('p', { className: 'constancia-preview-qr-fallback' }, 'No se pudo generar el codigo QR.'))
    })

  return close
}
