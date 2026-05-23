'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

export default function IngredientSearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      startTransition(() => {
        router.replace(`/ingredients?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  return (
    <div className="relative w-full max-w-lg">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D5E6D] pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder="Search ingredients…"
        defaultValue={defaultValue}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#EBD2AD] bg-white text-[#201D20] placeholder:text-[#6D5E6D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C58930]/30 focus:border-[#C58930] transition-colors"
        aria-label="Search ingredients"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#C58930]/40 border-t-[#C58930] rounded-full animate-spin" />
      )}
    </div>
  )
}
