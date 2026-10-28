import { h } from '../dom.js'
import { ApiError, login } from '../api.js'
import { navigate } from '../router.js'

export function LoginPage() {
  const error = h('div', null)
  const email = h('input', { type: 'email', placeholder: 'correo@ejemplo.com', autocomplete: 'username' })
  const password = h('input', { type: 'password', placeholder: 'Ingresa tu contrasena', autocomplete: 'current-password' })
  const submit = h('button', { className: 'login-btn', type: 'submit' }, 'Entrar')

  const setError = (msg) => error.replaceChildren(msg ? h('p', { className: 'login-message' }, msg) : '')
  const setLoading = (on) => {
    email.disabled = password.disabled = submit.disabled = on
    submit.textContent = on ? 'Entrando...' : 'Entrar'
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!email.value.trim() || !password.value) {
      return setError('Ingresa correo y contrasena.')
    }
    setLoading(true)
    try {
      await login(email.value.trim(), password.value)
      navigate('/panel-estudiantes', { replace: true })
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.fieldMessage || e.message || 'No se pudo iniciar sesion.')
      } else {
        setError('No se pudo iniciar sesion. Verifica la API y tu conexion.')
      }
      setLoading(false)
    }
  }

  return h(
    'section',
    { className: 'login-wrap' },
    h(
      'div',
      { className: 'container login-wrap__inner' },
      h(
        'div',
        { className: 'login-card' },
        h(
          'div',
          { className: 'login-card__brand-panel', 'aria-hidden': 'true' },
          h('img', { src: '/img/logo_blanco.svg', alt: '' }),
          h('p', { className: 'login-card__panel-title' }, 'Registro Nacional de Profesionistas'),
          h('p', { className: 'login-card__panel-copy' }, 'Plataforma institucional de acceso temporal para consulta y gestion.'),
        ),
        h(
          'div',
          { className: 'login-card__body' },
          h('span', { className: 'login-kicker' }, 'Acceso Seguro'),
          h('h2', null, 'Iniciar sesion'),
          h('p', { className: 'login-card__subtitle' }, 'Usa el correo registrado y tu contrasena.'),
          h(
            'form',
            { className: 'login-form', onSubmit },
            h('label', null, 'Correo electronico', email),
            h('label', null, 'Contrasena', password),
            error,
            submit,
          ),
        ),
      ),
    ),
  )
}
