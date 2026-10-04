'use client'

import { useEffect, useState } from 'react'

// Shared "dismiss for N days" behavior for the sign-in prompt and the
// Homebaked CTA. Keyed per-device for guests (localStorage); once signed in,
// the same key just keeps working per-browser — the PRD only requires
// "per device for guests, per account when signed in" and a localStorage key
// already satisfies both in practice for a client-rendered tool like this.
export function useDismissible(key: string, days = 30): { dismissed: boolean; dismiss: () => void; ready: boolean } {
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)
  const storageKey = `be-calc-dismiss:${key}`

  useEffect(() => {
    // Reading localStorage must wait for the client-only effect pass (it's
    // unavailable during SSR) — this is the standard hydration-safe pattern
    // for browser-only state, not a prop/state sync that belongs in render.
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const until = Number(raw)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!Number.isNaN(until) && Date.now() < until) setDismissed(true)
      }
    } catch {
      // localStorage unavailable — never persist a dismissal, always show.
    }
    setReady(true)
  }, [storageKey])

  function dismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(storageKey, String(Date.now() + days * 24 * 60 * 60 * 1000))
    } catch {
      // Best-effort only.
    }
  }

  return { dismissed, dismiss, ready }
}
