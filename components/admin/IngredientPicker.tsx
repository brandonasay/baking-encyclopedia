'use client'

import { useEffect, useState } from 'react'

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const inputCls = 'w-full px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] placeholder-[#6D5E6D] focus:outline-none focus:ring-2 focus:ring-[#C58930] focus:border-transparent transition'

export type PickedIngredient = { id: string; name: string; slug: string }

type Props = {
  ingredientId?: string
  linkedName?: string
  onLink: (picked: PickedIngredient) => void
  onUnlink: () => void
}

export default function IngredientPicker({ ingredientId, linkedName, onLink, onUnlink }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickedIngredient[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!expanded || !query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/ingredients/search?q=${encodeURIComponent(query.trim())}`)
        const json = await res.json()
        setResults(res.ok ? (json.ingredients ?? []) : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, expanded])

  function pick(picked: PickedIngredient) {
    onLink(picked)
    setExpanded(false)
    setQuery('')
    setResults([])
  }

  async function createAndLink() {
    const name = query.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: slugify(name), category: 'Uncategorized', published: false }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create ingredient')
      pick({ id: json.id, name: json.name, slug: json.slug })
    } catch {
      // Leave the search open so the admin can retry.
    } finally {
      setCreating(false)
    }
  }

  if (!expanded) {
    if (ingredientId) {
      return (
        <div className="inline-flex items-center gap-1.5 text-xs bg-[#EEF3EA] text-[#41622D] border border-[#B5C9A8] rounded-full px-2.5 py-1">
          <span>Linked → {linkedName || 'ingredient'}</span>
          <button type="button" onClick={onUnlink} className="hover:text-red-600" aria-label="Unlink ingredient">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )
    }
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1 text-xs text-[#C58930] font-medium hover:underline"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Link ingredient
      </button>
    )
  }

  return (
    <div className="bg-[#FCFFEB] rounded-lg border border-[#EBD2AD] p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          className={inputCls}
          placeholder="Search the ingredients encyclopedia..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={() => { setExpanded(false); setQuery(''); setResults([]) }}
          className="p-1 text-[#6D5E6D] hover:text-[#201D20] shrink-0"
          aria-label="Cancel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {loading && <p className="text-xs text-[#6D5E6D] px-1">Searching…</p>}

      {!loading && results.length > 0 && (
        <ul className="space-y-1">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-sm text-[#201D20] hover:bg-white hover:border-[#C58930] border border-transparent transition-colors"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && query.trim() && (
        <button
          type="button"
          onClick={createAndLink}
          disabled={creating}
          className="w-full text-left px-2.5 py-1.5 rounded-md text-sm text-[#C58930] font-medium hover:bg-white border border-dashed border-[#C58930]/50 transition-colors disabled:opacity-50"
        >
          {creating ? 'Creating…' : `+ Create new ingredient "${query.trim()}"`}
        </button>
      )}
    </div>
  )
}
