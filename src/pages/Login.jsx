import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Icon from '../components/Icon'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeContext'

export default function Login() {
  const { login } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Where to send the user after a successful login: back where they tried
  // to go (if any), otherwise to their role-default home.
  const fallback = (role) => (role === 'teacher' ? '/teacher/slots' : '/student/calendar')
  const from = location.state?.from?.pathname

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const me = await login(username, password)
      toast.success(`Welcome back, ${me.username}!`)
      navigate(from || fallback(me.role), { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid username or password.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-on-background dark:text-dark-on-background grid place-items-center p-md relative">
      {/* Theme toggle — top right */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low text-on-surface-variant dark:text-dark-on-surface-variant"
        aria-label="Toggle theme"
      >
        <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <div className="inline-flex w-14 h-14 rounded-xl bg-primary text-on-primary items-center justify-center mb-md">
            <Icon name="school" className="text-3xl" />
          </div>
          <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Learning Portal</h1>
          <p className="text-body-sm text-secondary mt-1">Sign in to continue</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-surface-container-lowest dark:bg-dark-surface-container border border-outline-variant dark:border-dark-outline-variant rounded-xl shadow-sm p-lg space-y-md"
        >
          <div>
            <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary font-medium text-button py-2.5 rounded-lg shadow-sm hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register as student
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
