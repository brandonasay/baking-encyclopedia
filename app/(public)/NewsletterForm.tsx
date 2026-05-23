'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/user/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Something went wrong')
      }
      setStatus('success')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-2 text-[#201D20]">
        <div className="w-12 h-12 rounded-full bg-[#C58930] flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <p className="text-lg font-semibold">You&apos;re on the list!</p>
        <p className="text-sm text-[#6D5E6D]">Welcome to the baker community.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 px-4 py-3 rounded-lg border border-[#EBD2AD] bg-white text-[#201D20] placeholder:text-[#6D5E6D] focus:outline-none focus:ring-2 focus:ring-[#C58930]/40 text-sm"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 rounded-lg bg-[#C58930] hover:bg-[#a87225] text-white font-medium text-sm transition-colors duration-150 disabled:opacity-60 whitespace-nowrap"
      >
        {status === 'loading' ? 'Joining…' : 'Join Now'}
      </button>
      {status === 'error' && (
        <p className="w-full text-sm text-red-600 mt-1">{errorMsg}</p>
      )}
    </form>
  )
}
