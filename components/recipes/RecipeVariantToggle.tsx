'use client'

import { useState } from 'react'
import type { RecipeIngredient, RecipeInstruction } from '@/lib/database.types'
import { IngredientsList } from '@/components/recipes/RecipeIngredientsList'
import { InstructionsSection } from '@/components/recipes/RecipeInstructionsSection'

type Variant = 'standard' | 'gluten-free' | 'high-protein'

type RecipeVariantToggleProps = {
  hasGlutenFree: boolean
  hasHighProtein: boolean
  glutenFreeNotes?: string
  highProteinNotes?: string
  baseIngredients: RecipeIngredient[]
  baseInstructions: RecipeInstruction[]
  glutenFreeIngredients?: RecipeIngredient[]
  glutenFreeInstructions?: RecipeInstruction[]
  highProteinIngredients?: RecipeIngredient[]
  highProteinInstructions?: RecipeInstruction[]
}

export default function RecipeVariantToggle({
  hasGlutenFree,
  hasHighProtein,
  glutenFreeNotes,
  highProteinNotes,
  baseIngredients,
  baseInstructions,
  glutenFreeIngredients,
  glutenFreeInstructions,
  highProteinIngredients,
  highProteinInstructions,
}: RecipeVariantToggleProps) {
  const [variant, setVariant] = useState<Variant>('standard')

  const activeIngredients =
    variant === 'gluten-free' && glutenFreeIngredients
      ? glutenFreeIngredients
      : variant === 'high-protein' && highProteinIngredients
      ? highProteinIngredients
      : baseIngredients

  const activeInstructions =
    variant === 'gluten-free' && glutenFreeInstructions
      ? glutenFreeInstructions
      : variant === 'high-protein' && highProteinInstructions
      ? highProteinInstructions
      : baseInstructions

  const activeNotes =
    variant === 'gluten-free' ? glutenFreeNotes : variant === 'high-protein' ? highProteinNotes : undefined

  const tabs: { value: Variant; label: string }[] = [
    { value: 'standard', label: 'Standard' },
    ...(hasGlutenFree ? [{ value: 'gluten-free' as Variant, label: 'Gluten-Free' }] : []),
    ...(hasHighProtein ? [{ value: 'high-protein' as Variant, label: 'High-Protein' }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Variant tabs */}
      <div
        className="inline-flex bg-[#FAF8F4] border border-[#E8E0D5] rounded-xl p-1 gap-1"
        role="tablist"
        aria-label="Recipe variant"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={variant === tab.value}
            onClick={() => setVariant(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              variant === tab.value
                ? 'bg-white text-[#C8652A] shadow-sm border border-[#E8E0D5]'
                : 'text-[#7A6A5E] hover:text-[#1C1410]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Variant notes */}
      {activeNotes && (
        <div className="p-4 bg-[#F5EDE4] rounded-xl border-l-4 border-[#C8652A]">
          <p className="text-sm text-[#1C1410] leading-relaxed">{activeNotes}</p>
        </div>
      )}

      {/* Ingredients (shown inline on mobile) */}
      <div className="lg:hidden bg-white rounded-2xl border border-[#E8E0D5] overflow-hidden">
        <div className="px-5 py-4 bg-[#F5EDE4] border-b border-[#E8E0D5]">
          <h2
            className="text-lg font-bold text-[#1C1410]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Ingredients
          </h2>
        </div>
        <div className="px-5 py-5">
          <IngredientsList ingredients={activeIngredients} />
        </div>
      </div>

      {/* Instructions */}
      <InstructionsSection instructions={activeInstructions} />
    </div>
  )
}
