'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// A compact, self-contained sign-in form for the calculator's guest banner
// and post-pricing prompt. Deliberately separate from Header's AuthModal
// (which isn't exposed for external triggering) rather than prop-drilling a
// shared modal through the whole site shell for one feature.
export default function SignInPrompt({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else onClose()
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(window.location.pathname)}` },
    })
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#201D20]/45 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="font-serif text-xl font-bold text-[#201D20] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
          {mode === 'signin' ? 'Welcome back' : 'Save your calculator'}
        </h2>
        <p className="text-sm text-[#6D5E6D] mb-4">Keep your pantry, recipes, and plans everywhere you sign in.</p>

        <button
          onClick={handleGoogle}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#EBD2AD] text-sm font-medium text-[#201D20] hover:bg-[#FCFFEB] mb-4"
        >
          Continue with Google
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#EBD2AD]" />
          <span className="text-xs text-[#6D5E6D] font-medium">or</span>
          <div className="flex-1 h-px bg-[#EBD2AD]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" required placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#EBD2AD] text-sm bg-[#FCFFEB] outline-none focus:ring-2 focus:ring-[#C58930]"
          />
          <input
            type="password" required placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#EBD2AD] text-sm bg-[#FCFFEB] outline-none focus:ring-2 focus:ring-[#C58930]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#C58930] text-white font-semibold text-sm hover:bg-[#A87225] disabled:opacity-60"
          >
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6D5E6D] mt-4">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            className="text-[#C58930] font-semibold"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
        <button type="button" onClick={onClose} className="block mx-auto mt-3 text-xs text-[#6D5E6D]">
          Not now
        </button>
      </div>
    </div>
  )
}
