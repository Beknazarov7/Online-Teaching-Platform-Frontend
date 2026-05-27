/**
 * Teacher "My Slots" page — list/create/delete availability.
 *
 * Uses the styled CalendarPicker (popup) instead of native datetime-local
 * inputs so the form looks consistent across browsers and matches the
 * Stitch design.
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import CalendarPicker from '../../components/CalendarPicker'
import RecurringSlotModal from '../../components/RecurringSlotModal'
import * as lessonsApi from '../../api/lessons'
import { fmtDate, fmtDay, fmtTime, fmtFull } from '../../utils/date'

export default function TeacherSlots() {
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // JS Date objects (or null) — converted to ISO at submit time.
  const [start, setStart] = useState(null)
  const [end, setEnd]     = useState(null)
  const [showRecurring, setShowRecurring] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      setSlots(await lessonsApi.listMySlots())
    } catch {
      toast.error('Failed to load slots.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  async function onCreate(e) {
    e.preventDefault()
    if (!start || !end) {
      toast.error('Pick a start and end time.')
      return
    }
    if (end <= start) {
      toast.error('End time must be after start time.')
      return
    }
    setCreating(true)
    try {
      await lessonsApi.createSlot({
        start_time: start.toISOString(),
        end_time:   end.toISOString(),
      })
      toast.success('Slot created.')
      setStart(null); setEnd(null)
      await reload()
    } catch (err) {
      const data = err.response?.data
      const msg =
        data?.non_field_errors?.[0] ||
        (typeof data === 'string' ? data : null) ||
        Object.values(data || {})[0] ||
        'Could not create slot.'
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setCreating(false)
    }
  }

  async function onDelete(slot) {
    if (slot.is_booked) {
      toast.error('Cannot delete a slot that has been booked.')
      return
    }
    if (!confirm(`Delete slot at ${fmtFull(slot.start_time)}?`)) return
    try {
      await lessonsApi.deleteSlot(slot.id)
      toast.success('Slot deleted.')
      await reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed.')
    }
  }

  // Group by day for display.
  const groups = slots.reduce((acc, s) => {
    const k = s.start_time.slice(0, 10)
    ;(acc[k] ||= []).push(s)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">My slots</h1>
        <p className="text-body-sm text-secondary mt-1">Mark the times you're available for new students.</p>
      </div>

      {/* New slot form */}
      <Card className="p-lg">
        <div className="flex flex-wrap items-center justify-between gap-md mb-md">
          <h2 className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface flex items-center gap-2">
            <Icon name="add_circle" className="text-primary" /> Add a new slot
          </h2>
          <button
            type="button"
            onClick={() => setShowRecurring(true)}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border border-primary/30 text-primary dark:text-primary-fixed-dim hover:bg-primary/5 transition-colors inline-flex items-center gap-2"
          >
            <Icon name="event_repeat" className="text-[18px]" />
            Recurring…
          </button>
        </div>
        <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-3 gap-md items-end">
          <CalendarPicker
            label="Start"
            value={start}
            onChange={setStart}
            minDate={new Date()}
            placeholder="Pick start"
          />
          <CalendarPicker
            label="End"
            value={end}
            onChange={setEnd}
            minDate={start || new Date()}
            placeholder="Pick end"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-on-primary font-medium text-button py-2.5 rounded-lg hover:bg-primary-container disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {creating ? 'Creating…' : 'Create slot'}
          </button>
        </form>
      </Card>

      {/* Existing slots */}
      <Card className="p-lg">
        <h2 className="text-h3 font-h3 mb-md text-on-surface dark:text-dark-on-surface">Your schedule</h2>
        {loading ? (
          <p className="text-secondary text-center py-xl">Loading…</p>
        ) : slots.length === 0 ? (
          <div className="text-center py-xl">
            <Icon name="event_busy" className="text-5xl text-secondary mb-2" />
            <p className="text-secondary">No slots yet — add some above to start receiving bookings.</p>
          </div>
        ) : (
          <div className="space-y-lg">
            {Object.entries(groups).map(([day, daySlots]) => (
              <div key={day}>
                <div className="flex items-center gap-md mb-md">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase">{fmtDay(daySlots[0].start_time)}</span>
                    <span className="text-lg font-black leading-none">{fmtDate(daySlots[0].start_time).split(' ')[0]}</span>
                  </div>
                  <p className="font-semibold text-on-surface dark:text-dark-on-surface">{fmtDate(daySlots[0].start_time)}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-sm">
                  {daySlots.map((s) => (
                    <div
                      key={s.id}
                      className={`relative p-md border rounded-xl transition-all ${
                        s.is_booked
                          ? 'border-secondary-fixed-dim bg-secondary-container/40 dark:bg-dark-surface-container-high text-secondary'
                          : 'border-primary/20 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-fixed-dim'
                      }`}
                    >
                      <div className="text-h3 font-bold">{fmtTime(s.start_time)}</div>
                      <div className="text-[11px] uppercase font-semibold tracking-wider">
                        {s.is_booked ? 'Booked' : 'Open'}
                      </div>
                      {!s.is_booked && (
                        <button
                          onClick={() => onDelete(s)}
                          className="absolute top-1 right-1 p-1 rounded hover:bg-error/10 text-error"
                          aria-label="Delete slot"
                        >
                          <Icon name="close" className="text-[18px]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showRecurring && (
        <RecurringSlotModal
          onClose={() => setShowRecurring(false)}
          onCreated={async () => { setShowRecurring(false); await reload() }}
        />
      )}
    </div>
  )
}
