'use client'

import { useCallback, useEffect, useState } from 'react'
import { useCalculatorStore } from '@/lib/calculator/store/use-calculator-store'
import { costPerBaseUnit } from '@/lib/calculator/costing'
import { toEnginePantryItem } from '@/lib/calculator/bridge'
import { UNIT_CODES, type UnitCode } from '@/lib/calculator/units'
import type { PantryItem, PantryKind } from '@/lib/calculator/types'

const inputCls = 'w-full px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] outline-none focus:ring-2 focus:ring-[#C58930]'
const labelCls = 'block text-xs font-medium text-[#6D5E6D] mb-1'

function emptyItem(): PantryItem {
  return {
    id: crypto.randomUUID(), ingredientId: null, name: '', kind: 'ingredient',
    packageQty: 1, packageUnit: 'each', packagePrice: 0, usableYieldPct: 100,
    gramsPerCup: null, gramsPerEach: null, notes: null,
  }
}

export default function PantryPage() {
  const { store, loading } = useCalculatorStore()
  const [items, setItems] = useState<PantryItem[]>([])
  const [ready, setReady] = useState(false)
  const [editing, setEditing] = useState<PantryItem | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const list = await store.listPantryItems()
    setItems(list)
    setReady(true)
  }, [store])

  useEffect(() => { if (!loading) refresh() }, [loading, refresh])

  async function handleSave(item: PantryItem) {
    await store.upsertPantryItem(item)
    setEditing(null)
    refresh()
  }

  async function handleDelete(id: string) {
    const result = await store.deletePantryItem(id)
    if (!result.ok) {
      setBlockedMessage(`Can't delete — still used in: ${result.blockedBy.join(', ')}`)
      return
    }
    refresh()
  }

  if (!ready) return <p className="text-sm text-[#6D5E6D]">Loading…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#201D20] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Pantry</h1>
          <p className="text-sm text-[#6D5E6D]">What you bought, and what you paid for it.</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(emptyItem())} className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">
            Add item
          </button>
        )}
      </div>

      {blockedMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 flex items-center justify-between">
          <span>{blockedMessage}</span>
          <button onClick={() => setBlockedMessage(null)} className="font-semibold">Dismiss</button>
        </div>
      )}

      {editing && <PantryItemForm item={editing} onSave={handleSave} onCancel={() => setEditing(null)} />}

      {items.length === 0 && !editing ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#EBD2AD]">
          <p className="text-[#6D5E6D] text-sm">Nothing here yet. Add what you buy — flour, butter, boxes, labels — with the package size and price you paid.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
          {items.map((item) => <PantryRow key={item.id} item={item} onEdit={() => setEditing(item)} onDelete={() => handleDelete(item.id)} />)}
        </div>
      )}
    </div>
  )
}

function PantryRow({ item, onEdit, onDelete }: { item: PantryItem; onEdit: () => void; onDelete: () => void }) {
  const costResult = costPerBaseUnit(toEnginePantryItem(item))
  const costLabel = costResult.ok
    ? `$${costResult.costPerBaseUnit.toDecimalPlaces(6).toString()} / ${costResult.baseUnit}`
    : 'invalid package'

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#201D20] truncate">{item.name}</p>
        <p className="text-xs text-[#6D5E6D]">
          {item.packageQty} {item.packageUnit} · ${item.packagePrice.toFixed(2)} · {costLabel}
          {item.usableYieldPct < 100 && ` · ${item.usableYieldPct}% usable`}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onEdit} className="text-xs font-medium text-[#C58930] hover:underline">Edit</button>
        <button onClick={onDelete} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
      </div>
    </div>
  )
}

function PantryItemForm({ item, onSave, onCancel }: { item: PantryItem; onSave: (item: PantryItem) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(item)
  const previewCost = costPerBaseUnit(toEnginePantryItem(draft))

  function update<K extends keyof PantryItem>(key: K, value: PantryItem[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(draft) }}
      className="bg-white rounded-xl border border-[#C58930] p-5 space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Name</label>
          <input required className={inputCls} value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. All-purpose flour" />
        </div>
        <div>
          <label className={labelCls}>Kind</label>
          <select className={inputCls} value={draft.kind} onChange={(e) => update('kind', e.target.value as PantryKind)}>
            <option value="ingredient">Ingredient</option>
            <option value="packaging">Packaging</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Usable yield (%)</label>
          <input type="number" min="1" max="100" step="1" className={inputCls} value={draft.usableYieldPct}
            onChange={(e) => update('usableYieldPct', Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Package quantity</label>
          <input type="number" min="0.0001" step="any" required className={inputCls} value={draft.packageQty}
            onChange={(e) => update('packageQty', Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Package unit</label>
          <select className={inputCls} value={draft.packageUnit} onChange={(e) => update('packageUnit', e.target.value as UnitCode)}>
            {UNIT_CODES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Price paid for that package ($)</label>
          <input type="number" min="0" step="0.01" required className={inputCls} value={draft.packagePrice}
            onChange={(e) => update('packagePrice', Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Grams per cup (optional)</label>
          <input type="number" min="0" step="any" className={inputCls} value={draft.gramsPerCup ?? ''}
            onChange={(e) => update('gramsPerCup', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 120" />
          <p className="text-xs text-[#6D5E6D] mt-1">Needed if a recipe measures this in cups/tsp/tbsp but you buy it by weight.</p>
        </div>
        <div>
          <label className={labelCls}>Grams per each (optional)</label>
          <input type="number" min="0" step="any" className={inputCls} value={draft.gramsPerEach ?? ''}
            onChange={(e) => update('gramsPerEach', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 50" />
        </div>
      </div>

      <p className="text-sm text-[#6D5E6D]">
        {previewCost.ok
          ? <>Cost: <span className="font-semibold text-[#201D20]">${previewCost.costPerBaseUnit.toDecimalPlaces(6).toString()} / {previewCost.baseUnit}</span></>
          : 'Enter a package quantity and price to see cost per unit.'}
      </p>

      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-[#EBD2AD] text-sm text-[#6D5E6D]">Cancel</button>
      </div>
    </form>
  )
}

