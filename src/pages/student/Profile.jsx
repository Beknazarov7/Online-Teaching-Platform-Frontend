/**
 * Student Profile page — visualises the student's rank progression and
 * lifetime stats. Read-only for now; level/profile edits would go here
 * when those endpoints are added.
 */
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import TelegramLinkCard from '../../components/TelegramLinkCard'
import { useAuth } from '../../auth/AuthContext'

const RANKS = [
  { name: 'Starter',   max: 5,        icon: 'eco' },
  { name: 'Learner',   max: 15,       icon: 'auto_stories' },
  { name: 'Speaker',   max: 30,       icon: 'forum' },
  { name: 'Confident', max: 50,       icon: 'workspace_premium' },
  { name: 'Fluent',    max: Infinity, icon: 'military_tech' },
]

function rankIndex(name) {
  const i = RANKS.findIndex((r) => r.name === name)
  return i === -1 ? 0 : i
}

export default function StudentProfile() {
  const { user } = useAuth()
  const profile  = user?.student_profile
  const total    = profile?.total_lessons ?? 0
  const streak   = profile?.streak ?? 0
  const rank     = profile?.rank ?? 'Starter'
  const level    = profile?.level ?? 'A1'

  const idx       = rankIndex(rank)
  const current   = RANKS[idx]
  const next      = RANKS[idx + 1]
  const prevMax   = idx === 0 ? 0 : RANKS[idx - 1].max
  const target    = next ? current.max : current.max  // for Fluent: use current.max
  const remaining = next ? Math.max(0, current.max + 1 - total) : 0
  const pctToNext = next
    ? Math.min(100, Math.round(((total - prevMax) / (current.max - prevMax)) * 100))
    : 100

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Profile</h1>
        <p className="text-body-sm text-secondary mt-1">Your rank, level, and lifetime stats.</p>
      </div>

      {/* Identity card */}
      <Card className="p-lg flex flex-col md:flex-row md:items-center gap-lg">
        <div className="w-24 h-24 rounded-full bg-primary text-on-primary grid place-items-center text-4xl font-black flex-shrink-0">
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{user?.username}</h2>
          <p className="text-secondary text-sm break-all">{user?.email || 'No email on file'}</p>
          <div className="flex flex-wrap gap-2 mt-md">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-fixed-dim">
              {rank}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container">
              Level {level}
            </span>
          </div>
        </div>
      </Card>

      {/* Rank progression */}
      <Card className="p-lg">
        <h2 className="text-h3 font-h3 mb-md text-on-surface dark:text-dark-on-surface">Rank progression</h2>

        <div className="grid grid-cols-5 gap-2 mb-lg">
          {RANKS.map((r, i) => {
            const reached = i <= idx
            return (
              <div
                key={r.name}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  reached
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim'
                    : 'bg-surface-container-low dark:bg-dark-surface-container-low text-secondary'
                }`}
              >
                <Icon name={r.icon} className="text-[28px]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{r.name}</span>
              </div>
            )
          })}
        </div>

        {next ? (
          <>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-secondary">
                Next: <span className="font-bold text-on-surface dark:text-dark-on-surface">{next.name}</span>
              </span>
              <span className="text-secondary">
                {remaining} lesson{remaining === 1 ? '' : 's'} to go
              </span>
            </div>
            <div className="w-full bg-surface-container dark:bg-dark-surface-container-high h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${pctToNext}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-secondary">You've reached the top rank — keep it up!</p>
        )}
      </Card>

      <TelegramLinkCard />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <Card className="p-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex items-center justify-center">
            <Icon name="menu_book" className="text-[24px]" />
          </div>
          <div>
            <p className="text-xs text-secondary uppercase tracking-wider font-bold">Total lessons</p>
            <p className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{total}</p>
          </div>
        </Card>
        <Card className="p-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
            <Icon name="local_fire_department" className="text-[24px]" />
          </div>
          <div>
            <p className="text-xs text-secondary uppercase tracking-wider font-bold">Current streak</p>
            <p className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{streak}</p>
          </div>
        </Card>
        <Card className="p-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Icon name="school" className="text-[24px]" />
          </div>
          <div>
            <p className="text-xs text-secondary uppercase tracking-wider font-bold">Level</p>
            <p className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{level}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
