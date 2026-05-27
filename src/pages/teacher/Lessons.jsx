/**
 * Teacher Lessons — list of confirmed/completed/cancelled lessons.
 *
 * For CONFIRMED lessons whose start time has passed, the teacher can
 * "Write report" — submitting the report flips the lesson to COMPLETED
 * server-side and bumps the student's stats. For COMPLETED lessons, the
 * existing report and the student's review (if any) are shown inline.
 */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import * as lessonsApi from '../../api/lessons'
import * as reportsApi from '../../api/reports'
import { fmtFull, fmtDate, fmtDay } from '../../utils/date'

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'reportable', label: 'Awaiting report' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function TeacherLessons() {
  const [lessons, setLessons] = useState([])
  const [reports, setReports] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [reporting, setReporting] = useState(null) // lesson

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
    if (filter === 'upcoming') return lessons.filter((l) =>
      l.status === 'confirmed' && new Date(l.scheduled_at).getTime() > now
    )
    if (filter === 'reportable') return lessons.filter((l) =>
      l.status === 'confirmed' && new Date(l.scheduled_at).getTime() <= now
    )
    if (filter === 'completed') return lessons.filter((l) => l.status === 'completed')
    if (filter === 'cancelled') return lessons.filter((l) => ['cancelled', 'declined'].includes(l.status))
    return lessons
  }, [lessons, filter])

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Lessons</h1>
        <p className="text-body-sm text-secondary mt-1">Write reports on completed lessons and review past ones.</p>
      </div>

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
                onReport={() => setReporting(l)}
              />
            ))}
          </ul>
        )}
      </Card>

      {reporting && (
        <ReportModal
          lesson={reporting}
          onClose={() => setReporting(null)}
          onSaved={async () => { setReporting(null); await reload() }}
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

function LessonRow({ lesson, report, review, onReport }) {
  const past = new Date(lesson.scheduled_at).getTime() <= Date.now()
  const canReport = lesson.status === 'confirmed' && past

  return (
    <li className="py-3 flex items-center gap-3 flex-wrap">
      <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold uppercase leading-none">{fmtDay(lesson.scheduled_at).slice(0, 3)}</span>
        <span className="text-lg font-black leading-none">{fmtDate(lesson.scheduled_at).split(' ')[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface dark:text-dark-on-surface truncate">{lesson.student_name}</p>
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
        {canReport && (
          <button
            onClick={onReport}
            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-colors active:scale-[0.98]"
          >
            Write report
          </button>
        )}
      </div>
    </li>
  )
}

function ReportModal({ lesson, onClose, onSaved }) {
  const [topic, setTopic]   = useState('')
  const [text, setText]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function go(e) {
    e.preventDefault()
    if (!topic.trim() || !text.trim()) {
      toast.error('Topic and notes are required.')
      return
    }
    setSubmitting(true)
    try {
      await reportsApi.createReport({ lesson: lesson.id, topic, text })
      toast.success('Report saved. Lesson marked completed.')
      await onSaved()
    } catch (err) {
      const data = err.response?.data
      const msg = data?.detail || (typeof data === 'string' ? data : null) || 'Could not save report.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-md" onClick={onClose}>
      <div
        className="bg-surface-container-lowest dark:bg-dark-surface-container w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-outline-variant dark:border-dark-outline-variant"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={go}>
          <div className="p-lg text-center border-b border-outline-variant dark:border-dark-outline-variant">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim rounded-full flex items-center justify-center mx-auto mb-md">
              <Icon name="edit_note" className="text-3xl" />
            </div>
            <h3 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">Lesson report</h3>
            <p className="text-body-sm text-secondary mt-1">{fmtFull(lesson.scheduled_at)} with {lesson.student_name}</p>
          </div>
          <div className="p-lg space-y-md">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                placeholder="e.g. Past simple — irregular verbs"
                className="w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant mb-1">Notes</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={5}
                placeholder="What you covered, how the student did, what to focus on next…"
                className="w-full bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
              />
            </div>
            <div className="bg-primary/5 border border-primary/20 p-md rounded-xl flex gap-3 text-xs leading-relaxed">
              <Icon name="info" className="text-primary" />
              <p className="text-on-surface-variant dark:text-dark-on-surface-variant">
                Submitting will mark this lesson as <span className="font-bold">completed</span> and update the student's stats.
              </p>
            </div>
          </div>
          <div className="p-lg bg-surface-container-low dark:bg-dark-surface-container-low flex flex-col gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary font-medium text-button py-3 rounded-xl hover:bg-primary-container disabled:opacity-60 shadow-md transition-all active:scale-[0.98]"
            >
              {submitting ? 'Saving…' : 'Submit report'}
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
      </div>
    </div>
  )
}
