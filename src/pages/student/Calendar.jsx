/**
 * Student "Schedule" page — browse open slots, book one.
 *
 * Layout (matches the Stitch booking design):
 *   - Left (8/12 cols): list of available slots, grouped by day
 *   - Right (4/12 cols): "My lessons" + gamification widget
 *   - Click a slot -> confirmation modal with the 6h-rule warning
 */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import { useAuth } from '../../auth/AuthContext'
import * as lessonsApi from '../../api/lessons'
import { fmtDate, fmtDay, fmtTime, fmtFull } from '../../utils/date'

export default function Calendar() {
  const { user, refresh } = useAuth()
  const [slots, setSlots]       = useState([])
  const [lessons, setLessons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [pickedSlot, setPicked] = useState(null)
  const [booking, setBooking]   = useState(false)

  async function reload() {
    setLoading(true)
    try {
      const [s, l] = await Promise.all([lessonsApi.listOpenSlots(), lessonsApi.listMyLessons()])
      setSlots(s)
      setLessons(l)
    } catch {
      toast.error('Failed to load schedule.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  // Group open slots by day (yyyy-mm-dd) for the column layout.
  const slotsByDay = useMemo(() => {
    const out = {}
    for (const s of slots) {
      const key = s.start_time.slice(0, 10)
      ;(out[key] ||= []).push(s)
    }
    return out
  }, [slots])

  async function confirmBooking() {
    if (!pickedSlot) return
    setBooking(true)
    try {
      await lessonsApi.bookLesson(pickedSlot.id)
      toast.success('Lesson booked! Waiting for teacher confirmation.')
      setPicked(null)
      await Promise.all([reload(), refresh()])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking failed.')
    } finally {
      setBooking(false)
    }
  }

  const profile = user?.student_profile
  const total   = profile?.total_lessons ?? 0
  const goal    = 10
  const pct     = Math.min(100, Math.round((total / goal) * 100))

  return (
    <div className="grid grid-cols-12 gap-gutter">
      {/* ----------------- LEFT: open slots ----------------- */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
        <div>
          <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Book a lesson</h1>
          <p className="text-body-sm text-secondary mt-1">Browse open slots and pick a time that suits you.</p>
        </div>

        <Card className="p-md">
          {loading ? (
            <p className="text-secondary text-center py-xl">Loading slots…</p>
          ) : slots.length === 0 ? (
            <div className="text-center py-xl">
              <Icon name="event_busy" className="text-5xl text-secondary mb-2" />
              <p className="text-secondary">No open slots right now. Check back later.</p>
            </div>
          ) : (
            <div className="space-y-lg">
              {Object.entries(slotsByDay).map(([day, daySlots]) => (
                <div key={day}>
                  <div className="flex items-center gap-md mb-md">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold uppercase">{fmtDay(daySlots[0].start_time)}</span>
                      <span className="text-lg font-black leading-none">{fmtDate(daySlots[0].start_time).split(' ')[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface dark:text-dark-on-surface">{fmtDate(daySlots[0].start_time)}</p>
                      <p className="text-xs text-secondary">{daySlots.length} open slot{daySlots.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-sm">
                    {daySlots.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setPicked(s)}
                        className="p-sm rounded-lg bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-fixed-dim hover:bg-primary/10 dark:hover:bg-primary/20 border border-primary/20 transition-all text-left"
                      >
                        <div className="font-bold">{fmtTime(s.start_time)}</div>
                        <div className="text-xs text-secondary truncate">{s.teacher_name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ----------------- RIGHT: my lessons + stats ----------------- */}
      <aside className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
        <Card className="p-md">
          <h2 className="text-h3 font-h3 mb-md text-on-surface dark:text-dark-on-surface">My lessons</h2>
          {lessons.length === 0 ? (
            <p className="text-secondary text-sm">No lessons yet. Pick a slot to get started.</p>
          ) : (
            <div className="space-y-2">
              {lessons.slice(0, 5).map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant dark:border-dark-outline-variant hover:bg-primary/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase leading-none">{fmtDay(l.scheduled_at).slice(0, 3)}</span>
                    <span className="text-lg font-black leading-none">{fmtDate(l.scheduled_at).split(' ')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface dark:text-dark-on-surface truncate">{l.teacher_name}</p>
                    <p className="text-xs text-secondary">{fmtTime(l.scheduled_at)}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Gamification widget */}
        <div className="bg-primary rounded-xl p-lg text-on-primary shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-primary-fixed-dim text-xs font-bold uppercase tracking-widest mb-1">Your progress</p>
            <h3 className="text-h2 font-h2 mb-md">{total}/{goal} lessons</h3>
            <div className="w-full bg-primary-container/60 h-2 rounded-full mb-md overflow-hidden">
              <div
                className="bg-on-primary h-full rounded-full transition-all"
                style={{ width: `${pct}%`, boxShadow: '0 0 8px rgba(255,255,255,0.5)' }}
              />
            </div>
            <p className="text-sm text-primary-fixed-dim">
              Rank: <span className="font-bold text-on-primary">{profile?.rank ?? 'Starter'}</span> · Streak: <span className="font-bold text-on-primary">{profile?.streak ?? 0}</span>
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Icon name="school" className="text-[120px]" />
          </div>
        </div>
      </aside>

      {/* ----------------- BOOKING MODAL ----------------- */}
      {pickedSlot && (
        <BookingModal
          slot={pickedSlot}
          submitting={booking}
          onConfirm={confirmBooking}
          onCancel={() => setPicked(null)}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending:   'bg-primary/10 text-primary',
    confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    completed: 'bg-secondary-container text-on-secondary-container',
    cancelled: 'bg-error-container text-on-error-container',
    declined:  'bg-error-container text-on-error-container',
  }[status] || 'bg-secondary-container text-secondary'
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  )
}

function BookingModal({ slot, submitting, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest dark:bg-dark-surface-container w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-outline-variant dark:border-dark-outline-variant">
        <div className="p-lg text-center border-b border-outline-variant dark:border-dark-outline-variant">
          <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim rounded-full flex items-center justify-center mx-auto mb-md">
            <Icon name="event_available" className="text-3xl" />
          </div>
          <h3 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">Confirm booking</h3>
          <p className="text-body-sm text-secondary mt-1">with {slot.teacher_name}</p>
        </div>

        <div className="p-lg space-y-md">
          <div className="flex justify-between items-center py-2 border-b border-outline-variant dark:border-dark-outline-variant">
            <span className="text-sm text-secondary font-medium">Date & time</span>
            <span className="text-sm font-bold text-on-surface dark:text-dark-on-surface">{fmtFull(slot.start_time)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-outline-variant dark:border-dark-outline-variant">
            <span className="text-sm text-secondary font-medium">Duration</span>
            <span className="text-sm font-bold text-on-surface dark:text-dark-on-surface">60 min</span>
          </div>

          <div className="bg-error-container/40 dark:bg-error/20 p-md rounded-xl border border-error-container flex gap-3">
            <Icon name="info" className="text-error" />
            <div className="text-xs leading-relaxed text-on-error-container dark:text-error-container">
              <p className="font-bold mb-1">Cancellation policy</p>
              <p>Free cancellation or rescheduling is available up to <span className="font-bold underline">6 hours</span> before the lesson. Cancellations after that count as a completed lesson.</p>
            </div>
          </div>
        </div>

        <div className="p-lg bg-surface-container-low dark:bg-dark-surface-container-low flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="w-full bg-primary text-on-primary font-medium text-button py-3 rounded-xl hover:bg-primary-container disabled:opacity-60 shadow-md transition-all active:scale-[0.98]"
          >
            {submitting ? 'Booking…' : 'Confirm and book'}
          </button>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="w-full bg-transparent text-secondary font-medium text-button py-2 hover:text-on-surface dark:hover:text-dark-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
