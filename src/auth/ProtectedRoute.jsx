import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * Returns the user's *effective* role for routing. Django superusers
 * count as admins even when their model `role` field is something else,
 * which matches the backend's IsAdminRole permission.
 */
export function effectiveRole(user) {
  if (!user) return null
  if (user.is_superuser || user.role === 'admin') return 'admin'
  return user.role
}

/**
 * Wraps any route that requires the user to be logged in.
 * If a `role` prop is given, also enforces that user's effective role matches.
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-secondary">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const eff = effectiveRole(user)
  if (role && eff !== role) {
    const homes = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      admin:   '/admin/dashboard',
    }
    return <Navigate to={homes[eff] || '/login'} replace />
  }

  return children
}
