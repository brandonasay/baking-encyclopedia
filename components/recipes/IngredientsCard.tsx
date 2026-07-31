'use client'

import { useState } from 'react'
import type { RecipeIngredient } from '@/lib/database.types'
import { IngredientsList } from '@/components/recipes/RecipeIngredientsList'
import { SCALE_OPTIONS, scaleYield, type UnitSystem } from '@/lib/quantity'

type IngredientsCardProps = {
  ingredients: RecipeIngredient[]
  baseYield?: string | null
  baseServings?: number | null
}

const UNIT_OPTIONS: { label: string; value: UnitSystem }[] = [
  { label: 'Cups', value: 'us' },
  { label: 'Grams', value: 'metric' },
]

export function IngredientsCard({ ingredients, baseYield, baseServings }: IngredientsCardProps) {
  const [scale, setScale] = useState(1)
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('us')
  const yieldLabel = scaleYield(baseYield, baseServings, scale)

  return (
    <div className="bg-white rounded-2xl border border-[#EBD2AD] overflow-hidden">
      <div className="px-5 py-4 bg-[#F5EAC8] border-b border-[#EBD2AD] flex flex-wrap items-center justify-between gap-3">
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
        <IngredientsList ingredients={ingredients} scale={scale} unitSystem={unitSystem} />
      </div>
    </div>
  )
}
