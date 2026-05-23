'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition, useRef } from 'react'

const SUGGESTIONS = [
  'sourdough starter',
  'bread flour',
  'laminated dough',
  'buttercream',
  'active dry yeast',
  'Dutch process cocoa',
]

type SearchBarProps = {
  defaultValue?: string
  autoFocus?: boolean
}

export default function SearchBar({ defaultValue = '', autoFocus = false }: SearchBarProps) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    })
  }

  return (
    <div className="w-full">
      <form ref={formRef} onSubmit={handleSubmit} className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A6A5E] pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search recipes, ingredients, guides…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-32 py-4 rounded-xl border border-[#E8E0D5] bg-white text-[#1C1410] placeholder:text-[#7A6A5E] text-base focus:outline-none focus:ring-2 focus:ring-[#C8652A]/30 focus:border-[#C8652A] shadow-sm transition-colors"
          aria-label="Search the encyclopedia"
        />
        <button
          type="submit"
          disabled={isPending || !value.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-[#C8652A] text-white text-sm font-medium disabled:opacity-50 hover:bg-[#9E4D1F] transition-colors"
        >
          {isPending ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Suggestion chips */}
      {!defaultValue && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-[#7A6A5E]">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s)
                startTransition(() => {
                  router.push(`/search?q=${encodeURIComponent(s)}`)
                })
              }}
              className="px-3 py-1 rounded-full text-sm bg-white border border-[#E8E0D5] text-[#7A6A5E] hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
