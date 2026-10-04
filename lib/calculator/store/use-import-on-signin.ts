'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LocalStore } from './local-store'
import { importGuestData } from './import-action'
import { emptyDocument } from '../types'

export type ImportStatus =
  | { phase: 'idle' }
  | { phase: 'importing' }
  | { phase: 'done'; count: number }
  | { phase: 'error'; message: string; retry: () => void }

function docHasContent(doc: ReturnType<typeof emptyDocument>): boolean {
  return !!doc.settings || doc.pantryItems.length > 0 || doc.recipes.length > 0 || doc.products.length > 0 || doc.plans.length > 0
}

// Fires once per sign-in transition (null -> signed in). Reads the guest's
// local document, imports it via the server action, and clears local
// storage only on success — failures keep the local data intact with a
// retry.
export function useImportOnSignIn(): ImportStatus {
  const [status, setStatus] = useState<ImportStatus>({ phase: 'idle' })
  const wasSignedIn = useRef<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function runImport() {
      const doc = await new LocalStore().exportAll()
      if (!docHasContent(doc)) return
      setStatus({ phase: 'importing' })
      const result = await importGuestData(doc)
      if (result.ok) {
        LocalStore.clear()
        setStatus({ phase: 'done', count: result.importedCount })
      } else {
        setStatus({ phase: 'error', message: result.error ?? 'Import failed.', retry: runImport })
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const isSignedIn = !!session?.user
      if (isSignedIn && wasSignedIn.current === false) runImport()
      wasSignedIn.current = isSignedIn
    })

    supabase.auth.getUser().then(({ data }) => {
      if (wasSignedIn.current === null) wasSignedIn.current = !!data.user
    })

    return () => sub.subscription.unsubscribe()
  }, [supabase])

  return status
}
