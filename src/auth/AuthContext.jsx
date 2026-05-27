/**
 * AuthContext stores the currently logged-in user (or null) and exposes
 * login/logout helpers. On first mount it tries to fetch /users/me/ —
 * if the access token is still valid we restore the session silently;
 * otherwise we clear tokens and show the login page.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'
import { tokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  // `loading` is true only during the very first /me call. After that,
  // child routes can render based on whether `user` is set or not.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokens.access) {
      setLoading(false)
      return
    }
    authApi.fetchMe()
      .then(setUser)
      .catch(() => {
        // Bad/expired token → wipe and stay on login.
        tokens.clear()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(username, password) {
    await authApi.login(username, password)
    const me = await authApi.fetchMe()
    setUser(me)
    return me
  }

  function logout() {
    authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh: () => authApi.fetchMe().then(setUser) }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
