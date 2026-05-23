'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/database.types'
import { Check, Loader2 } from 'lucide-react'

type Props = { profile: Profile }

export default function AccountSettingsForm({ profile }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [mailingList, setMailingList] = useState(profile.mailing_list)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, mailing_list: mailingList }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to save')
      }
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-[#201D20] mb-1.5">
          Display name
        </label>
        <input
          id="display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-[#EBD2AD] bg-[#FCFFEB] text-[#201D20] focus:outline-none focus:ring-2 focus:ring-[#C58930]/40 text-sm"
          placeholder="Your name"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={mailingList}
          onClick={() => setMailingList((v) => !v)}
          className={`relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C58930]/40 ${
            mailingList ? 'bg-[#C58930]' : 'bg-[#EBD2AD]'
          }`}
        >
          <span
            className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 self-center ${
              mailingList ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-[#201D20]">Subscribe to newsletter</span>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C58930] hover:bg-[#a87225] text-white font-medium text-sm transition-colors duration-150 disabled:opacity-60"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'success' && <Check className="w-4 h-4" />}
          {status === 'loading' ? 'Saving…' : status === 'success' ? 'Saved!' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
