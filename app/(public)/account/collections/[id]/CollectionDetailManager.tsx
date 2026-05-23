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
            ? 'border-[#B5C9A8] bg-[#EEF3EA] text-[#41622D] hover:bg-[#DCE8D5]'
            : 'border-[#EBD2AD] bg-white text-[#6D5E6D] hover:border-[#C58930] hover:text-[#C58930]'
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
