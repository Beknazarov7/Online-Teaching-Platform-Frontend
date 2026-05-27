/**
 * Admin · Settings — account info, email update, password change,
 * appearance, and a list of fellow admins.
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../theme/ThemeContext'
import * as authApi from '../../api/auth'
import * as adminApi from '../../api/admin'

export default function AdminSettings() {
  const { user, refresh } = useAuth()
  const { theme, toggle } = useTheme()
  const [admins, setAdmins] = useState([])

  useEffect(() => {
    adminApi.listUsers({ role: 'admin' })
      .then(setAdmins)
      .catch(() => {/* silent — the rest of the page still works */})
  }, [])

  if (!user) return null

  let joined = '—'
  try { joined = format(parseISO(user.date_joined), 'd MMM yyyy') } catch { /* ignore */ }
  let lastSeen = 'Never'
  if (user.last_login) {
    try { lastSeen = formatDistanceToNow(parseISO(user.last_login), { addSuffix: true }) } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Settings</h1>
        <p className="text-body-sm text-secondary mt-1">
          Manage your admin account and platform-wide preferences.
        </p>
      </div>

      {/* Identity card */}
      <Card className="p-lg flex flex-col md:flex-row md:items-center gap-lg">
        <div className="w-20 h-20 rounded-full bg-primary text-on-primary grid place-items-center text-3xl font-black flex-shrink-0">
          {user.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{user.username}</h2>
          <p className="text-secondary text-sm break-all">{user.email || 'No email on file'}</p>
          <div className="flex flex-wrap gap-2 mt-md">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container">
              {user.role}
            </span>
            {user.is_superuser && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-tertiary/10 text-tertiary inline-flex items-center gap-1">
                <Icon name="shield" className="text-[14px]" /> Superuser
              </span>
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-fixed-dim">
              Joined {joined}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-fixed-dim">
              Last seen {lastSeen}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <EmailForm user={user} onSaved={refresh} />
        <PasswordForm />
      </div>

      <Card className="p-lg">
        <h3 className="text-h3 font-h3 mb-md text-on-surface dark:text-dark-on-surface flex items-center gap-2">
          <Icon name="palette" className="text-primary text-[22px]" />
          Appearance
        </h3>
        <div className="flex items-center justify-between gap-md">
          <div>
            <p className="text-sm font-semibold text-on-surface dark:text-dark-on-surface">Theme</p>
            <p className="text-xs text-secondary">Currently using <span className="font-bold">{theme === 'dark' ? 'dark' : 'light'}</span> mode.</p>
          </div>
          <button
            onClick={toggle}
            className="inline-flex items-center gap-2 bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-[18px]" />
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <h3 className="text-h3 font-h3 px-lg py-md text-on-surface dark:text-dark-on-surface border-b border-outline-variant dark:border-dark-outline-variant flex items-center gap-2">
          <Icon name="admin_panel_settings" className="text-tertiary text-[22px]" />
          Admin team
          <span className="ml-auto text-xs font-normal text-secondary">{admins.length} member{admins.length === 1 ? '' : 's'}</span>
        </h3>
        {admins.length === 0 ? (
          <p className="px-lg py-xl text-center text-secondary text-sm">No admins yet.</p>
        ) : (
          <ul className="divide-y divide-outline-variant dark:divide-dark-outline-variant">
            {admins.map((a) => (
              <li key={a.id} className="px-lg py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-tertiary/10 text-tertiary grid place-items-center font-bold text-sm">
                  {a.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-on-surface dark:text-dark-on-surface truncate flex items-center gap-1">
                    {a.username}
                    {a.id === user.id && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary dark:text-primary-fixed-dim">You</span>}
                    {a.is_superuser && <span title="Superuser" className="text-tertiary"><Icon name="shield" className="text-[14px]" /></span>}
                  </div>
                  <div className="text-xs text-secondary truncate">{a.email || '—'}</div>
                </div>
                {!a.is_active && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-error/10 text-error">Disabled</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

// ---------- forms ---------- //

function EmailForm({ user, onSaved }) {
  const [email, setEmail] = useState(user.email || '')
  const [busy, setBusy]   = useState(false)

  const dirty = email.trim() !== (user.email || '')

  async function save(e) {
    e.preventDefault()
    if (!dirty) return
    setBusy(true)
    try {
      await authApi.updateMe({ email: email.trim() })
      toast.success('Email updated.')
      await onSaved()
    } catch (err) {
      const data = err.response?.data
      const msg = data?.email?.[0] || data?.detail || 'Could not update email.'
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-lg">
      <h3 className="text-h3 font-h3 mb-md text-on-surface dark:text-dark-on-surface flex items-center gap-2">
        <Icon name="mail" className="text-primary text-[22px]" />
        Email address
      </h3>
      <form onSubmit={save} className="space-y-md">
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </Field>
        <button
          type="submit"
          disabled={busy || !dirty}
          className="w-full bg-primary text-on-primary font-medium text-button py-3 rounded-xl hover:bg-primary-container disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
        >
          {busy ? 'Saving…' : 'Update email'}
        </button>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    if (form.new_password.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    if (form.new_password !== form.confirm) {
      toast.error('New password and confirmation do not match.')
      return
    }
    setBusy(true)
    try {
      await authApi.changePassword({
        current_password: form.current_password,
        new_password:     form.new_password,
      })
      toast.success('Password changed.')
      setForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      const data = err.response?.data
      const msg = data?.current_password || data?.new_password?.[0] || data?.detail || 'Could not change password.'
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-lg">
      <h3 className="text-h3 font-h3 mb-md text-on-surface dark:text-dark-on-surface flex items-center gap-2">
        <Icon name="lock" className="text-primary text-[22px]" />
        Change password
      </h3>
      <form onSubmit={save} className="space-y-md">
        <Field label="Current password">
          <input
            type="password"
            required
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="New password">
          <input
            type="password"
            required
            minLength={8}
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            required
            minLength={8}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className={inputCls}
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-primary text-on-primary font-medium text-button py-3 rounded-xl hover:bg-primary-container disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
        >
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </Card>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none'
