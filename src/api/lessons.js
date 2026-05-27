import api from './client'

// Slots
export const listOpenSlots    = (teacherId) =>
  api.get('/slots/', { params: teacherId ? { teacher: teacherId } : {} }).then(r => r.data)

export const listMySlots      = ()         => api.get('/teacher/slots/').then(r => r.data)
export const createSlot       = (payload)  => api.post('/teacher/slots/', payload).then(r => r.data)
export const createSlotsBulk  = (slots)    => api.post('/teacher/slots/bulk/', { slots }).then(r => r.data)
export const updateSlot       = (id, p)    => api.patch(`/teacher/slots/${id}/`, p).then(r => r.data)
export const deleteSlot       = (id)       => api.delete(`/teacher/slots/${id}/`)

// Lessons
export const listMyLessons    = ()         => api.get('/lessons/').then(r => r.data)
export const bookLesson       = (slotId)   => api.post('/lessons/', { slot: slotId }).then(r => r.data)
export const confirmLesson    = (id)       => api.post(`/lessons/${id}/confirm/`).then(r => r.data)
export const declineLesson    = (id)       => api.post(`/lessons/${id}/decline/`).then(r => r.data)
export const cancelLesson     = (id)       => api.post(`/lessons/${id}/cancel/`).then(r => r.data)
