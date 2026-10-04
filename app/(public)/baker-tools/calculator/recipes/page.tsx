'use client'

import { useCallback, useEffect, useState } from 'react'
import { useCalculatorStore } from '@/lib/calculator/store/use-calculator-store'
import { computeRecipeBatch } from '@/lib/calculator/bridge'
import { UNIT_CODES, type UnitCode } from '@/lib/calculator/units'
import type { PantryItem, Recipe, RecipeLine } from '@/lib/calculator/types'
import IngredientLinePicker from '@/components/baker-tools/calculator/IngredientLinePicker'

const inputCls = 'px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] outline-none focus:ring-2 focus:ring-[#C58930]'
const labelCls = 'block text-xs font-medium text-[#6D5E6D] mb-1'

function emptyRecipe(): Recipe {
  return { id: crypto.randomUUID(), name: '', yieldQty: 1, yieldUnitLabel: '', activeMinutes: 0, batchIncrement: 1, notes: null, lines: [] }
}

function emptyLine(): RecipeLine {
  return { id: crypto.randomUUID(), pantryItemId: '', qty: 1, unit: 'g', note: null, sortOrder: 0 }
}

export default function RecipesPage() {
  const { store, loading } = useCalculatorStore()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [ready, setReady] = useState(false)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [r, p] = await Promise.all([store.listRecipes(), store.listPantryItems()])
    setRecipes(r)
    setPantryItems(p)
    setReady(true)
  }, [store])

  useEffect(() => { if (!loading) refresh() }, [loading, refresh])

  const pantryById = Object.fromEntries(pantryItems.map((p) => [p.id, p]))

  async function handleSave(recipe: Recipe) {
    await store.upsertRecipe(recipe)
    setEditing(null)
    refresh()
  }

  async function handleDelete(id: string) {
    const result = await store.deleteRecipe(id)
    if (!result.ok) { setBlockedMessage(`Can't delete — still used in: ${result.blockedBy.join(', ')}`); return }
    refresh()
  }

  if (!ready) return <p className="text-sm text-[#6D5E6D]">Loading…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#201D20] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Recipes</h1>
          <p className="text-sm text-[#6D5E6D]">Build recipes from your pantry and see the true batch cost.</p>
        </div>
        {!editing && pantryItems.length > 0 && (
          <button onClick={() => setEditing(emptyRecipe())} className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">
            Add recipe
          </button>
        )}
      </div>

      {pantryItems.length === 0 && !editing && (
        <div className="bg-[#F5EAC8] border border-[#C58930]/30 rounded-xl px-4 py-3 text-sm text-[#201D20]">
          Add a few pantry items first — recipes are built from what&apos;s in your pantry.
        </div>
      )}

      {blockedMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 flex items-center justify-between">
          <span>{blockedMessage}</span>
          <button onClick={() => setBlockedMessage(null)} className="font-semibold">Dismiss</button>
        </div>
      )}

      {editing && (
        <RecipeForm
          recipe={editing}
          pantryItems={pantryItems}
          onPantryItemsChange={setPantryItems}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {recipes.length > 0 && (
        <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
          {recipes.map((r) => {
            const batch = computeRecipeBatch(r, pantryById)
            return (
              <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#201D20] truncate">{r.name}</p>
                  <p className="text-xs text-[#6D5E6D]">
                    Yields {r.yieldQty} {r.yieldUnitLabel} ·{' '}
                    {batch.ok
                      ? <>batch ${batch.batchCost.toDecimalPlaces(2).toString()} · ${batch.unitCost!.toDecimalPlaces(4).toString()}/unit</>
                      : <span className="text-amber-700">incomplete — missing {batch.missingLineIds.length} line{batch.missingLineIds.length === 1 ? '' : 's'}</span>}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing(r)} className="text-xs font-medium text-[#C58930] hover:underline">Edit</button>
                  <button onClick={() => handleDelete(r.id)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RecipeForm({
  recipe, pantryItems, onPantryItemsChange, onSave, onCancel,
}: {
  recipe: Recipe
  pantryItems: PantryItem[]
  onPantryItemsChange: (items: PantryItem[]) => void
  onSave: (recipe: Recipe) => void
  onCancel: () => void
}) {
  const { store } = useCalculatorStore()
  const [draft, setDraft] = useState(recipe)
  const pantryById = Object.fromEntries(pantryItems.map((p) => [p.id, p]))
  const batch = computeRecipeBatch(draft, pantryById)

  function update<K extends keyof Recipe>(key: K, value: Recipe[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function updateLine(id: string, patch: Partial<RecipeLine>) {
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
  }

  function removeLine(id: string) {
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== id) }))
  }

  function addLine() {
    setDraft((d) => ({ ...d, lines: [...d.lines, { ...emptyLine(), sortOrder: d.lines.length }] }))
  }

  async function createPantryItemFromLibrary(lineId: string, ingredient: { id: string; name: string; gramsPerCup: number | null; gramsPerEach: number | null }) {
    const newItem: PantryItem = {
      id: crypto.randomUUID(), ingredientId: ingredient.id, name: ingredient.name, kind: 'ingredient',
      packageQty: 1, packageUnit: 'each', packagePrice: 0, usableYieldPct: 100,
      gramsPerCup: ingredient.gramsPerCup, gramsPerEach: ingredient.gramsPerEach, notes: null,
    }
    await store.upsertPantryItem(newItem)
    onPantryItemsChange([...pantryItems, newItem])
    updateLine(lineId, { pantryItemId: newItem.id })
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(draft) }} className="bg-white rounded-xl border border-[#C58930] p-5 space-y-5">
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Recipe name</label>
          <input required className={inputCls + ' w-full'} value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Chocolate Chip Cookies" />
        </div>
        <div>
          <label className={labelCls}>Yield quantity</label>
          <input type="number" min="0.01" step="any" required className={inputCls + ' w-full'} value={draft.yieldQty} onChange={(e) => update('yieldQty', Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Yield unit</label>
          <input required className={inputCls + ' w-full'} value={draft.yieldUnitLabel} onChange={(e) => update('yieldUnitLabel', e.target.value)} placeholder="cookies" />
        </div>
        <div>
          <label className={labelCls}>Active minutes / batch</label>
          <input type="number" min="0" step="1" className={inputCls + ' w-full'} value={draft.activeMinutes} onChange={(e) => update('activeMinutes', Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Batch increment</label>
          <select className={inputCls + ' w-full'} value={draft.batchIncrement} onChange={(e) => update('batchIncrement', Number(e.target.value))}>
            <option value={1}>Whole batches only</option>
            <option value={0.5}>Allow half batches</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>Ingredients</label>
        {draft.lines.map((line) => {
          const pantryItem = pantryById[line.pantryItemId]
          return (
            <div key={line.id} className="flex gap-2 items-start bg-[#FCFFEB] border border-[#EBD2AD] rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <IngredientLinePicker
                  pantryItems={pantryItems}
                  selectedPantryItemId={line.pantryItemId || null}
                  onSelectPantryItem={(id) => updateLine(line.id, { pantryItemId: id })}
                  onCreateFromLibrary={(ing) => createPantryItemFromLibrary(line.id, ing)}
                />
                {pantryItem && pantryItem.packagePrice === 0 && (
                  <p className="text-xs text-amber-700 mt-1">Added from the ingredient library — edit it in Pantry to add what you paid.</p>
                )}
              </div>
              <input type="number" min="0.0001" step="any" className={inputCls + ' w-20'} value={line.qty} onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) })} />
              <select className={inputCls + ' w-24'} value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value as UnitCode })}>
                {UNIT_CODES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <button type="button" onClick={() => removeLine(line.id)} className="text-red-500 text-xs px-2 py-2">✕</button>
            </div>
          )
        })}
        <button type="button" onClick={addLine} className="text-sm text-[#C58930] font-medium hover:underline">+ Add ingredient line</button>
      </div>

      <p className="text-sm text-[#6D5E6D] border-t border-[#EBD2AD] pt-3">
        {batch.ok
          ? <>Batch cost: <span className="font-semibold text-[#201D20]">${batch.batchCost.toDecimalPlaces(2).toString()}</span> — ${batch.unitCost!.toDecimalPlaces(4).toString()} per {draft.yieldUnitLabel || 'unit'}</>
          : draft.lines.length === 0
            ? 'Add ingredient lines to see batch cost.'
            : `Can't cost this recipe yet — ${batch.missingLineIds.length} line(s) need pricing or a conversion.`}
      </p>

      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">Save recipe</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-[#EBD2AD] text-sm text-[#6D5E6D]">Cancel</button>
      </div>
    </form>
  )
}
