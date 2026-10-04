'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PantryItem } from '@/lib/calculator/types'

interface LibraryMatch {
  id: string
  name: string
}

export default function IngredientLinePicker({
  pantryItems,
  selectedPantryItemId,
  onSelectPantryItem,
  onCreateFromLibrary,
}: {
  pantryItems: PantryItem[]
  selectedPantryItemId: string | null
  onSelectPantryItem: (id: string) => void
  onCreateFromLibrary: (ingredient: { id: string; name: string; gramsPerCup: number | null; gramsPerEach: number | null }) => void
}) {
  const selected = pantryItems.find((p) => p.id === selectedPantryItemId)
  const [query, setQuery] = useState(selected?.name ?? '')
  const [open, setOpen] = useState(false)
  const [libraryMatches, setLibraryMatches] = useState<LibraryMatch[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(selected?.name ?? '') }, [selected?.name])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) { setLibraryMatches([]); return }
    let cancelled = false
    const supabase = createClient()
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('search_all', { query: query.trim(), result_limit: 8 })
      if (cancelled) return
      const typed = (data ?? []) as { id: string; content_type: string; title: string }[]
      setLibraryMatches(typed.filter((r) => r.content_type === 'ingredient').map((r) => ({ id: r.id, name: r.title })))
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  const pantryMatches = pantryItems.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
  const pantryIngredientIds = new Set(pantryItems.map((p) => p.ingredientId).filter(Boolean))
  const newLibraryMatches = libraryMatches.filter((m) => !pantryIngredientIds.has(m.id))

  async function pickLibrary(match: LibraryMatch) {
    const supabase = createClient()
    const { data } = await supabase.from('ingredients').select('grams_per_cup, grams_per_each').eq('id', match.id).maybeSingle()
    onCreateFromLibrary({ id: match.id, name: match.name, gramsPerCup: data?.grams_per_cup ?? null, gramsPerEach: data?.grams_per_each ?? null })
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="w-full px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] outline-none focus:ring-2 focus:ring-[#C58930]"
        placeholder="Search pantry or ingredients…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (query.trim().length > 0) && (pantryMatches.length > 0 || newLibraryMatches.length > 0) && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#EBD2AD] rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {pantryMatches.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6D5E6D]">Your pantry</p>
              {pantryMatches.map((p) => (
                <button
                  key={p.id} type="button"
                  className="block w-full text-left px-3 py-1.5 text-sm hover:bg-[#FCFFEB] text-[#201D20]"
                  onClick={() => { onSelectPantryItem(p.id); setQuery(p.name); setOpen(false) }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          {newLibraryMatches.length > 0 && (
            <div className="border-t border-[#EBD2AD]">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6D5E6D]">Add from ingredient library</p>
              {newLibraryMatches.map((m) => (
                <button
                  key={m.id} type="button"
                  className="block w-full text-left px-3 py-1.5 text-sm hover:bg-[#FCFFEB] text-[#201D20]"
                  onClick={() => pickLibrary(m)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
