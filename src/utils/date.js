/**
 * Date helpers — backend stores everything in UTC, the UI displays local time.
 */
import { format, parseISO } from 'date-fns'

export const fmtTime  = (iso) => format(parseISO(iso), 'HH:mm')
export const fmtDate  = (iso) => format(parseISO(iso), 'd MMM')
export const fmtDay   = (iso) => format(parseISO(iso), 'EEE')   // Mon, Tue
export const fmtFull  = (iso) => format(parseISO(iso), 'd MMM yyyy, HH:mm')

export const isoFromLocal = (localStr) => new Date(localStr).toISOString()
