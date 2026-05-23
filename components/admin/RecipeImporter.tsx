'use client'

import { useState } from 'react'
import { Link, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { RecipeIngredient, RecipeInstruction } from '@/lib/database.types'

export type ImportedRecipeData = {
  title?: string
  headline?: string
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  base_yield?: string
  base_servings?: number | null
  ingredients?: RecipeIngredient[]
  instructions?: RecipeInstruction[]
  tips?: string[]
  equipment?: string[]
  storage_instructions?: string
  tags?: string[]
  image_url?: string
}

type Props = {
  onImport: (data: ImportedRecipeData) => void
}

export default function RecipeImporter({ onImport }: Props) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [source, setSource] = useState<'json-ld' | 'claude' | null>(null)

  async function handleImport() {
    if (!url.trim()) return
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/admin/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(json.error ?? 'Something went wrong')
        return
      }
      setSource(json.source)
      setStatus('success')
      setMessage(`Extracted via ${json.source === 'json-ld' ? 'structured data (instant)' : 'AI — review carefully'}`)
      onImport(json.data)
    } catch {
      setStatus('error')
      setMessage('Network error — please try again')
    }
  }

  return (
    <div className="bg-[#F5EDE4] border border-[#C8652A]/30 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Link className="w-4 h-4 text-[#C8652A]" />
        <h3 className="text-sm font-semibold text-[#1C1410]">Import from URL</h3>
        <span className="text-xs text-[#7A6A5E] ml-auto">Paste a recipe link to auto-fill the form</span>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleImport()}
          placeholder="https://example.com/chocolate-chip-cookies"
          className="flex-1 px-3 py-2 bg-white border border-[#E8E0D5] rounded-lg text-sm text-[#1C1410] placeholder-[#7A6A5E] focus:outline-none focus:ring-2 focus:ring-[#C8652A] focus:border-transparent"
          disabled={status === 'loading'}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={status === 'loading' || !url.trim()}
          className="px-4 py-2 bg-[#C8652A] text-white text-sm font-medium rounded-lg hover:bg-[#9E4D1F] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 whitespace-nowrap"
        >
          {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {status === 'loading' ? 'Importing…' : 'Import Recipe'}
        </button>
      </div>

      {status === 'success' && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-green-700">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Form pre-filled — {message}. Review everything before publishing.
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
