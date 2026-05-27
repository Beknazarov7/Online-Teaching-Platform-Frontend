/**
 * Telegram link UI — fits inside any profile page.
 *
 * Two states based on the current user's `telegram_id`:
 *   - LINKED: shows linked status + an "Unlink" button.
 *   - NOT LINKED: a "Generate code" button that fetches a one-time code
 *     and shows step-by-step instructions for sending it to the bot.
 *
 * After unlinking we call refresh() on AuthContext so the badge flips
 * back to "Not linked" without a hard refresh.
 */
import { useState } from 'react'
import toast from 'react-hot-toast'
import Card from './Card'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import * as telegramApi from '../api/telegram'

export default function TelegramLinkCard() {
  const { user, refresh } = useAuth()
  const [code, setCode]   = useState(null)   // {code, expires_at, bot_username}
  const [busy, setBusy]   = useState(false)

  const linked = Boolean(user?.telegram_id)

  async function generate() {
    setBusy(true)
    try {
      setCode(await telegramApi.generateLinkCode())
    } catch {
      toast.error('Could not generate code.')
    } finally {
      setBusy(false)
    }
  }

  async function unlink() {
    if (!confirm('Disconnect your Telegram account? You will stop receiving reminders.')) return
    setBusy(true)
    try {
      await telegramApi.unlinkTelegram()
      toast.success('Telegram disconnected.')
      setCode(null)
      await refresh()
    } catch {
      toast.error('Could not unlink.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-lg">
      <div className="flex items-center gap-3 mb-md">
        <div className="w-12 h-12 rounded-lg bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center">
          <Icon name="send" className="text-[24px]" />
        </div>
        <div className="flex-1">
          <h2 className="text-h3 font-h3 text-on-surface dark:text-dark-on-surface">Telegram</h2>
          <p className="text-xs text-secondary">
            {linked ? 'Reminders are sent to your Telegram.' : 'Get lesson reminders in Telegram.'}
          </p>
        </div>
        <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
          linked
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-secondary-container text-on-secondary-container'
        }`}>
          {linked ? 'Linked' : 'Not linked'}
        </span>
      </div>

      {linked ? (
        <button
          onClick={unlink}
          disabled={busy}
          className="text-sm font-medium text-error hover:underline disabled:opacity-60"
        >
          Disconnect
        </button>
      ) : code ? (
        <LinkInstructions code={code} onRegenerate={generate} busy={busy} />
      ) : (
        <button
          onClick={generate}
          disabled={busy}
          className="bg-primary text-on-primary font-medium text-button px-5 py-2.5 rounded-lg hover:bg-primary-container disabled:opacity-60 transition-all active:scale-[0.98] inline-flex items-center gap-2"
        >
          <Icon name="link" className="text-[20px]" />
          {busy ? 'Generating…' : 'Generate link code'}
        </button>
      )}
    </Card>
  )
}

function LinkInstructions({ code, onRegenerate, busy }) {
  const command = `/start ${code.code}`
  const botUrl = code.bot_username
    ? `https://t.me/${code.bot_username}?start=${code.code}`
    : null

  function copy() {
    navigator.clipboard.writeText(command)
      .then(() => toast.success('Command copied.'))
      .catch(() => toast.error('Copy failed.'))
  }

  return (
    <div className="space-y-md">
      <ol className="space-y-sm text-sm text-on-surface dark:text-dark-on-surface">
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold grid place-items-center flex-shrink-0">1</span>
          <span>
            Open the bot in Telegram
            {botUrl ? (
              <>
                {' '}—{' '}
                <a
                  href={botUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary dark:text-primary-fixed-dim font-medium hover:underline"
                >
                  t.me/{code.bot_username}
                </a>
              </>
            ) : ' (search for the bot you set up)'}.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold grid place-items-center flex-shrink-0">2</span>
          <span>Send this command:</span>
        </li>
      </ol>

      <div className="flex items-stretch gap-2">
        <code className="flex-1 bg-surface-container-low dark:bg-dark-surface-container-low border border-outline-variant dark:border-dark-outline-variant rounded-lg px-3 py-2 text-sm font-mono text-on-surface dark:text-dark-on-surface select-all">
          {command}
        </code>
        <button
          onClick={copy}
          className="px-3 rounded-lg border border-outline-variant dark:border-dark-outline-variant hover:bg-primary/5 transition-colors"
          aria-label="Copy command"
        >
          <Icon name="content_copy" className="text-[18px] text-secondary" />
        </button>
      </div>

      <p className="text-xs text-secondary">
        This code expires in 10 minutes. Lose track of it?{' '}
        <button
          onClick={onRegenerate}
          disabled={busy}
          className="text-primary dark:text-primary-fixed-dim font-medium hover:underline disabled:opacity-60"
        >
          Generate a new one
        </button>.
      </p>
    </div>
  )
}
