'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import type { RecipeCategory } from '@/lib/database.types'

type RecipeFiltersProps = {
  categories: RecipeCategory[]
  activeCategory?: string
  activeDifficulty?: string
  activeTags?: string[]
}

const DIFFICULTIES = [
  { value: '', label: 'All Difficulties' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const

export default function RecipeFilters({
  categories,
  activeCategory,
  activeDifficulty,
  activeTags,
}: RecipeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [tagInput, setTagInput] = useState(activeTags?.join(', ') ?? '')

  const pushParams = useCallback(
    (updates: Record<string, string | string[] | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      // Reset pagination when filters change
      params.delete('page')

      for (const [key, value] of Object.entries(updates)) {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          params.delete(key)
        } else if (Array.isArray(value)) {
          params.delete(key)
          value.forEach((v) => params.append(key, v))
        } else {
          params.set(key, value)
        }
      }

      startTransition(() => {
        router.push(`/recipes?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  const hasActiveFilters =
    !!activeCategory ||
    !!activeDifficulty ||
    (activeTags && activeTags.length > 0) ||
    searchParams.get('gf') === '1' ||
    searchParams.get('hp') === '1' ||
    !!searchParams.get('q')

  const handleClearAll = () => {
    setTagInput('')
    startTransition(() => {
      router.push('/recipes')
    })
  }

  const handleTagCommit = () => {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    pushParams({ tag: tags })
  }

  return (
    <div className="space-y-4">
      {/* Mobile toggle */}
      <div className="flex items-center justify-between sm:hidden">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E8E0D5] bg-white text-sm font-medium text-[#1C1410] hover:border-[#C8652A] transition-colors"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-2 h-2 rounded-full bg-[#C8652A]" aria-label="active filters" />
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-sm text-[#C8652A] hover:underline flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div
        className={`space-y-4 ${filtersOpen ? 'block' : 'hidden'} sm:block`}
        aria-hidden={!filtersOpen && undefined}
      >
        {/* Category pills */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5E] mb-2">
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => pushParams({ category: undefined })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                !activeCategory
                  ? 'bg-[#C8652A] text-white border-[#C8652A]'
                  : 'bg-white text-[#1C1410] border-[#E8E0D5] hover:border-[#C8652A]'
              }`}
              aria-pressed={!activeCategory}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => pushParams({ category: cat.slug })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-[#C8652A] text-white border-[#C8652A]'
                    : 'bg-white text-[#1C1410] border-[#E8E0D5] hover:border-[#C8652A]'
                }`}
                aria-pressed={activeCategory === cat.slug}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty + Diet row */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Difficulty dropdown */}
          <div className="min-w-[180px]">
            <label
              htmlFor="difficulty-select"
              className="block text-xs font-semibold uppercase tracking-wider text-[#7A6A5E] mb-2"
            >
              Difficulty
            </label>
            <div className="relative">
              <select
                id="difficulty-select"
                value={activeDifficulty ?? ''}
                onChange={(e) => pushParams({ difficulty: e.target.value || undefined })}
                className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-[#E8E0D5] bg-white text-sm text-[#1C1410] focus:outline-none focus:border-[#C8652A] focus:ring-1 focus:ring-[#C8652A] transition-colors cursor-pointer"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6A5E] pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Tag search */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="tag-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[#7A6A5E] mb-2"
            >
              Tags
            </label>
            <div className="flex gap-2">
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleTagCommit()
                  }
                }}
                placeholder="chocolate, sourdough…"
                className="flex-1 px-3 py-2 rounded-lg border border-[#E8E0D5] bg-white text-sm text-[#1C1410] placeholder:text-[#7A6A5E] focus:outline-none focus:border-[#C8652A] focus:ring-1 focus:ring-[#C8652A] transition-colors"
              />
              <button
                onClick={handleTagCommit}
                className="px-3 py-2 rounded-lg bg-[#F5EDE4] text-[#C8652A] text-sm font-medium hover:bg-[#C8652A] hover:text-white transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Diet toggles */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5E] mb-2">
              Diet
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  pushParams({ gf: searchParams.get('gf') === '1' ? undefined : '1' })
                }
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  searchParams.get('gf') === '1'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-[#1C1410] border-[#E8E0D5] hover:border-emerald-500'
                }`}
                aria-pressed={searchParams.get('gf') === '1'}
              >
                Gluten-Free
              </button>
              <button
                onClick={() =>
                  pushParams({ hp: searchParams.get('hp') === '1' ? undefined : '1' })
                }
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  searchParams.get('hp') === '1'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-[#1C1410] border-[#E8E0D5] hover:border-blue-500'
                }`}
                aria-pressed={searchParams.get('hp') === '1'}
              >
                High-Protein
              </button>
            </div>
          </div>

          {/* Desktop clear */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="hidden sm:flex items-center gap-1 text-sm text-[#C8652A] hover:underline pb-0.5"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Clear all
            </button>
          )}
        </div>

        {/* Pending indicator */}
        {isPending && (
          <div className="text-xs text-[#7A6A5E] animate-pulse">Updating results…</div>
        )}
      </div>
    </div>
  )
}
