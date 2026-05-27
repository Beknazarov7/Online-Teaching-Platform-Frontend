/**
 * Shared create/edit user modals — used by the admin Dashboard mini-table
 * and the full Management page.
 */
import { useState } from 'react'
import toast from 'react-hot-toast'
import * as adminApi from '../../api/admin'

export function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'student' })
  const [busy, setBusy] = useState(false)

  async function go(e) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      await adminApi.createUser(form)
      toast.success('Account created.')
      await onCreated()
    } catch (err) {
      const data = err.response?.data
      const msg = data?.username?.[0] || data?.detail || Object.values(data || {})[0] || 'Could not create account.'
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={go}>
        <div className="p-lg border-b border-outline-variant dark:border-dark-outline-variant">
          <h3 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">Create account</h3>
          <p className="text-body-sm text-secondary mt-1">Provision any role from here.</p>
        </div>
        <div className="p-lg space-y-md">
          <Field label="Username">
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputCls}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
        </div>
        <div className="p-lg bg-surface-container-low dark:bg-dark-surface-container-low flex flex-col gap-2">
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-on-primary font-medium text-button py-3 rounded-xl hover:bg-primary-container disabled:opacity-60 shadow-md transition-all active:scale-[0.98]"
          >
            {busy ? 'Creating…' : 'Create account'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full text-secondary font-medium text-button py-2 hover:text-on-surface dark:hover:text-dark-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function EditUserModal({ user, onClose, onSaved }) {
  const [role, setRole]       = useState(user.role)
  const [isActive, setActive] = useState(user.is_active)
  const [busy, setBusy]       = useState(false)

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await adminApi.updateUser(user.id, { role, is_active: isActive })
      toast.success('User updated.')
      await onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  async function destroy() {
    if (!confirm(`Delete ${user.username}? This cannot be undone.`)) return
    setBusy(true)
    try {
      await adminApi.deleteUser(user.id)
      toast.success('User deleted.')
      await onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={save}>
        <div className="p-lg border-b border-outline-variant dark:border-dark-outline-variant">
          <h3 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">Edit user</h3>
          <p className="text-body-sm text-secondary mt-1">@{user.username}</p>
        </div>
        <div className="p-lg space-y-md">
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="text-sm text-on-surface dark:text-dark-on-surface">Account active</span>
          </label>
        </div>
        <div className="p-lg bg-surface-container-low dark:bg-dark-surface-container-low flex flex-col gap-2">
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-on-primary font-medium text-button py-3 rounded-xl hover:bg-primary-container disabled:opacity-60 shadow-md transition-all active:scale-[0.98]"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={destroy}
            disabled={busy}
            className="w-full text-error font-medium text-button py-2 hover:underline disabled:opacity-60"
          >
            Delete account
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full text-secondary font-medium text-button py-2 hover:text-on-surface dark:hover:text-dark-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-md" onClick={onClose}>
      <div
        className="bg-surface-container-lowest dark:bg-dark-surface-container w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-outline-variant dark:border-dark-outline-variant"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
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
