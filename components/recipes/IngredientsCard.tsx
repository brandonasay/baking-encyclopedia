'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { RecipeIngredient } from '@/lib/database.types'
import { IngredientsList } from '@/components/recipes/RecipeIngredientsList'
import { SCALE_OPTIONS, formatIngredientLine, scaleYield, type UnitSystem } from '@/lib/quantity'

type IngredientsCardProps = {
  ingredients: RecipeIngredient[]
  baseYield?: string | null
  baseServings?: number | null
  headerClassName?: string
}

const UNIT_OPTIONS: { label: string; value: UnitSystem }[] = [
  { label: 'Cups', value: 'us' },
  { label: 'Grams', value: 'metric' },
]

export function IngredientsCard({
  ingredients,
  baseYield,
  baseServings,
  headerClassName = 'bg-[#F5EAC8]',
}: IngredientsCardProps) {
  const [scale, setScale] = useState(1)
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('us')
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const yieldLabel = scaleYield(baseYield, baseServings, scale)
  const missingCount = ingredients.length - checked.size

  const toggleChecked = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleCopyMissing = async () => {
    const missing = ingredients
      .filter((_, index) => !checked.has(index))
      .map((ing) => formatIngredientLine(ing, scale, unitSystem))
      .join('\n')
    try {
      await navigator.clipboard.writeText(missing)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
    setTimeout(() => setCopyState('idle'), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#EBD2AD] overflow-hidden">
      <div className={`px-5 py-4 ${headerClassName} border-b border-[#EBD2AD] flex flex-wrap items-center justify-between gap-3`}>
        <h2
          className="text-lg font-bold text-[#201D20]"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Ingredients
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-[#EBD2AD] bg-white p-0.5"
            role="group"
            aria-label="Units"
          >
            {UNIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUnitSystem(opt.value)}
                aria-pressed={unitSystem === opt.value}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  unitSystem === opt.value
                    ? 'bg-[#201D20] text-white'
                    : 'text-[#6D5E6D] hover:text-[#201D20]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div
            className="inline-flex rounded-lg border border-[#EBD2AD] bg-white p-0.5"
            role="group"
            aria-label="Scale recipe"
          >
            {SCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScale(opt.value)}
                aria-pressed={scale === opt.value}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  scale === opt.value
                    ? 'bg-[#C58930] text-white'
                    : 'text-[#6D5E6D] hover:text-[#201D20]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-5">
        {yieldLabel && <p className="text-xs text-[#6D5E6D] mb-4">Makes {yieldLabel}</p>}
        <IngredientsList
          ingredients={ingredients}
          scale={scale}
          unitSystem={unitSystem}
          checked={checked}
          onToggle={toggleChecked}
        />
        <div className="mt-5 pt-4 border-t border-[#EBD2AD]">
          <button
            type="button"
            onClick={handleCopyMissing}
            disabled={missingCount === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C58930] hover:bg-[#a87225] text-white font-medium text-sm transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {copyState === 'copied' ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                Copied!
              </>
            ) : copyState === 'error' ? (
              'Couldn’t copy — try again'
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                {missingCount === 0
                  ? 'All ingredients checked'
                  : `Copy missing ingredients (${missingCount})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
