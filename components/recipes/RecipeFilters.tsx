'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'

export default function RecipeFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInput.trim()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    startTransition(() => {
      router.push(`/recipes?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6D5E6D] pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search recipes…"
        className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-[#EBD2AD] bg-[#FCFFEB] text-[#201D20] placeholder:text-[#6D5E6D] text-base focus:outline-none focus:ring-2 focus:ring-[#C58930]/30 focus:border-[#C58930] transition-colors"
        aria-label="Search recipes"
      />
      <button
        type="submit"
        disabled={isPending}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#a87225] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
