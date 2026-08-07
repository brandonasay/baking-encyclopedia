'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { ContentBlock } from '@/lib/database.types'

export type GeneratedHowToData = {
  title?: string
  headline?: string
  blocks?: ContentBlock[]
  tags?: string[]
  seo_title?: string
  seo_description?: string
}

type ArticleType = 'auto' | 'recipe' | 'technique'

type Props = {
  onGenerate: (data: GeneratedHowToData) => void
}

export default function HowToGenerator({ onGenerate }: Props) {
  const [topic, setTopic] = useState('')
  const [type, setType] = useState<ArticleType>('auto')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [hasWarning, setHasWarning] = useState(false)

  async function handleGenerate() {
    if (!topic.trim()) return
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/admin/generate-howto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), type }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(json.error ?? 'Something went wrong')
        return
      }
      setStatus('success')
      setHasWarning(!!json.warning)
      setMessage(json.warning ? `Draft generated. ${json.warning}` : 'Draft generated — review everything before publishing.')
      onGenerate(json.data)
    } catch {
      setStatus('error')
      setMessage('Network error — please try again')
    }
  }

  return (
    <div className="bg-[#F5EAC8] border border-[#C58930]/30 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#C58930]" />
        <h3 className="text-sm font-semibold text-[#201D20]">Generate from a topic</h3>
        <span className="text-xs text-[#6D5E6D] ml-auto">Drafts the full article with AI, then auto-fills the form</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g. How to Laminate Dough"
          className="flex-1 px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] placeholder-[#6D5E6D] focus:outline-none focus:ring-2 focus:ring-[#C58930] focus:border-transparent"
          disabled={status === 'loading'}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ArticleType)}
          disabled={status === 'loading'}
          className="px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] focus:outline-none focus:ring-2 focus:ring-[#C58930] focus:border-transparent cursor-pointer"
        >
          <option value="auto">Let AI decide</option>
          <option value="recipe">Recipe</option>
          <option value="technique">Technique guide</option>
        </select>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === 'loading' || !topic.trim()}
          className="px-4 py-2 bg-[#C58930] text-white text-sm font-medium rounded-lg hover:bg-[#8A5D1A] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 whitespace-nowrap justify-center"
        >
          {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {status === 'loading' ? 'Writing…' : 'Generate'}
        </button>
      </div>

      {status === 'success' && (
        <p className={`mt-2.5 flex items-center gap-1.5 text-xs ${hasWarning ? 'text-[#A87225]' : 'text-green-700'}`}>
          {hasWarning ? (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          {message}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {message}
        </p>
      )}
    </div>
  )
}
