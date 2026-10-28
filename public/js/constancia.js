import { BASE, getApiBase } from './api.js'

export function estudianteToRow(e) {
  return {
    cedula: e.cedula ?? '',
    nombre: e.nombre ?? '',
    primerApellido: e.primerApellido ?? '',
    segundoApellido: e.segundoApellido ?? '',
    genero: e.genero ?? '',
    institucion: e.institucion ?? '',
    profesion: e.profesion ?? '',
    entidad: e.entidad ?? '',
    anioRegistro: e.anioRegistro ?? '',
  }
}

/** URL pública que abre la búsqueda por cédula. */
export function buildConstanciaVerificationUrl(cedula) {
  const safe = (cedula || '').trim()
  if (!safe) return '#'
  return `${window.location.origin}${BASE}/cedulas-profesionales/busqueda?cedula=${encodeURIComponent(safe)}`
}

function safePdfFileName(data) {
  const raw = `CONSTANCIA_${data.nombre || 'DOCUMENTO'}_${data.primerApellido || ''}_${data.cedula || '000'}`
  return `${raw.replace(/[^\w\-./]+/g, '_').replace(/_+/g, '_')}.pdf`
}

/** Descarga el PDF generado en PHP. */
export async function downloadConstanciaPdf(data) {
  if (!data || !data.cedula) throw new Error('Cédula no proporcionada para la descarga')

  const res = await fetch(`${getApiBase()}/public/constancia-pdf?cedula=${encodeURIComponent(data.cedula.trim())}`)
  if (!res.ok) {
    let msg = `Error ${res.status}`
    try {
      const j = await res.json()
      if (j && j.message) msg = j.message
    } catch {
      /* ignorar */
    }
    throw new Error(msg)
  }

  const href = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = href
  a.download = safePdfFileName(data)
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
}

/** QR de verificación como data URL (usa la librería qrcode.js incluida en /js/vendor). */
export async function constanciaQrDataUrl(cedula) {
  if (!cedula) return ''
  return window.QRCode.toDataURL(buildConstanciaVerificationUrl(cedula), {
    width: 180,
    margin: 2,
    color: { dark: '#390b1f', light: '#ffffff' },
  })
}
