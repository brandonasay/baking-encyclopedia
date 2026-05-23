'use client'

import { useState } from 'react'
import { BookmarkX, Loader2 } from 'lucide-react'

type Props = {
  recipeId: string
  onRemoved?: () => void
}

export default function UnsaveButton({ recipeId, onRemoved }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'removed'>('idle')

  async function handleUnsave() {
    setStatus('loading')
    try {
      const res = await fetch(`/api/user/save?recipeId=${recipeId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to unsave')
      setStatus('removed')
      onRemoved?.()
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'removed') return null

  return (
    <button
      onClick={handleUnsave}
      disabled={status === 'loading'}
      title="Remove from saved"
      aria-label="Remove from saved"
      className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-[#6D5E6D] transition-colors duration-150 disabled:opacity-60"
    >
      {status === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <BookmarkX className="w-4 h-4" />
      )}
    </button>
  )
}
