'use client'

import { useState } from 'react'
import { Minus, Loader2 } from 'lucide-react'

type Props = {
  collectionId: string
  itemId: string
  onRemoved?: () => void
}

export default function RemoveFromCollectionButton({ collectionId, itemId, onRemoved }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'removed'>('idle')

  async function handleRemove() {
    setStatus('loading')
    try {
      const res = await fetch(`/api/user/collections/${collectionId}/items/${itemId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove')
      setStatus('removed')
      onRemoved?.()
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'removed') return null

  return (
    <button
      onClick={handleRemove}
      disabled={status === 'loading'}
      title="Remove from collection"
      aria-label="Remove from collection"
      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-[#6D5E6D] transition-colors duration-150 disabled:opacity-60"
    >
      {status === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Minus className="w-4 h-4" />
      )}
    </button>
  )
}
