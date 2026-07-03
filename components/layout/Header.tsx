'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const sectionLabels: Record<string, string> = {
  '/recipes': 'Recipes',
  '/ingredients': 'Ingredients',
  '/how-to': 'How-To',
  '/search': 'Search',
  '/account': 'Account',
}

function getSectionLabel(pathname: string): string {
  for (const [prefix, label] of Object.entries(sectionLabels)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return label
  }
  return ''
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.refresh()
  }

  const sectionLabel = getSectionLabel(pathname)

  return (
    <>
      <header
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: scrolled ? '0 1px 12px rgba(28,20,16,0.08)' : 'none',
          transition: 'box-shadow 0.2s ease',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>

            {/* Left: site name */}
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Baking Encyclopedia
            </Link>

            {/* Center: current section (hidden on mobile, absolutely centered on desktop) */}
            {sectionLabel && (
              <span
                className="hidden md:block"
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  letterSpacing: '0.01em',
                  pointerEvents: 'none',
                }}
              >
                {sectionLabel}
              </span>
            )}

            {/* Right: auth */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {user ? (
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-amber)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {(user.email ?? 'U')[0].toUpperCase()}
                    </div>
                    <ChevronDown size={14} style={{ color: 'var(--color-muted)' }} />
                  </button>

                  {userMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(28,20,16,0.12)',
                        minWidth: '200px',
                        overflow: 'hidden',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', margin: 0 }}>Signed in as</p>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </p>
                      </div>
                      {[
                        { label: 'My Account', href: '/account' },
                        { label: 'Saved Recipes', href: '/account/saved' },
                        { label: 'Grocery List', href: '/account/grocery-list' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: 'block',
                            padding: '0.625rem 1rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-text)',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                          onClick={handleSignOut}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.625rem 1rem',
                            fontSize: '0.875rem',
                            color: '#DC2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-text)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} onSuccess={() => { setAuthModalOpen(false); router.refresh() }} />
      )}
    </>
  )
}

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else onSuccess()
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(28,20,16,0.45)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 24px 64px rgba(28,20,16,0.16)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', margin: '4px 0 0' }}>
              {mode === 'signin' ? 'Sign in to your account' : 'Join the baking community'}
            </p>
          </div>
          <button onClick={onClose} style={{ padding: '0.375rem', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <button
          onClick={handleGoogle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            padding: '0.625rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1.25rem',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && <p style={{ fontSize: '0.8125rem', color: '#DC2626', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6875rem 1rem',
              borderRadius: '8px',
              backgroundColor: loading ? '#C9A96E' : 'var(--color-amber)',
              color: '#fff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.25rem',
            }}
          >
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '1.25rem', marginBottom: 0 }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            style={{ color: 'var(--color-amber)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
