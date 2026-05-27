/**
 * Admin · Progress — platform-wide analytics dashboard.
 *
 * One backend round trip (/api/admin/progress/) drives all six widgets:
 * KPI cards, daily-trend chart, status breakdown, top teachers,
 * top students, and recent reviews.
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import * as adminApi from '../../api/admin'

export default function AdminProgress() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.fetchProgress()
      .then(setData)
      .catch(() => toast.error('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card className="p-xl text-center">
        <p className="text-secondary">Loading analytics…</p>
      </Card>
    )
  }
  if (!data) return null

  const { totals, by_status, daily, top_teachers, top_students, recent_reviews } = data

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Progress</h1>
        <p className="text-body-sm text-secondary mt-1">
          Lifetime and recent activity at a glance.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        <Kpi icon="event"          tint="primary"   label="Total lessons"    value={totals.lessons} />
        <Kpi icon="check_circle"   tint="positive"  label="Completion rate"  value={`${totals.completion_rate}%`} />
        <Kpi icon="star"           tint="tertiary"  label="Avg rating"       value={totals.avg_rating ?? '—'} suffix={totals.avg_rating ? '/5' : ''} />
        <Kpi icon="groups"         tint="secondary" label="Active students"  value={totals.active_students} sub="last 30 days" />
      </div>

      {/* Chart + status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
        <Card className="lg:col-span-2 p-lg">
          <div className="flex items-center justify-between mb-md">
            <div>
              <h3 className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface">Lessons over time</h3>
              <p className="text-xs text-secondary">Last 30 days</p>
            </div>
            <Legend />
          </div>
          <DailyChart daily={daily} />
        </Card>

        <Card className="p-lg">
          <h3 className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface mb-md">Status breakdown</h3>
          <StatusBreakdown byStatus={by_status} />
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <Card className="p-0 overflow-hidden">
          <h3 className="text-h3 font-h3 px-md py-md text-on-surface dark:text-dark-on-surface border-b border-outline-variant dark:border-dark-outline-variant flex items-center gap-2">
            <Icon name="workspace_premium" className="text-tertiary text-[22px]" />
            Top teachers
          </h3>
          {top_teachers.length === 0 ? (
            <p className="px-md py-xl text-center text-secondary text-sm">No completed lessons yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low dark:bg-dark-surface-container-low text-secondary text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-md py-sm">Teacher</th>
                  <th className="px-md py-sm text-right">Completed</th>
                  <th className="px-md py-sm text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant dark:divide-dark-outline-variant">
                {top_teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-md py-sm flex items-center gap-2">
                      <Avatar name={t.username} tint="tertiary" />
                      <span className="font-semibold text-on-surface dark:text-dark-on-surface">{t.username}</span>
                    </td>
                    <td className="px-md py-sm text-right font-bold text-on-surface dark:text-dark-on-surface">{t.completed}</td>
                    <td className="px-md py-sm text-right">
                      {t.avg_rating != null
                        ? <span className="inline-flex items-center gap-1 text-tertiary"><Icon name="star" className="text-[14px]" />{t.avg_rating}</span>
                        : <span className="text-secondary">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <h3 className="text-h3 font-h3 px-md py-md text-on-surface dark:text-dark-on-surface border-b border-outline-variant dark:border-dark-outline-variant flex items-center gap-2">
            <Icon name="emoji_events" className="text-primary text-[22px]" />
            Top students
          </h3>
          {top_students.length === 0 ? (
            <p className="px-md py-xl text-center text-secondary text-sm">No completed lessons yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low dark:bg-dark-surface-container-low text-secondary text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-md py-sm">Student</th>
                  <th className="px-md py-sm text-right">Completed</th>
                  <th className="px-md py-sm text-right">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant dark:divide-dark-outline-variant">
                {top_students.map((s) => (
                  <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-md py-sm flex items-center gap-2">
                      <Avatar name={s.username} tint="primary" />
                      <span className="font-semibold text-on-surface dark:text-dark-on-surface">{s.username}</span>
                    </td>
                    <td className="px-md py-sm text-right font-bold text-on-surface dark:text-dark-on-surface">{s.completed}</td>
                    <td className="px-md py-sm text-right">
                      <span className="inline-flex items-center gap-1 text-tertiary">
                        <Icon name="local_fire_department" className="text-[14px]" />{s.streak}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Recent reviews */}
      <Card className="p-lg">
        <h3 className="text-h3 font-h3 mb-md text-on-surface dark:text-dark-on-surface flex items-center gap-2">
          <Icon name="reviews" className="text-primary text-[22px]" />
          Recent reviews
        </h3>
        {recent_reviews.length === 0 ? (
          <p className="text-secondary text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-md">
            {recent_reviews.map((r, i) => <ReviewItem key={i} review={r} />)}
          </div>
        )}
      </Card>
    </div>
  )
}

// ---------- bits ---------- //

function Kpi({ icon, tint, label, value, sub, suffix }) {
  const tintClasses = {
    primary:   'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary:  'bg-tertiary/10 text-tertiary',
    positive:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  }[tint] || ''
  return (
    <Card className="p-lg">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-md ${tintClasses}`}>
        <Icon name={icon} className="text-[26px]" />
      </div>
      <p className="text-xs text-secondary uppercase tracking-wider font-bold mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-on-surface dark:text-dark-on-surface">
        {value}{suffix && <span className="text-base text-secondary font-normal">{suffix}</span>}
      </h3>
      {sub && <p className="text-[11px] text-secondary mt-1">{sub}</p>}
    </Card>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-secondary">
      <LegendDot color="bg-green-500" label="Completed" />
      <LegendDot color="bg-error"     label="Cancelled" />
      <LegendDot color="bg-primary"   label="Other"     />
    </div>
  )
}
function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color}`} />{label}
    </span>
  )
}

function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.completed + d.cancelled + d.other))
  return (
    <div>
      {/* Stacked bars. Each column is one day. Inline divs are simpler than
          SVG for this — Tailwind drives sizing via percentage heights. */}
      <div className="flex items-end gap-[2px] h-40 mt-2">
        {daily.map((d) => {
          const total = d.completed + d.cancelled + d.other
          const heightPct = (total / max) * 100
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col-reverse rounded-t overflow-hidden bg-surface-container-low dark:bg-dark-surface-container-low min-w-0"
              style={{ height: `${heightPct || 2}%` }}
              title={`${d.date}: ${d.completed} completed, ${d.cancelled} cancelled, ${d.other} other`}
            >
              {d.completed > 0 && <div className="bg-green-500" style={{ flex: d.completed }} />}
              {d.cancelled > 0 && <div className="bg-error"     style={{ flex: d.cancelled }} />}
              {d.other     > 0 && <div className="bg-primary"   style={{ flex: d.other     }} />}
            </div>
          )
        })}
      </div>
      {/* X-axis: show first / mid / last date labels. With 30 cols inline
          all labels would overlap, so we only print a few. */}
      <div className="flex justify-between text-[10px] text-secondary mt-2 px-1">
        <span>{labelFor(daily[0]?.date)}</span>
        <span>{labelFor(daily[Math.floor(daily.length / 2)]?.date)}</span>
        <span>{labelFor(daily[daily.length - 1]?.date)}</span>
      </div>
    </div>
  )
}
function labelFor(iso) {
  if (!iso) return ''
  try { return format(parseISO(iso), 'd MMM') } catch { return '' }
}

const STATUS_META = {
  pending:   { label: 'Pending',   classes: 'bg-primary/10 text-primary',  bar: 'bg-primary' },
  confirmed: { label: 'Confirmed', classes: 'bg-tertiary/10 text-tertiary', bar: 'bg-tertiary' },
  completed: { label: 'Completed', classes: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', bar: 'bg-green-500' },
  cancelled: { label: 'Cancelled', classes: 'bg-error-container text-on-error-container', bar: 'bg-error' },
  declined:  { label: 'Declined',  classes: 'bg-error-container text-on-error-container', bar: 'bg-error' },
}

function StatusBreakdown({ byStatus }) {
  const entries = Object.entries(byStatus)
  const total   = entries.reduce((acc, [, n]) => acc + n, 0)
  if (total === 0) return <p className="text-secondary text-sm">No lessons recorded yet.</p>

  return (
    <div className="space-y-md">
      {Object.keys(STATUS_META).map((key) => {
        const n   = byStatus[key] || 0
        const pct = Math.round((n / total) * 100)
        const meta = STATUS_META[key]
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-bold px-2 py-0.5 rounded uppercase tracking-wide ${meta.classes}`}>{meta.label}</span>
              <span className="text-secondary"><span className="font-bold text-on-surface dark:text-dark-on-surface">{n}</span> · {pct}%</span>
            </div>
            <div className="w-full bg-surface-container-low dark:bg-dark-surface-container-low h-2 rounded-full overflow-hidden">
              <div className={`${meta.bar} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReviewItem({ review }) {
  let when = ''
  try { when = formatDistanceToNow(parseISO(review.at), { addSuffix: true }) } catch { /* ignore */ }
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-outline-variant dark:border-dark-outline-variant">
      <Avatar name={review.student} tint="primary" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-on-surface dark:text-dark-on-surface truncate">
            {review.student} <span className="text-secondary font-normal">→ {review.teacher}</span>
          </p>
          <Stars n={review.rating} />
        </div>
        {review.comment && (
          <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant line-clamp-2">{review.comment}</p>
        )}
        <span className="text-[10px] text-secondary uppercase tracking-tight">{when}</span>
      </div>
    </div>
  )
}

function Stars({ n }) {
  return (
    <span className="inline-flex items-center text-tertiary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" className={`text-[14px] ${i < n ? '' : 'opacity-25'}`} />
      ))}
    </span>
  )
}

function Avatar({ name, tint }) {
  const tintClasses = {
    primary:  'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim',
    tertiary: 'bg-tertiary/10 text-tertiary',
  }[tint] || ''
  return (
    <div className={`w-8 h-8 rounded-full grid place-items-center font-bold text-xs flex-shrink-0 ${tintClasses}`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}
