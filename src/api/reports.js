import api from './client'

export const listReports = ()         => api.get('/reports/').then(r => r.data)
export const createReport = (payload) => api.post('/reports/', payload).then(r => r.data)

export const listReviews = ()         => api.get('/reviews/').then(r => r.data)
export const createReview = (payload) => api.post('/reviews/', payload).then(r => r.data)
