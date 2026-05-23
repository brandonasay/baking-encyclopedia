'use client'

import { useState } from 'react'
import { Globe, Lock, Loader2 } from 'lucide-react'

type Props = {
  collectionId: string
  isPublic: boolean
}

export default function CollectionDetailManager({ collectionId, isPublic: initialPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialPublic)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !isPublic }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setIsPublic((v) => !v)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-150 disabled:opacity-60 ${
          isPublic
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-[#E8E0D5] bg-white text-[#7A6A5E] hover:border-[#C8652A] hover:text-[#C8652A]'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPublic ? (
          <Globe className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        {isPublic ? 'Make private' : 'Make public'}
      </button>
    </div>
  )
}
