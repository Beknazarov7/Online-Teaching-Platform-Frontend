/**
 * Admin · Management — full user table with search, role/status filters,
 * and inline create/edit/delete via shared modals.
 */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import { CreateUserModal, EditUserModal } from '../../components/admin/UserModals'
import * as adminApi from '../../api/admin'

const ROLE_TABS = [
  { key: 'all',     label: 'All'      },
  { key: 'student', label: 'Students' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'admin',   label: 'Admins'   },
]

export default function AdminManagement() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole]       = useState('all')
  const [status, setStatus]   = useState('all') // all | active | disabled
  const [query, setQuery]     = useState('')
  const [debounced, setDebounced] = useState('')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing]   = useState(null)

  // Debounce search input so we don't hammer the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (role !== 'all') params.role = role
      if (debounced)      params.q    = debounced
      const data = await adminApi.listUsers(params)
      setUsers(data)
    } catch {
      toast.error('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [role, debounced])

  // Status is filtered client-side — backend doesn't take an is_active param yet.
  const visible = useMemo(() => {
    if (status === 'active')   return users.filter((u) => u.is_active)
    if (status === 'disabled') return users.filter((u) => !u.is_active)
    return users
  }, [users, status])

  const counts = useMemo(() => ({
    total:    users.length,
    active:   users.filter((u) => u.is_active).length,
    disabled: users.filter((u) => !u.is_active).length,
  }), [users])

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md">
        <div>
          <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Management</h1>
          <p className="text-body-sm text-secondary mt-1">
            Search, filter, and manage every account on the platform.
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

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-gutter">
        <SummaryCard icon="group"            tint="primary"   label="Matching users"  value={counts.total} />
        <SummaryCard icon="check_circle"     tint="secondary" label="Active"          value={counts.active} />
        <SummaryCard icon="block"            tint="error"     label="Disabled"        value={counts.disabled} />
      </div>

      {/* Filters + table */}
      <Card className="overflow-hidden p-0">
        <div className="p-md flex flex-col gap-md border-b border-outline-variant dark:border-dark-outline-variant">
          {/* Top row: search + status select */}
          <div className="flex flex-col md:flex-row md:items-center gap-md">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username or email…"
                className="w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none md:w-44"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="disabled">Disabled only</option>
            </select>
          </div>

          {/* Role tabs */}
          <div className="flex gap-1 p-1 rounded-full bg-surface-container-low dark:bg-dark-surface-container-low self-start">
            {ROLE_TABS.map((t) => (
              <TabBtn key={t.key} active={role === t.key} onClick={() => setRole(t.key)}>
                {t.label}
              </TabBtn>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low dark:bg-dark-surface-container-low text-secondary text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-md py-sm">User</th>
                <th className="px-md py-sm">Role</th>
                <th className="px-md py-sm">Status</th>
                <th className="px-md py-sm">Joined</th>
                <th className="px-md py-sm">Last seen</th>
                <th className="px-md py-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant dark:divide-dark-outline-variant">
              {loading ? (
                <tr><td colSpan={6} className="px-md py-xl text-center text-secondary">Loading…</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={6} className="px-md py-xl text-center text-secondary">No users match these filters.</td></tr>
              ) : visible.map((u) => (
                <UserRow key={u.id} user={u} onEdit={() => setEditing(u)} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-surface-container-low dark:bg-dark-surface-container-low border-t border-outline-variant dark:border-dark-outline-variant text-xs text-secondary text-center">
          Showing {visible.length} of {users.length} loaded user{users.length === 1 ? '' : 's'}.
        </div>
      </Card>

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={async () => { setCreating(false); await load() }}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load() }}
        />
      )}
    </div>
  )
}

// ---------- bits ---------- //

function SummaryCard({ icon, tint, label, value }) {
  const tintClasses = {
    primary:   'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim',
    secondary: 'bg-secondary-container text-on-secondary-container',
    error:     'bg-error/10 text-error',
  }[tint] || ''
  return (
    <Card className="p-md flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tintClasses}`}>
        <Icon name={icon} className="text-[22px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-secondary uppercase tracking-wider font-bold truncate">{label}</p>
        <p className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface">{value}</p>
      </div>
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
  // "Online" if logged in within the last 15 minutes — best proxy without
  // explicit presence tracking.
  const lastSeen = user.last_login ? new Date(user.last_login) : null
  const online   = lastSeen && (Date.now() - lastSeen.getTime() < 15 * 60 * 1000)

  let joined = '—'
  try { joined = format(parseISO(user.date_joined), 'd MMM yyyy') } catch { /* ignore */ }

  let seenLabel = 'Never'
  if (user.last_login) {
    try { seenLabel = formatDistanceToNow(parseISO(user.last_login), { addSuffix: true }) } catch { /* ignore */ }
  }

  return (
    <tr className="hover:bg-primary/5 transition-colors">
      <td className="px-md py-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim grid place-items-center font-bold text-sm">
            {user.username[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-on-surface dark:text-dark-on-surface truncate flex items-center gap-1">
              {user.username}
              {user.is_superuser && (
                <span title="Superuser" className="text-tertiary"><Icon name="shield" className="text-[14px]" /></span>
              )}
            </div>
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
      <td className="px-md py-sm text-xs text-secondary whitespace-nowrap">{joined}</td>
      <td className="px-md py-sm text-xs text-secondary whitespace-nowrap">{seenLabel}</td>
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
