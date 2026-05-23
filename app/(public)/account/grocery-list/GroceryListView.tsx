'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Printer, Trash2, CheckCheck, X, ChevronDown } from 'lucide-react'
import type { GroceryListFull, GroceryListItem } from './page'
import type { RecipeIngredient } from '@/lib/database.types'

// ---------------------------------------------------------------------------
// Fraction / quantity parsing
// ---------------------------------------------------------------------------
function parseFraction(str: string): number {
  const s = str.trim()
  // Mixed number: "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3])
  // Simple fraction: "1/2"
  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) return parseInt(frac[1]) / parseInt(frac[2])
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function formatQuantity(num: number): string {
  if (num === 0) return '0'
  // Common fractions
  const fracs: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.5, '½'],
    [0.667, '⅔'], [0.75, '¾'],
  ]
  const whole = Math.floor(num)
  const frac = num - whole
  if (frac < 0.01) return String(whole)
  for (const [val, sym] of fracs) {
    if (Math.abs(frac - val) < 0.04) {
      return whole > 0 ? `${whole} ${sym}` : sym
    }
  }
  // Fallback to decimal with 1–2 sig figs
  return num % 1 === 0 ? String(num) : num.toFixed(2).replace(/\.?0+$/, '')
}

// ---------------------------------------------------------------------------
// Scale factor options
// ---------------------------------------------------------------------------
const SCALE_OPTIONS: { label: string; value: number }[] = [
  { label: '½×', value: 0.5 },
  { label: '1×', value: 1 },
  { label: '2×', value: 2 },
  { label: '3×', value: 3 },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ConsolidatedIngredient = {
  key: string
  ingredient_name: string
  unit: string
  totalQuantity: number
  totalGrams: number | null
  notes: string[]
  group_label?: string
}

type RecipeGroup = {
  item: GroceryListItem
  scaleFactor: number
}

// ---------------------------------------------------------------------------
// Consolidation logic
// ---------------------------------------------------------------------------
function consolidate(
  items: GroceryListItem[],
  scaleFactors: Record<string, number>
): ConsolidatedIngredient[] {
  const map = new Map<string, ConsolidatedIngredient>()

  for (const item of items) {
    if (!item.recipes) continue
    const sf = scaleFactors[item.id] ?? item.scale_factor
    const ingredients: RecipeIngredient[] = item.recipes.ingredients ?? []

    for (const ing of ingredients) {
      const key = `${ing.ingredient_name.toLowerCase()}__${(ing.unit ?? '').toLowerCase()}`
      const rawQty = parseFraction(ing.quantity ?? '0')
      const scaled = rawQty * sf

      if (map.has(key)) {
        const existing = map.get(key)!
        existing.totalQuantity += scaled
        if (ing.quantity_grams != null) {
          existing.totalGrams = (existing.totalGrams ?? 0) + ing.quantity_grams * sf
        }
        if (ing.notes) existing.notes.push(ing.notes)
      } else {
        map.set(key, {
          key,
          ingredient_name: ing.ingredient_name,
          unit: ing.unit ?? '',
          totalQuantity: scaled,
          totalGrams: ing.quantity_grams != null ? ing.quantity_grams * sf : null,
          notes: ing.notes ? [ing.notes] : [],
          group_label: ing.group_label,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.ingredient_name.localeCompare(b.ingredient_name)
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type Props = { groceryList: GroceryListFull }

export default function GroceryListView({ groceryList }: Props) {
  const [items, setItems] = useState<GroceryListItem[]>(groceryList.grocery_list_items)
  const [scaleFactors, setScaleFactors] = useState<Record<string, number>>(() =>
    Object.fromEntries(groceryList.grocery_list_items.map((i) => [i.id, i.scale_factor]))
  )
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      groceryList.grocery_list_checks.map((c) => [c.ingredient_name.toLowerCase(), c.is_checked])
    )
  )
  const [updatingCheck, setUpdatingCheck] = useState<string | null>(null)

  const consolidated = consolidate(items, scaleFactors)

  // -------------------------------------------------------------------------
  // Toggle check
  // -------------------------------------------------------------------------
  const toggleCheck = useCallback(async (ingredientName: string) => {
    const key = ingredientName.toLowerCase()
    const next = !checks[key]
    setChecks((prev) => ({ ...prev, [key]: next }))
    setUpdatingCheck(key)
    try {
      await fetch('/api/user/grocery-list/checks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grocery_list_id: groceryList.id,
          ingredient_name: ingredientName,
          is_checked: next,
        }),
      })
    } catch {
      // revert on failure
      setChecks((prev) => ({ ...prev, [key]: !next }))
    } finally {
      setUpdatingCheck(null)
    }
  }, [checks, groceryList.id])

  // -------------------------------------------------------------------------
  // Scale change
  // -------------------------------------------------------------------------
  function handleScaleChange(itemId: string, value: number) {
    setScaleFactors((prev) => ({ ...prev, [itemId]: value }))
    // Persist scale to server
    fetch(`/api/user/grocery-list/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scale_factor: value }),
    }).catch(() => {})
  }

  // -------------------------------------------------------------------------
  // Remove recipe
  // -------------------------------------------------------------------------
  async function handleRemoveRecipe(itemId: string) {
    try {
      await fetch(`/api/user/grocery-list/items/${itemId}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch {
      // silent
    }
  }

  // -------------------------------------------------------------------------
  // Clear completed
  // -------------------------------------------------------------------------
  function clearCompleted() {
    const unchecked: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(checks)) {
      if (!v) unchecked[k] = false
    }
    setChecks(unchecked)
  }

  // -------------------------------------------------------------------------
  // Clear all
  // -------------------------------------------------------------------------
  async function clearAll() {
    if (!confirm('Remove all recipes from your grocery list?')) return
    for (const item of items) {
      await fetch(`/api/user/grocery-list/items/${item.id}`, { method: 'DELETE' }).catch(() => {})
    }
    setItems([])
  }

  const checkedCount = consolidated.filter((i) => checks[i.ingredient_name.toLowerCase()]).length
  const totalCount = consolidated.length

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EBD2AD] bg-white text-[#6D5E6D] text-sm hover:border-[#C58930] hover:text-[#C58930] transition-colors duration-150"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        {checkedCount > 0 && (
          <button
            onClick={clearCompleted}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EBD2AD] bg-white text-[#6D5E6D] text-sm hover:border-[#C58930] hover:text-[#C58930] transition-colors duration-150"
          >
            <CheckCheck className="w-4 h-4" />
            Clear completed ({checkedCount})
          </button>
        )}
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EBD2AD] bg-white text-[#6D5E6D] text-sm hover:border-red-300 hover:text-red-600 transition-colors duration-150 ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---------------------------------------------------------------- */}
        {/* Left: Recipes (with scale) */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <h2
            className="text-lg font-bold text-[#201D20]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Recipes
          </h2>
          {items.map((item) => {
            if (!item.recipes) return null
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-[#EBD2AD] p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/recipes/${item.recipes.slug}`}
                    className="text-sm font-semibold text-[#201D20] hover:text-[#C58930] transition-colors duration-150 leading-tight"
                  >
                    {item.recipes.title}
                  </Link>
                  <button
                    onClick={() => handleRemoveRecipe(item.id)}
                    aria-label="Remove recipe"
                    className="p-1 rounded-md hover:bg-red-50 hover:text-red-600 text-[#6D5E6D] transition-colors duration-150 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scale factor */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#6D5E6D] mr-1">Scale:</span>
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleScaleChange(item.id, opt.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors duration-150 ${
                        (scaleFactors[item.id] ?? item.scale_factor) === opt.value
                          ? 'bg-[#C58930] border-[#C58930] text-white'
                          : 'border-[#EBD2AD] text-[#6D5E6D] hover:border-[#C58930] hover:text-[#C58930]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right: Consolidated ingredient list */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-lg font-bold text-[#201D20]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Ingredients
            </h2>
            <span className="text-xs text-[#6D5E6D]">
              {checkedCount}/{totalCount} checked
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD] overflow-hidden">
            {consolidated.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[#6D5E6D]">
                No ingredients to show.
              </div>
            )}
            {consolidated.map((ing) => {
              const key = ing.ingredient_name.toLowerCase()
              const isChecked = !!checks[key]
              const isUpdating = updatingCheck === key

              return (
                <label
                  key={ing.key}
                  className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#FCFFEB] transition-colors duration-100 ${
                    isChecked ? 'opacity-50' : ''
                  }`}
                >
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(ing.ingredient_name)}
                      disabled={isUpdating}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                        isChecked
                          ? 'bg-[#C58930] border-[#C58930]'
                          : 'border-[#EBD2AD] bg-white hover:border-[#C58930]'
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-medium text-[#201D20] ${isChecked ? 'line-through' : ''}`}
                    >
                      {ing.ingredient_name}
                    </span>
                    <div className="text-xs text-[#6D5E6D] mt-0.5 flex flex-wrap gap-2">
                      <span>
                        {formatQuantity(ing.totalQuantity)}{ing.unit ? ` ${ing.unit}` : ''}
                      </span>
                      {ing.totalGrams != null && ing.totalGrams > 0 && (
                        <span className="text-[#C58930]/80">
                          ({Math.round(ing.totalGrams)}g)
                        </span>
                      )}
                      {ing.notes.length > 0 && (
                        <span className="italic text-[#6D5E6D]/70">{ing.notes[0]}</span>
                      )}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mt-3 h-1.5 bg-[#EBD2AD] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C58930] rounded-full transition-all duration-300"
                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .grocery-print, .grocery-print * { visibility: visible; }
          .grocery-print { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  )
}
