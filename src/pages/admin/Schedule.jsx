/**
 * Admin · Schedule — platform-wide view of every lesson.
 *
 * Three quick-range chips (Today / This week / This month / All) drive a
 * date_from/date_to filter on the backend. Secondary filters narrow by
 * status, teacher, and student. Results are grouped by day for scanning.
 */
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from 'date-fns'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import * as adminApi from '../../api/admin'
import { fmtTime, fmtDate, fmtDay } from '../../utils/date'

const STATUS_TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'pending',   label: 'Pending'   },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'declined',  label: 'Declined'  },
]

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all',   label: 'All time' },
]

function rangeBounds(key) {
  const now = new Date()
  if (key === 'today') return { from: now, to: now }
  if (key === 'week')  return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
  if (key === 'month') return { from: startOfMonth(now), to: endOfMonth(now) }
  return { from: null, to: null }
}

const ymd = (d) => d ? format(d, 'yyyy-MM-dd') : undefined

export default function AdminSchedule() {
  const [lessons, setLessons]   = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)

  const [range, setRange]       = useState('week')
  const [status, setStatus]     = useState('all')
  const [teacherId, setTeacher] = useState('')
  const [studentId, setStudent] = useState('')

  // Load teacher + student lists once for the dropdowns. These rarely change
  // and the page already does a lessons fetch on every filter tweak.
  useEffect(() => {
    Promise.all([
      adminApi.listUsers({ role: 'teacher' }),
      adminApi.listUsers({ role: 'student' }),
    ]).then(([t, s]) => { setTeachers(t); setStudents(s) })
      .catch(() => {/* dropdowns will just be empty */})
  }, [])

  async function load() {
    setLoading(true)
    try {
      const { from, to } = rangeBounds(range)
      const params = {}
      if (status !== 'all') params.status     = status
      if (teacherId)        params.teacher    = teacherId
      if (studentId)        params.student    = studentId
      if (from)             params.date_from  = ymd(from)
      if (to)               params.date_to    = ymd(to)
      const data = await adminApi.listLessons(params)
      setLessons(data)
    } catch {
      toast.error('Failed to load schedule.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [range, status, teacherId, studentId])

  // Group by yyyy-mm-dd for the day-column layout.
  const byDay = useMemo(() => {
    const out = {}
    for (const l of lessons) {
      const key = l.scheduled_at.slice(0, 10)
      ;(out[key] ||= []).push(l)
    }
    return out
  }, [lessons])

  const counts = useMemo(() => {
    const c = { total: lessons.length, today: 0, pending: 0, completed: 0 }
    for (const l of lessons) {
      try { if (isToday(parseISO(l.scheduled_at))) c.today += 1 } catch { /* ignore */ }
      if (l.status === 'pending')   c.pending   += 1
      if (l.status === 'completed') c.completed += 1
    }
    return c
  }, [lessons])

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md">
        <div>
          <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Schedule</h1>
          <p className="text-body-sm text-secondary mt-1">
            Every booking across the platform, grouped by day.
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-full bg-surface-container-low dark:bg-dark-surface-container-low self-start">
          {RANGES.map((r) => (
            <TabBtn key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
              {r.label}
            </TabBtn>
          ))}
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        <SummaryCard icon="event"        tint="primary"   label="Lessons in range" value={counts.total} />
        <SummaryCard icon="today"        tint="tertiary"  label="Today"            value={counts.today} />
        <SummaryCard icon="hourglass_top" tint="secondary" label="Pending"          value={counts.pending} />
        <SummaryCard icon="check_circle" tint="positive"  label="Completed"        value={counts.completed} />
      </div>

      {/* Filters + list */}
      <Card className="overflow-hidden p-0">
        <div className="p-md flex flex-col gap-md border-b border-outline-variant dark:border-dark-outline-variant">
          <div className="flex flex-col md:flex-row md:items-center gap-md">
            <select
              value={teacherId}
              onChange={(e) => setTeacher(e.target.value)}
              className={selectCls + ' md:flex-1'}
            >
              <option value="">All teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.username}</option>
              ))}
            </select>
            <select
              value={studentId}
              onChange={(e) => setStudent(e.target.value)}
              className={selectCls + ' md:flex-1'}
            >
              <option value="">All students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.username}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-1 p-1 rounded-full bg-surface-container-low dark:bg-dark-surface-container-low self-start">
            {STATUS_TABS.map((t) => (
              <TabBtn key={t.key} active={status === t.key} onClick={() => setStatus(t.key)}>
                {t.label}
              </TabBtn>
            ))}
          </div>
        </div>

        <div className="p-md">
          {loading ? (
            <p className="text-secondary text-center py-xl">Loading schedule…</p>
          ) : lessons.length === 0 ? (
            <div className="text-center py-xl">
              <Icon name="event_busy" className="text-5xl text-secondary mb-2" />
              <p className="text-secondary">No lessons match these filters.</p>
            </div>
          ) : (
            <div className="space-y-lg">
              {Object.entries(byDay).map(([day, items]) => (
                <DayBlock key={day} day={day} items={items} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ---------- bits ---------- //

function DayBlock({ day, items }) {
  const sample = items[0].scheduled_at
  return (
    <div>
      <div className="flex items-center gap-md mb-md">
        <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase">{fmtDay(sample)}</span>
          <span className="text-lg font-black leading-none">{fmtDate(sample).split(' ')[0]}</span>
        </div>
        <div>
          <p className="font-semibold text-on-surface dark:text-dark-on-surface">{fmtDate(sample)}</p>
          <p className="text-xs text-secondary">{items.length} lesson{items.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <tbody className="divide-y divide-outline-variant dark:divide-dark-outline-variant">
            {items.map((l) => <LessonRow key={l.id} lesson={l} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LessonRow({ lesson }) {
  return (
    <tr className="hover:bg-primary/5 transition-colors">
      <td className="px-md py-sm w-20 align-middle">
        <div className="font-bold text-primary dark:text-primary-fixed-dim">{fmtTime(lesson.scheduled_at)}</div>
      </td>
      <td className="px-md py-sm align-middle">
        <div className="flex items-center gap-2 text-sm">
          <Avatar name={lesson.student_name} tint="primary" />
          <span className="font-semibold text-on-surface dark:text-dark-on-surface truncate">{lesson.student_name}</span>
          <Icon name="arrow_forward" className="text-secondary text-[16px]" />
          <Avatar name={lesson.teacher_name} tint="tertiary" />
          <span className="font-semibold text-on-surface dark:text-dark-on-surface truncate">{lesson.teacher_name}</span>
        </div>
      </td>
      <td className="px-md py-sm text-right align-middle">
        <StatusBadge status={lesson.status} charged={lesson.cancellation_charged} />
      </td>
    </tr>
  )
}

function Avatar({ name, tint }) {
  const tintClasses = {
    primary:  'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim',
    tertiary: 'bg-tertiary/10 text-tertiary',
  }[tint] || ''
  return (
    <div className={`w-7 h-7 rounded-full grid place-items-center font-bold text-xs flex-shrink-0 ${tintClasses}`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function StatusBadge({ status, charged }) {
  const styles = {
    pending:   'bg-primary/10 text-primary',
    confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    completed: 'bg-secondary-container text-on-secondary-container',
    cancelled: 'bg-error-container text-on-error-container',
    declined:  'bg-error-container text-on-error-container',
  }[status] || 'bg-secondary-container text-secondary'
  const label = status === 'cancelled' && charged ? 'Cancelled · charged' : status
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${styles}`}>
      {label}
    </span>
  )
}

function SummaryCard({ icon, tint, label, value }) {
  const tintClasses = {
    primary:   'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary:  'bg-tertiary/10 text-tertiary',
    positive:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  }[tint] || ''
  return (
    <Card className="p-md flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tintClasses}`}>
        <Icon name={icon} className="text-[22px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-secondary uppercase tracking-wider font-bold truncate">{label}</p>
        <p className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface">{value}</p>
      </div>
    </Card>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
        active
          ? 'bg-surface-container-lowest dark:bg-dark-surface-container text-on-surface dark:text-dark-on-surface shadow-sm'
          : 'text-secondary hover:text-on-surface dark:hover:text-dark-on-surface'
      }`}
    >
      {children}
    </button>
  )
}

const selectCls =
  'bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none'
