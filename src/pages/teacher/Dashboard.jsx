/**
 * Teacher Dashboard — week-at-a-glance bento grid.
 *
 * Top row: stat cards (pending requests, this week's lessons, slots open,
 * lessons taught lifetime).
 * Below: 7-day grid showing each weekday with the lessons (and open slots)
 * sitting on it. Click a pending lesson to jump to /teacher/requests.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import { useAuth } from '../../auth/AuthContext'
import * as lessonsApi from '../../api/lessons'
import { fmtTime } from '../../utils/date'

function startOfWeek(d = new Date()) {
  // Monday-first week.
  const date = new Date(d); date.setHours(0, 0, 0, 0)
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  return date
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState([])
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([lessonsApi.listMyLessons(), lessonsApi.listMySlots()])
      .then(([l, s]) => { setLessons(l); setSlots(s) })
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  const weekStart = useMemo(() => startOfWeek(), [])
  const weekEnd   = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7); return d
  }, [weekStart])

  const inWeek = (iso) => {
    const t = new Date(iso).getTime()
    return t >= weekStart.getTime() && t < weekEnd.getTime()
  }

  const pending      = lessons.filter((l) => l.status === 'pending').length
  const weekLessons  = lessons.filter((l) => inWeek(l.scheduled_at) && ['confirmed', 'pending'].includes(l.status))
  const openSlots    = slots.filter((s) => !s.is_booked && new Date(s.start_time) > new Date()).length
  const completed    = lessons.filter((l) => l.status === 'completed').length

  // Bucket events by weekday index (0=Mon).
  const byDay = Array.from({ length: 7 }, () => [])
  for (const l of weekLessons) {
    const d = new Date(l.scheduled_at)
    const idx = (d.getDay() + 6) % 7
    byDay[idx].push({ kind: 'lesson', when: d, lesson: l })
  }
  for (const s of slots) {
    if (!inWeek(s.start_time) || s.is_booked) continue
    const d = new Date(s.start_time)
    const idx = (d.getDay() + 6) % 7
    byDay[idx].push({ kind: 'slot', when: d, slot: s })
  }
  byDay.forEach((arr) => arr.sort((a, b) => a.when - b.when))

  const stats = [
    { icon: 'inbox',          label: 'Pending requests', value: pending,    tint: 'tertiary', to: '/teacher/requests' },
    { icon: 'event',          label: 'This week',         value: weekLessons.length, tint: 'primary' },
    { icon: 'event_available', label: 'Open slots',        value: openSlots,  tint: 'secondary', to: '/teacher/slots' },
    { icon: 'history_edu',    label: 'Lessons taught',    value: completed,  tint: 'primary' },
  ]

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Welcome, {user?.username}</h1>
        <p className="text-body-sm text-secondary mt-1">Your week at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {stats.map((s) => {
          const inner = (
            <Card className={`p-md ${s.to ? 'hover:border-primary cursor-pointer transition-colors' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  s.tint === 'primary'  ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim' :
                  s.tint === 'tertiary' ? 'bg-tertiary/10 text-tertiary' :
                  'bg-secondary-container text-on-secondary-container'
                }`}>
                  <Icon name={s.icon} className="text-[24px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-secondary uppercase tracking-wider font-bold">{s.label}</p>
                  <p className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface truncate">{s.value}</p>
                </div>
              </div>
            </Card>
          )
          return s.to ? <Link key={s.label} to={s.to}>{inner}</Link> : <div key={s.label}>{inner}</div>
        })}
      </div>

      {/* Weekly bento grid */}
      <Card className="p-lg">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface">This week</h2>
          <Link to="/teacher/slots" className="text-sm font-medium text-primary dark:text-primary-fixed-dim hover:underline">
            Manage slots
          </Link>
        </div>
        {loading ? (
          <p className="text-secondary text-center py-xl">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {DAY_NAMES.map((name, i) => {
              const dayDate = new Date(weekStart); dayDate.setDate(dayDate.getDate() + i)
              const isToday = (new Date()).toDateString() === dayDate.toDateString()
              const events  = byDay[i]
              return (
                <div
                  key={name}
                  className={`rounded-lg p-3 min-h-[140px] border ${
                    isToday
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-outline-variant dark:border-dark-outline-variant bg-surface-container-low dark:bg-dark-surface-container-low'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      isToday ? 'text-primary' : 'text-secondary'
                    }`}>{name}</span>
                    <span className={`text-lg font-black ${
                      isToday
                        ? 'text-primary dark:text-primary-fixed-dim'
                        : 'text-on-surface dark:text-dark-on-surface'
                    }`}>{dayDate.getDate()}</span>
                  </div>
                  {events.length === 0 ? (
                    <p className="text-[11px] text-secondary italic">Nothing scheduled</p>
                  ) : (
                    <ul className="space-y-1">
                      {events.map((e, idx) => (
                        <li key={idx}>
                          {e.kind === 'lesson' ? (
                            <Link
                              to={e.lesson.status === 'pending' ? '/teacher/requests' : '/teacher/lessons'}
                              className={`block text-[11px] px-2 py-1 rounded font-medium truncate ${
                                e.lesson.status === 'pending'
                                  ? 'bg-tertiary/15 text-tertiary'
                                  : 'bg-primary/15 text-primary dark:text-primary-fixed-dim'
                              }`}
                            >
                              {fmtTime(e.lesson.scheduled_at)} · {e.lesson.student_name}
                            </Link>
                          ) : (
                            <span className="block text-[11px] px-2 py-1 rounded font-medium bg-secondary-container/60 text-on-secondary-container truncate">
                              {fmtTime(e.slot.start_time)} · open
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
