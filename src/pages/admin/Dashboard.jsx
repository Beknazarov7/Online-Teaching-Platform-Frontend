/**
 * Admin Dashboard — three stat cards, user management table with role tab,
 * activity log sidebar, and a "Create account" CTA that opens a modal.
 *
 * Layout closely follows the design mockup. Edit/delete user flows are
 * inline modals rather than separate routes — keeps the surface small.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import * as adminApi from '../../api/admin'
import { formatDistanceToNow, parseISO } from 'date-fns'

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [activity, setActivity] = useState([])
  const [users, setUsers]     = useState([])
  const [tab, setTab]         = useState('student')
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing]   = useState(null) // user object

  async function reload() {
    setLoading(true)
    try {
      const [s, a, u] = await Promise.all([
        adminApi.fetchStats(),
        adminApi.fetchActivity(8),
        adminApi.listUsers({ role: tab }),
      ])
      setStats(s); setActivity(a); setUsers(u)
    } catch {
      toast.error('Failed to load admin data.')
    } finally {
      setLoading(false)
    }
  }

  // Reload users when the tab toggles. Stats/activity stay cached across tab flips.
  useEffect(() => {
    adminApi.listUsers({ role: tab })
      .then(setUsers)
      .catch(() => toast.error('Failed to load users.'))
  }, [tab])

  useEffect(() => { reload() /* eslint-disable-next-line */ }, [])

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md">
        <div>
          <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Admin panel</h1>
          <p className="text-body-sm text-secondary mt-1">
            Overview of platform metrics and user management.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-on-primary font-medium text-button px-5 py-3 rounded-lg shadow-md hover:brightness-110 active:scale-[0.98] transition-all inline-flex items-center gap-2 self-start md:self-auto"
        >
          <Icon name="person_add" className="text-[20px]" />
          Create account
        </button>
      </div>

      {/* Stat bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <StatCard
          icon="school"
          tint="primary"
          label="Total students"
          value={stats?.students.value ?? '—'}
          delta={stats ? `${stats.students.delta_pct >= 0 ? '+' : ''}${stats.students.delta_pct}%` : ''}
          deltaTone="positive"
        />
        <StatCard
          icon="supervisor_account"
          tint="tertiary"
          label="Total teachers"
          value={stats?.teachers.value ?? '—'}
          delta={stats ? `${stats.teachers.delta_pct >= 0 ? '+' : ''}${stats.teachers.delta_pct}%` : ''}
          deltaTone="info"
        />
        <StatCard
          icon="history_edu"
          tint="secondary"
          label="Lessons completed"
          value={stats?.lessons_completed.value ?? '—'}
          delta={stats ? `+${stats.lessons_completed.this_month} this month` : ''}
          deltaTone="warning"
        />
      </div>

      {/* User mgmt + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
        <Card className="lg:col-span-2 overflow-hidden p-0">
          <div className="p-md flex items-center justify-between border-b border-outline-variant dark:border-dark-outline-variant">
            <h3 className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface">User management</h3>
            <div className="flex gap-1 p-1 rounded-full bg-surface-container-low dark:bg-dark-surface-container-low">
              <TabBtn active={tab === 'student'} onClick={() => setTab('student')}>Students</TabBtn>
              <TabBtn active={tab === 'teacher'} onClick={() => setTab('teacher')}>Teachers</TabBtn>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low dark:bg-dark-surface-container-low text-secondary text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-md py-sm">User</th>
                  <th className="px-md py-sm">Role</th>
                  <th className="px-md py-sm">Status</th>
                  <th className="px-md py-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant dark:divide-dark-outline-variant">
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-md py-xl text-center text-secondary">No {tab}s yet.</td></tr>
                ) : users.slice(0, 6).map((u) => (
                  <UserRow key={u.id} user={u} onEdit={() => setEditing(u)} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-surface-container-low dark:bg-dark-surface-container-low border-t border-outline-variant dark:border-dark-outline-variant flex justify-center">
            <Link to="/admin/management" className="text-xs font-semibold text-secondary hover:text-primary transition-colors">
              Show all users
            </Link>
          </div>
        </Card>

        <Card className="p-lg">
          <h3 className="text-h3 font-h3 mb-md text-on-surface dark:text-dark-on-surface">Recent activity</h3>
          {loading ? (
            <p className="text-secondary text-sm">Loading…</p>
          ) : activity.length === 0 ? (
            <p className="text-secondary text-sm">Nothing yet.</p>
          ) : (
            <div className="space-y-md">
              {activity.map((a, i) => <ActivityItem key={i} item={a} />)}
            </div>
          )}
        </Card>
      </div>

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={async () => { setCreating(false); await reload() }}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await reload() }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------- //

function StatCard({ icon, tint, label, value, delta, deltaTone }) {
  const tintClasses = {
    primary:   'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim',
    tertiary:  'bg-tertiary/10 text-tertiary',
    secondary: 'bg-secondary-container text-on-secondary-container',
  }[tint]
  const deltaClasses = {
    positive: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    info:     'bg-primary/10 text-primary dark:text-primary-fixed-dim',
    warning:  'bg-tertiary/10 text-tertiary',
  }[deltaTone] ?? 'bg-secondary-container text-on-secondary-container'
  return (
    <Card className="p-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-md">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tintClasses}`}>
          <Icon name={icon} className="text-[28px]" />
        </div>
        {delta && (
          <span className={`text-[11px] font-bold px-2 py-1 rounded ${deltaClasses}`}>{delta}</span>
        )}
      </div>
      <p className="text-xs text-secondary uppercase tracking-wider font-bold mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-on-surface dark:text-dark-on-surface">{value}</h3>
    </Card>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
        active
          ? 'bg-surface-container-lowest dark:bg-dark-surface-container text-on-surface dark:text-dark-on-surface shadow-sm'
          : 'text-secondary hover:text-on-surface dark:hover:text-dark-on-surface'
      }`}
    >
      {children}
    </button>
  )
}

function UserRow({ user, onEdit }) {
  // "Online" if logged in within the last 15 minutes — best proxy we have
  // without explicit presence tracking.
  const lastSeen = user.last_login ? new Date(user.last_login) : null
  const online = lastSeen && (Date.now() - lastSeen.getTime() < 15 * 60 * 1000)

  return (
    <tr className="hover:bg-primary/5 transition-colors">
      <td className="px-md py-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim grid place-items-center font-bold text-sm">
            {user.username[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-on-surface dark:text-dark-on-surface truncate">{user.username}</div>
            <div className="text-xs text-secondary truncate">{user.email || '—'}</div>
          </div>
        </div>
      </td>
      <td className="px-md py-sm">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-md py-sm">
        <div className="flex items-center gap-2">
          {!user.is_active ? (
            <>
              <div className="w-2 h-2 rounded-full bg-error" />
              <span className="text-xs text-error">Disabled</span>
            </>
          ) : online ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant">Active</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-secondary-fixed-dim" />
              <span className="text-xs text-secondary">Offline</span>
            </>
          )}
        </div>
      </td>
      <td className="px-md py-sm text-right">
        <button
          onClick={onEdit}
          className="text-primary dark:text-primary-fixed-dim hover:underline font-medium text-sm"
        >
          Edit
        </button>
      </td>
    </tr>
  )
}

function RoleBadge({ role }) {
  const map = {
    student: 'bg-primary/10 text-primary dark:text-primary-fixed-dim',
    teacher: 'bg-tertiary/10 text-tertiary',
    admin:   'bg-secondary-container text-on-secondary-container',
  }
  return (
    <span className={`text-[11px] font-medium px-2 py-1 rounded uppercase tracking-wide ${map[role] || ''}`}>
      {role}
    </span>
  )
}

function ActivityItem({ item }) {
  const meta = ICONS[item.kind] || ICONS.default
  let when = ''
  try { when = formatDistanceToNow(parseISO(item.at), { addSuffix: true }) } catch { /* ignore */ }
  return (
    <div className="flex gap-3">
      <div className={`mt-1 w-8 h-8 rounded-full grid place-items-center shrink-0 ${meta.classes}`}>
        <Icon name={meta.icon} className="text-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-on-surface dark:text-dark-on-surface">{item.title}</p>
        <p className="text-xs text-secondary truncate">{item.subtitle}</p>
        <span className="text-[10px] text-secondary uppercase tracking-tight">{when}</span>
      </div>
    </div>
  )
}

const ICONS = {
  registration:     { icon: 'person_add',  classes: 'bg-primary/10 text-primary dark:text-primary-fixed-dim' },
  lesson_completed: { icon: 'check_circle', classes: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  review:           { icon: 'star',        classes: 'bg-tertiary/10 text-tertiary' },
  lesson_cancelled: { icon: 'cancel',      classes: 'bg-error/10 text-error' },
  default:          { icon: 'info',        classes: 'bg-secondary-container text-on-secondary-container' },
}

// ---------- Modals ---------- //

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

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm]   = useState({ username: '', email: '', password: '', role: 'student' })
  const [busy, setBusy]   = useState(false)

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

function EditUserModal({ user, onClose, onSaved }) {
  const [role, setRole]         = useState(user.role)
  const [isActive, setActive]   = useState(user.is_active)
  const [busy, setBusy]         = useState(false)

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

const inputCls =
  'w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">{label}</label>
      {children}
    </div>
  )
}
