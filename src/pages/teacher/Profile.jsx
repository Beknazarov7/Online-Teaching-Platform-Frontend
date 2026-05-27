/**
 * Teacher Profile — identity card, lifetime stats, Telegram link card.
 *
 * Bio editing isn't wired up yet (no PATCH endpoint for teacher_profile),
 * so we just display the bio if it's been set via Django Admin. Linking
 * Telegram, however, IS interactive — same component the student uses.
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/Card'
import Icon from '../../components/Icon'
import TelegramLinkCard from '../../components/TelegramLinkCard'
import { useAuth } from '../../auth/AuthContext'
import * as lessonsApi from '../../api/lessons'

export default function TeacherProfile() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState([])
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([lessonsApi.listMyLessons(), lessonsApi.listMySlots()])
      .then(([l, s]) => { setLessons(l); setSlots(s) })
      .catch(() => toast.error('Failed to load profile data.'))
      .finally(() => setLoading(false))
  }, [])

  const completed   = lessons.filter((l) => l.status === 'completed').length
  const upcoming    = lessons.filter((l) =>
    l.status === 'confirmed' && new Date(l.scheduled_at) > new Date()
  ).length
  const openSlots   = slots.filter((s) => !s.is_booked && new Date(s.start_time) > new Date()).length
  const bio         = user?.teacher_profile?.bio?.trim()

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h1 className="text-h1 font-bold text-on-surface dark:text-dark-on-surface">Profile</h1>
        <p className="text-body-sm text-secondary mt-1">Your account and notification settings.</p>
      </div>

      {/* Identity */}
      <Card className="p-lg flex flex-col md:flex-row md:items-center gap-lg">
        <div className="w-24 h-24 rounded-full bg-primary text-on-primary grid place-items-center text-4xl font-black flex-shrink-0">
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{user?.username}</h2>
          <p className="text-secondary text-sm break-all">{user?.email || 'No email on file'}</p>
          <span className="inline-block mt-md text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-fixed-dim">
            Teacher
          </span>
          {bio && <p className="mt-md text-sm text-on-surface-variant dark:text-dark-on-surface-variant">{bio}</p>}
        </div>
      </Card>

      <TelegramLinkCard />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <Card className="p-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim flex items-center justify-center">
            <Icon name="history_edu" className="text-[24px]" />
          </div>
          <div>
            <p className="text-xs text-secondary uppercase tracking-wider font-bold">Lessons taught</p>
            <p className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{loading ? '—' : completed}</p>
          </div>
        </Card>
        <Card className="p-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
            <Icon name="event_upcoming" className="text-[24px]" />
          </div>
          <div>
            <p className="text-xs text-secondary uppercase tracking-wider font-bold">Upcoming</p>
            <p className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{loading ? '—' : upcoming}</p>
          </div>
        </Card>
        <Card className="p-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Icon name="event_available" className="text-[24px]" />
          </div>
          <div>
            <p className="text-xs text-secondary uppercase tracking-wider font-bold">Open slots</p>
            <p className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{loading ? '—' : openSlots}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
