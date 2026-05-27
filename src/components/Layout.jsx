/**
 * The app shell — fixed 260px sidebar + sticky top bar + main canvas.
 * Pages render in <Outlet />.
 *
 * The nav items list is built from the user's role so a teacher and a
 * student see only the routes that apply to them.
 */
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import { effectiveRole } from '../auth/ProtectedRoute'
import { useTheme } from '../theme/ThemeContext'

const STUDENT_NAV = [
  { to: '/student/dashboard', icon: 'dashboard',      label: 'Dashboard' },
  { to: '/student/calendar',  icon: 'calendar_month', label: 'Schedule'  },
  { to: '/student/lessons',   icon: 'menu_book',      label: 'My Lessons' },
  { to: '/student/profile',   icon: 'person',         label: 'Profile'   },
]
const TEACHER_NAV = [
  { to: '/teacher/dashboard', icon: 'dashboard',      label: 'Dashboard' },
  { to: '/teacher/slots',     icon: 'event_available', label: 'My Slots' },
  { to: '/teacher/requests',  icon: 'inbox',          label: 'Requests'  },
  { to: '/teacher/lessons',   icon: 'menu_book',      label: 'Lessons'   },
  { to: '/teacher/profile',   icon: 'person',         label: 'Profile'   },
]
const ADMIN_NAV = [
  { to: '/admin/dashboard',   icon: 'dashboard',       label: 'Dashboard'   },
  { to: '/admin/schedule',    icon: 'calendar_month',  label: 'Schedule'    },
  { to: '/admin/management',  icon: 'group',           label: 'Management'  },
  { to: '/admin/progress',    icon: 'analytics',       label: 'Progress'    },
  { to: '/admin/settings',    icon: 'settings',        label: 'Settings'    },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const eff = effectiveRole(user)
  const items =
    eff === 'admin'   ? ADMIN_NAV   :
    eff === 'teacher' ? TEACHER_NAV :
    STUDENT_NAV
  const consoleLabel =
    eff === 'admin'   ? 'Admin'   :
    eff === 'teacher' ? 'Teacher' :
    'Student'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="bg-background dark:bg-dark-background text-on-background dark:text-dark-on-background min-h-screen flex">
      {/* ---------- SIDEBAR ---------- */}
      <aside className="fixed left-0 top-0 h-screen w-[260px] bg-surface-container-lowest dark:bg-dark-surface-container border-r border-outline-variant dark:border-dark-outline-variant shadow-sm flex flex-col p-4 gap-2 z-50">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <Icon name="school" />
          </div>
          <div>
            <h1 className="text-lg font-black text-primary dark:text-primary-fixed-dim leading-tight">
              Learning Portal
            </h1>
            <p className="text-xs text-secondary font-medium uppercase tracking-wider">
              {consoleLabel} Console
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim border-r-4 border-primary font-semibold'
                    : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low'
                }`
              }
            >
              <Icon name={it.icon} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-outline-variant dark:border-dark-outline-variant space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low transition-all text-sm font-medium"
          >
            <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-error hover:bg-error-container/30 transition-all text-sm font-medium"
          >
            <Icon name="logout" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ---------- MAIN CANVAS ---------- */}
      <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="sticky top-0 z-40 flex justify-between items-center w-full px-6 h-16 bg-surface-container-lowest/80 dark:bg-dark-surface-container/80 backdrop-blur-md border-b border-outline-variant dark:border-dark-outline-variant">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-primary dark:text-primary-fixed-dim">
              Learning Portal
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-dark-surface-container-low transition-colors text-secondary relative">
              <Icon name="notifications" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant dark:border-dark-outline-variant">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary grid place-items-center font-bold text-sm">
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-medium text-on-surface dark:text-dark-on-surface">
                {user?.username}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-lg max-w-container-max mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
