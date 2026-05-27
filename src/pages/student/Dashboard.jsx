/**
 * Student Dashboard — landing page for students.
 *
 * Shows: greeting, stat cards (total lessons, streak, rank, upcoming),
 * a list of the next few upcoming lessons, and a CTA to the booking page.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import { useAuth } from '../../auth/AuthContext'
import * as lessonsApi from '../../api/lessons'
import { fmtDate, fmtDay, fmtTime, fmtFull } from '../../utils/date'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lessonsApi.listMyLessons()
      .then(setLessons)
      .catch(() => toast.error('Failed to load lessons.'))
      .finally(() => setLoading(false))
  }, [])

  const profile = user?.student_profile
  const total   = profile?.total_lessons ?? 0
  const streak  = profile?.streak ?? 0
  const rank    = profile?.rank ?? 'Starter'

  const upcoming = useMemo(() => {
    const now = Date.now()
    return lessons
      .filter((l) =>
        ['pending', 'confirmed'].includes(l.status) &&
        new Date(l.scheduled_at).getTime() > now
      )
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  }, [lessons])

  const stats = [
    { icon: 'menu_book',     label: 'Total lessons', value: total,            tint: 'primary' },
    { icon: 'local_fire_department', label: 'Current streak', value: streak, tint: 'tertiary' },
    { icon: 'workspace_premium', label: 'Rank',     value: rank,             tint: 'secondary' },
    { icon: 'event_upcoming', label: 'Upcoming',     value: upcoming.length,  tint: 'primary' },
  ]

  return (
    <div className="flex flex-col gap-lg">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md">
        <div>
          <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">
            Welcome back, {user?.username}
          </h1>
          <p className="text-body-sm text-secondary mt-1">
            Here's a quick look at your learning journey.
          </p>
        </div>
        <Link
          to="/student/calendar"
          className="bg-primary text-on-primary font-medium text-button px-5 py-2.5 rounded-lg hover:bg-primary-container transition-all active:scale-[0.98] inline-flex items-center gap-2 self-start md:self-auto"
        >
          <Icon name="add_circle" className="text-[20px]" />
          Book a lesson
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {stats.map((s) => (
          <Card key={s.label} className="p-md">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                s.tint === 'primary'   ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim' :
                s.tint === 'tertiary'  ? 'bg-tertiary/10 text-tertiary' :
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
        ))}
      </div>

      {/* Upcoming + Progress */}
      <div className="grid grid-cols-12 gap-gutter">
        <Card className="col-span-12 lg:col-span-8 p-lg">
          <div className="flex items-center justify-between mb-md">
            <h2 className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface">Upcoming lessons</h2>
            <Link to="/student/lessons" className="text-sm font-medium text-primary dark:text-primary-fixed-dim hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-secondary text-center py-xl">Loading…</p>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-xl">
              <Icon name="event_busy" className="text-5xl text-secondary mb-2" />
              <p className="text-secondary">No upcoming lessons. Book one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant dark:border-dark-outline-variant hover:bg-primary/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase leading-none">{fmtDay(l.scheduled_at).slice(0, 3)}</span>
                    <span className="text-lg font-black leading-none">{fmtDate(l.scheduled_at).split(' ')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface dark:text-dark-on-surface truncate">{l.teacher_name}</p>
                    <p className="text-xs text-secondary">{fmtFull(l.scheduled_at)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    l.status === 'confirmed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-primary/10 text-primary'
                  }`}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Gamification */}
        <div className="col-span-12 lg:col-span-4 bg-primary rounded-xl p-lg text-on-primary shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-primary-fixed-dim text-xs font-bold uppercase tracking-widest mb-1">Your progress</p>
            <h3 className="text-h2 font-h2 mb-md">{rank}</h3>
            <div className="w-full bg-primary-container/60 h-2 rounded-full mb-md overflow-hidden">
              <div
                className="bg-on-primary h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((total / 10) * 100))}%`,
                  boxShadow: '0 0 8px rgba(255,255,255,0.5)',
                }}
              />
            </div>
            <p className="text-sm text-primary-fixed-dim">
              <span className="font-bold text-on-primary">{total}</span> lessons completed ·{' '}
              <span className="font-bold text-on-primary">{streak}</span> in a row
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Icon name="school" className="text-[120px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
