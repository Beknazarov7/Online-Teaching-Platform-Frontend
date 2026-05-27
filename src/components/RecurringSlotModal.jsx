/**
 * Recurring slots modal — pick weekdays + a time window + a date range,
 * preview the count, submit. The modal expands the recurrence into a
 * flat list of {start_time, end_time} pairs in the user's local timezone
 * and POSTs them to /api/teacher/slots/bulk/.
 *
 * The backend silently skips slots that collide with existing ones, so
 * a teacher who runs "every Monday 10-11 next 4 weeks" twice doesn't
 * get an error — the second run just creates 0 and skips 4.
 */
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Icon from './Icon'
import * as lessonsApi from '../api/lessons'

const DAYS = [
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' },
  { idx: 0, label: 'Sun' },
]

function todayISO() {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}
function plusWeeksISO(weeks) {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

export default function RecurringSlotModal({ onClose, onCreated }) {
  const [weekdays, setWeekdays]   = useState(new Set([1, 3])) // Mon, Wed
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime]     = useState('11:00')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate]     = useState(plusWeeksISO(4))
  const [busy, setBusy]           = useState(false)

  // Compute the expanded slot list. Memoised so the preview count is cheap.
  const slots = useMemo(() => {
    if (!startDate || !endDate || !startTime || !endTime) return []
    if (weekdays.size === 0) return []
    if (endTime <= startTime) return []
    if (endDate < startDate) return []

    const out = []
    const cursor = new Date(`${startDate}T00:00:00`)
    const stop   = new Date(`${endDate}T23:59:59`)
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const now = new Date()

    while (cursor <= stop) {
      if (weekdays.has(cursor.getDay())) {
        const start = new Date(cursor); start.setHours(sh, sm, 0, 0)
        const end   = new Date(cursor); end.setHours(eh, em, 0, 0)
        // Skip slots that are already in the past (e.g. earlier today).
        if (start > now) {
          out.push({
            start_time: start.toISOString(),
            end_time:   end.toISOString(),
          })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    return out
  }, [weekdays, startTime, endTime, startDate, endDate])

  function toggleDay(idx) {
    const next = new Set(weekdays)
    next.has(idx) ? next.delete(idx) : next.add(idx)
    setWeekdays(next)
  }

  async function submit(e) {
    e.preventDefault()
    if (slots.length === 0) {
      toast.error('Nothing to create — check your settings.')
      return
    }
    setBusy(true)
    try {
      const res = await lessonsApi.createSlotsBulk(slots)
      const made    = res.created.length
      const skipped = res.skipped
      toast.success(
        skipped > 0
          ? `Created ${made} slot${made === 1 ? '' : 's'} (skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}).`
          : `Created ${made} slot${made === 1 ? '' : 's'}.`,
      )
      await onCreated()
    } catch (err) {
      const data = err.response?.data
      const msg = data?.detail || (typeof data === 'string' ? data : null) || 'Could not create slots.'
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-md" onClick={onClose}>
      <div
        className="bg-surface-container-lowest dark:bg-dark-surface-container w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-outline-variant dark:border-dark-outline-variant max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit}>
          <div className="p-lg border-b border-outline-variant dark:border-dark-outline-variant flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex items-center justify-center">
              <Icon name="event_repeat" className="text-[24px]" />
            </div>
            <div>
              <h3 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">Recurring slots</h3>
              <p className="text-body-sm text-secondary mt-0.5">e.g. every Mon/Wed 10:00–11:00 for the next 4 weeks.</p>
            </div>
          </div>

          <div className="p-lg space-y-md">
            {/* Days of week */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-2">
                Days of the week
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => {
                  const active = weekdays.has(d.idx)
                  return (
                    <button
                      type="button"
                      key={d.idx}
                      onClick={() => toggleDay(d.idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                        active
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container-low dark:bg-dark-surface-container-low text-on-surface-variant dark:text-dark-on-surface-variant border-outline-variant dark:border-dark-outline-variant hover:border-primary'
                      }`}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time window */}
            <div className="grid grid-cols-2 gap-md">
              <Field label="Start time">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="End time">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-md">
              <Field label="From">
                <input
                  type="date"
                  value={startDate}
                  min={todayISO()}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Until">
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Quick-pick weeks */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-secondary self-center mr-1">Quick:</span>
              {[2, 4, 8, 12].map((w) => (
                <button
                  type="button"
                  key={w}
                  onClick={() => { setStartDate(todayISO()); setEndDate(plusWeeksISO(w)) }}
                  className="text-xs font-medium px-3 py-1 rounded-full border border-outline-variant dark:border-dark-outline-variant hover:border-primary hover:text-primary dark:hover:text-primary-fixed-dim transition-colors"
                >
                  {w} weeks
                </button>
              ))}
            </div>

            {/* Live preview */}
            <div className="bg-primary/5 border border-primary/20 p-md rounded-xl flex gap-3 text-sm leading-relaxed">
              <Icon name="info" className="text-primary mt-0.5" />
              <div className="text-on-surface dark:text-dark-on-surface">
                {slots.length === 0 ? (
                  <p className="text-secondary">Pick at least one weekday and a valid time/date range.</p>
                ) : (
                  <p>
                    This will create <span className="font-bold text-primary dark:text-primary-fixed-dim">{slots.length}</span>{' '}
                    slot{slots.length === 1 ? '' : 's'} between{' '}
                    <span className="font-medium">{startDate}</span> and{' '}
                    <span className="font-medium">{endDate}</span>. Existing duplicates are skipped automatically.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-lg bg-surface-container-low dark:bg-dark-surface-container-low flex flex-col gap-2">
            <button
              type="submit"
              disabled={busy || slots.length === 0}
              className="w-full bg-primary text-on-primary font-medium text-button py-3 rounded-xl hover:bg-primary-container disabled:opacity-60 shadow-md transition-all active:scale-[0.98]"
            >
              {busy ? 'Creating…' : `Create ${slots.length || ''} slot${slots.length === 1 ? '' : 's'}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="w-full text-secondary font-medium text-button py-2 hover:text-on-surface dark:hover:text-dark-on-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">{label}</label>
      {children}
    </div>
  )
}
