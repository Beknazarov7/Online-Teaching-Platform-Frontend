/**
 * axios instance for the Django API.
 *
 * Two interceptors:
 *   1. Request: attach the access token (read fresh from localStorage every
 *      time, so we never send a stale token after a refresh).
 *   2. Response: on 401, try the /auth/refresh/ endpoint once. If that works,
 *      retry the original request transparently. If it fails, wipe tokens
 *      and force a redirect to /login.
 */
import axios from 'axios'

const api = axios.create({
  // The vite dev server proxies /api -> http://localhost:8000/api,
  // so this works in dev without any CORS gymnastics.
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// --- token helpers ------------------------------------------------------
const ACCESS_KEY = 'access'
const REFRESH_KEY = 'refresh'

export const tokens = {
  get access()  { return localStorage.getItem(ACCESS_KEY) },
  get refresh() { return localStorage.getItem(REFRESH_KEY) },
  set(access, refresh) {
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// --- request interceptor ------------------------------------------------
api.interceptors.request.use((config) => {
  const t = tokens.access
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

// --- response interceptor (refresh-on-401) ------------------------------
let refreshPromise = null  // dedupe concurrent refresh attempts

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config
    const isAuthEndpoint = original?.url?.includes('/auth/')

    // Only try to refresh on a 401 from a non-auth endpoint that we
    // haven't already retried.
    if (
      error.response?.status !== 401 ||
      original._retried ||
      isAuthEndpoint ||
      !tokens.refresh
    ) {
      return Promise.reject(error)
    }

    original._retried = true

    try {
      // Single in-flight refresh promise — if 5 requests fire at once and
      // all 401, only one /refresh/ call goes out.
      refreshPromise ??= axios.post('/api/auth/refresh/', {
        refresh: tokens.refresh,
      }).then((r) => {
        tokens.set(r.data.access)  // refresh stays the same
        return r.data.access
      }).finally(() => { refreshPromise = null })

      const newAccess = await refreshPromise
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch {
      tokens.clear()
      // Hard redirect — easier than juggling React Router from a non-component.
      window.location.href = '/login'
      return Promise.reject(error)
    }
  }
)

export default api
