/**
 * Student Lesson History — full list of lessons with filters and actions:
 *   - Cancel a PENDING / CONFIRMED lesson (warns about the 6h rule).
 *   - Leave a 1–5 star review on a COMPLETED lesson.
 *   - Read the teacher's report for a completed lesson.
 */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import * as lessonsApi from '../../api/lessons'
import * as reportsApi from '../../api/reports'
import { fmtFull, fmtTime, fmtDate, fmtDay } from '../../utils/date'

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function StudentLessons() {
  const [lessons, setLessons] = useState([])
  const [reports, setReports] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [reviewing, setReviewing] = useState(null) // lesson object
  const [cancelling, setCancelling] = useState(null)

  async function reload() {
    setLoading(true)
    try {
      const [l, r, rv] = await Promise.all([
        lessonsApi.listMyLessons(),
        reportsApi.listReports(),
        reportsApi.listReviews(),
      ])
      setLessons(l); setReports(r); setReviews(rv)
    } catch {
      toast.error('Failed to load lessons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const reportByLesson = useMemo(() => {
    const m = {}; for (const r of reports) m[r.lesson] = r; return m
  }, [reports])
  const reviewByLesson = useMemo(() => {
    const m = {}; for (const r of reviews) m[r.lesson] = r; return m
  }, [reviews])

  const filtered = useMemo(() => {
    const now = Date.now()
    if (filter === 'upcoming')  return lessons.filter((l) =>
      ['pending', 'confirmed'].includes(l.status) && new Date(l.scheduled_at).getTime() > now
    )
    if (filter === 'completed') return lessons.filter((l) => l.status === 'completed')
    if (filter === 'cancelled') return lessons.filter((l) => ['cancelled', 'declined'].includes(l.status))
    return lessons
  }, [lessons, filter])

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">My lessons</h1>
        <p className="text-body-sm text-secondary mt-1">Your full lesson history.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-lowest dark:bg-dark-surface-container border border-outline-variant dark:border-dark-outline-variant text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-primary/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-md">
        {loading ? (
          <p className="text-secondary text-center py-xl">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-xl">
            <Icon name="event_busy" className="text-5xl text-secondary mb-2" />
            <p className="text-secondary">Nothing to show.</p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant dark:divide-dark-outline-variant">
            {filtered.map((l) => (
              <LessonRow
                key={l.id}
                lesson={l}
                report={reportByLesson[l.id]}
                review={reviewByLesson[l.id]}
                onCancel={() => setCancelling(l)}
                onReview={() => setReviewing(l)}
              />
            ))}
          </ul>
        )}
      </Card>

      {reviewing && (
        <ReviewModal
          lesson={reviewing}
          onClose={() => setReviewing(null)}
          onSaved={async () => { setReviewing(null); await reload() }}
        />
      )}

      {cancelling && (
        <CancelModal
          lesson={cancelling}
          onClose={() => setCancelling(null)}
          onConfirmed={async () => { setCancelling(null); await reload() }}
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

function Stars({ rating }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          filled={n <= rating}
          className={`text-[18px] ${n <= rating ? 'text-tertiary' : 'text-secondary/40'}`}
        />
      ))}
    </div>
  )
}

function LessonRow({ lesson, report, review, onCancel, onReview }) {
  const upcoming = ['pending', 'confirmed'].includes(lesson.status) &&
    new Date(lesson.scheduled_at).getTime() > Date.now()
  const canReview = lesson.status === 'completed' && !review

  return (
    <li className="py-3 flex items-center gap-3 flex-wrap">
      <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold uppercase leading-none">{fmtDay(lesson.scheduled_at).slice(0, 3)}</span>
        <span className="text-lg font-black leading-none">{fmtDate(lesson.scheduled_at).split(' ')[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface dark:text-dark-on-surface truncate">{lesson.teacher_name}</p>
        <p className="text-xs text-secondary">{fmtFull(lesson.scheduled_at)}</p>
        {report && (
          <p className="text-xs text-secondary mt-1 truncate">
            <Icon name="description" className="text-[14px] align-middle mr-1" />
            <span className="font-medium">{report.topic}:</span> {report.text}
          </p>
        )}
        {review && (
          <div className="mt-1 flex items-center gap-2">
            <Stars rating={review.rating} />
            {review.comment && <span className="text-xs text-secondary truncate">"{review.comment}"</span>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={lesson.status} />
        {upcoming && (
          <button
            onClick={onCancel}
            className="text-xs font-medium text-error hover:underline"
          >
            Cancel
          </button>
        )}
        {canReview && (
          <button
            onClick={onReview}
            className="text-xs font-medium text-primary dark:text-primary-fixed-dim hover:underline"
          >
            Leave review
          </button>
        )}
      </div>
    </li>
  )
}

function CancelModal({ lesson, onClose, onConfirmed }) {
  const [submitting, setSubmitting] = useState(false)
  const hoursAway = (new Date(lesson.scheduled_at).getTime() - Date.now()) / 36e5
  const charged   = hoursAway <= 6

  async function go() {
    setSubmitting(true)
    try {
      await lessonsApi.cancelLesson(lesson.id)
      toast.success(charged ? 'Cancelled (charged).' : 'Cancelled.')
      await onConfirmed()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cancel failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-lg text-center border-b border-outline-variant dark:border-dark-outline-variant">
        <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-md">
          <Icon name="cancel" className="text-3xl" />
        </div>
        <h3 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">Cancel this lesson?</h3>
        <p className="text-body-sm text-secondary mt-1">{fmtFull(lesson.scheduled_at)} with {lesson.teacher_name}</p>
      </div>
      <div className="p-lg">
        <div className={`p-md rounded-xl border flex gap-3 ${
          charged
            ? 'bg-error-container/40 dark:bg-error/20 border-error-container text-on-error-container dark:text-error-container'
            : 'bg-primary/5 border-primary/20 text-on-surface dark:text-dark-on-surface'
        }`}>
          <Icon name={charged ? 'warning' : 'info'} className={charged ? 'text-error' : 'text-primary'} />
          <div className="text-xs leading-relaxed">
            {charged ? (
              <>
                <p className="font-bold mb-1">Less than 6 hours away</p>
                <p>This cancellation will count as a completed lesson.</p>
              </>
            ) : (
              <>
                <p className="font-bold mb-1">Free cancellation</p>
                <p>You're more than 6 hours out — this won't count toward your lessons, but it will reset your streak.</p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="p-lg bg-surface-container-low dark:bg-dark-surface-container-low flex flex-col gap-2">
        <button
          onClick={go}
          disabled={submitting}
          className="w-full bg-error text-on-error font-medium text-button py-3 rounded-xl hover:opacity-90 disabled:opacity-60 shadow-md transition-all active:scale-[0.98]"
        >
          {submitting ? 'Cancelling…' : 'Yes, cancel lesson'}
        </button>
        <button
          onClick={onClose}
          disabled={submitting}
          className="w-full bg-transparent text-secondary font-medium text-button py-2 hover:text-on-surface dark:hover:text-dark-on-surface transition-colors"
        >
          Keep it
        </button>
      </div>
    </Modal>
  )
}

function ReviewModal({ lesson, onClose, onSaved }) {
  const [rating, setRating]   = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function go(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await reportsApi.createReview({ lesson: lesson.id, rating, comment })
      toast.success('Thanks for the review!')
      await onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not save review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={go}>
        <div className="p-lg text-center border-b border-outline-variant dark:border-dark-outline-variant">
          <div className="w-16 h-16 bg-tertiary/10 text-tertiary rounded-full flex items-center justify-center mx-auto mb-md">
            <Icon name="rate_review" className="text-3xl" />
          </div>
          <h3 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">Leave a review</h3>
          <p className="text-body-sm text-secondary mt-1">{fmtFull(lesson.scheduled_at)} with {lesson.teacher_name}</p>
        </div>
        <div className="p-lg space-y-md">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Icon
                    name="star"
                    filled={n <= rating}
                    className={`text-[32px] ${n <= rating ? 'text-tertiary' : 'text-secondary/40 hover:text-tertiary/60'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="What did you like? What could be better?"
              className="w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
            />
          </div>
        </div>
        <div className="p-lg bg-surface-container-low dark:bg-dark-surface-container-low flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary font-medium text-button py-3 rounded-xl hover:bg-primary-container disabled:opacity-60 shadow-md transition-all active:scale-[0.98]"
          >
            {submitting ? 'Saving…' : 'Submit review'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full bg-transparent text-secondary font-medium text-button py-2 hover:text-on-surface dark:hover:text-dark-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-md" onClick={onClose}>
      <div
        className="bg-surface-container-lowest dark:bg-dark-surface-container w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-outline-variant dark:border-dark-outline-variant"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
