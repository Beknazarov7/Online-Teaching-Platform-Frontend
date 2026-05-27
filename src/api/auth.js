import api, { tokens } from './client'

export async function login(username, password) {
  const { data } = await api.post('/auth/login/', { username, password })
  tokens.set(data.access, data.refresh)
  return data
}

export async function register(payload) {
  // Public endpoint — only creates students. Teachers/admins are made via Django Admin.
  const { data } = await api.post('/auth/register/', payload)
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/users/me/')
  return data
}

export async function updateMe(payload) {
  const { data } = await api.patch('/users/me/', payload)
  return data
}

export async function changePassword({ current_password, new_password }) {
  const { data } = await api.post('/users/me/change-password/', { current_password, new_password })
  return data
}

export function logout() {
  tokens.clear()
}
