import api from './client'

export const fetchStats     = ()                  => api.get('/admin/stats/').then(r => r.data)
export const fetchActivity  = (limit = 20)        => api.get('/admin/activity/', { params: { limit } }).then(r => r.data)

export const listUsers      = ({ role, q } = {})  => api.get('/admin/users/', { params: { role, q } }).then(r => r.data)
export const createUser     = (payload)           => api.post('/admin/users/', payload).then(r => r.data)
export const updateUser     = (id, payload)       => api.patch(`/admin/users/${id}/`, payload).then(r => r.data)
export const deleteUser     = (id)                => api.delete(`/admin/users/${id}/`)

export const listLessons    = (params = {})       => api.get('/admin/lessons/', { params }).then(r => r.data)
