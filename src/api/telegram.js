import api from './client'

export const generateLinkCode = ()  => api.post('/me/telegram/link/').then(r => r.data)
export const unlinkTelegram   = ()  => api.delete('/me/telegram/link/')
