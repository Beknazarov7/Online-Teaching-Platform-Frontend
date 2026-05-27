/**
 * Teacher Pending Requests inbox.
 *
 * Shows lessons in PENDING status with confirm/decline buttons.
 * Confirming queues the reminder Celery tasks (server side).
 * Declining frees the slot back up.
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import * as lessonsApi from '../../api/lessons'
import { fmtFull } from '../../utils/date'

export default function TeacherRequests() {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId]   = useState(null)

  async function reload() {
    setLoading(true)
    try {
      const all = await lessonsApi.listMyLessons()
      setLessons(all.filter((l) => l.status === 'pending'))
    } catch {
      toast.error('Failed to load requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  async function act(id, fn, label) {
    setBusyId(id)
    try {
      await fn(id)
      toast.success(label)
      await reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Pending requests</h1>
        <p className="text-body-sm text-secondary mt-1">
          Confirm or decline new bookings. Confirming triggers a reminder for the student.
        </p>
      </div>

      <Card className="p-md">
        {loading ? (
          <p className="text-secondary text-center py-xl">Loading…</p>
        ) : lessons.length === 0 ? (
          <div className="text-center py-xl">
            <Icon name="inbox" className="text-5xl text-secondary mb-2" />
            <p className="text-secondary">No pending requests right now.</p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant dark:divide-dark-outline-variant">
            {lessons.map((l) => {
              const busy = busyId === l.id
              return (
                <li key={l.id} className="py-3 flex items-center gap-3 flex-wrap">
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary grid place-items-center font-bold text-lg flex-shrink-0">
                    {l.student_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface dark:text-dark-on-surface truncate">{l.student_name}</p>
                    <p className="text-xs text-secondary">{fmtFull(l.scheduled_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={busy}
                      onClick={() => act(l.id, lessonsApi.declineLesson, 'Declined.')}
                      className="px-3 py-1.5 rounded-lg text-error text-sm font-medium border border-error/30 hover:bg-error/10 disabled:opacity-60 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act(l.id, lessonsApi.confirmLesson, 'Lesson confirmed.')}
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-container disabled:opacity-60 transition-colors active:scale-[0.98]"
                    >
                      Confirm
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
