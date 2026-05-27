import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Icon from '../components/Icon'
import * as authApi from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeContext'

export default function Register() {
  const { login } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await authApi.register(form)
      // Log the new user in immediately so they don't have to type the password again.
      await login(form.username, form.password)
      toast.success('Account created. Welcome!')
      navigate('/student/calendar', { replace: true })
    } catch (err) {
      const data = err.response?.data
      const msg =
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        'Could not create account.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-on-background dark:text-dark-on-background grid place-items-center p-md relative">
      <button
        onClick={toggle}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low text-on-surface-variant dark:text-dark-on-surface-variant"
      >
        <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <div className="inline-flex w-14 h-14 rounded-xl bg-primary text-on-primary items-center justify-center mb-md">
            <Icon name="person_add" className="text-3xl" />
          </div>
          <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Create student account</h1>
          <p className="text-body-sm text-secondary mt-1">Teachers and admins are added by the platform admin.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-surface-container-lowest dark:bg-dark-surface-container border border-outline-variant dark:border-dark-outline-variant rounded-xl shadow-sm p-lg space-y-md"
        >
          <Field label="Username" value={form.username} onChange={update('username')} required autoFocus />
          <Field label="Email" type="email" value={form.email} onChange={update('email')} />
          <Field label="Password" type="password" value={form.password} onChange={update('password')} required minLength={8} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary font-medium text-button py-2.5 rounded-lg shadow-sm hover:bg-primary-container disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>

          <p className="text-center text-sm text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
      />
    </div>
  )
}
