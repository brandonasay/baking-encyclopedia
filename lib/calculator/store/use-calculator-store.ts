'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LocalStore } from './local-store'
import { SupabaseStore } from './supabase-store'
import type { CalculatorStore } from './types'

export interface CalculatorStoreState {
  store: CalculatorStore
  isGuest: boolean
  loading: boolean
  localStatus: { persistent: boolean; recoveredFromBackup: boolean }
}

// Picks LocalStore vs SupabaseStore based solely on whether a session
// exists. Re-evaluates on auth state change (e.g. the import flow signing
// the guest in mid-session).
export function useCalculatorStore(): CalculatorStoreState {
  const [userId, setUserId] = useState<string | null | undefined>(undefined) // undefined = not yet resolved
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const store = useMemo<CalculatorStore>(() => {
    if (userId) return new SupabaseStore(supabase, userId)
    return new LocalStore()
  }, [supabase, userId])

  // userId isn't read in the body — it's a deliberate recompute trigger, so
  // local status re-checks after a sign-in clears localStorage via import.
  const localStatus = useMemo(() => {
    if (typeof window === 'undefined') return { persistent: true, recoveredFromBackup: false }
    return LocalStore.status()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { store, isGuest: userId === null, loading: userId === undefined, localStatus }
}
