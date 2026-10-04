'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCalculatorStore } from '@/lib/calculator/store/use-calculator-store'
import { getFeePresets } from '@/lib/calculator/store/fee-presets'
import { computeProductPricing } from '@/lib/calculator/bridge'
import { formatMoney, formatPercent } from '@/lib/calculator/money'
import { UNIT_CODES, type UnitCode } from '@/lib/calculator/units'
import type { FeePreset, PantryItem, Product, ProductComponent, ProductPackagingLine, Recipe, Settings } from '@/lib/calculator/types'
import { DEFAULT_SETTINGS } from '@/lib/calculator/types'
import { getErrorMessage } from '@/lib/calculator/error-message'
import PriceCard from '@/components/baker-tools/calculator/PriceCard'
import HomebakedCta from '@/components/baker-tools/calculator/HomebakedCta'

const inputCls = 'px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] outline-none focus:ring-2 focus:ring-[#C58930]'
const labelCls = 'block text-xs font-medium text-[#6D5E6D] mb-1'

function emptyProduct(): Product {
  return { id: crypto.randomUUID(), name: '', extraMinutes: 0, targetMarginPct: null, feePresetId: null, setPrice: null, priceStep: null, countLaborAsCost: null, components: [], packaging: [] }
}

export default function ProductsPage() {
  const { store, loading } = useCalculatorStore()
  const [products, setProducts] = useState<Product[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [feePresets, setFeePresets] = useState<FeePreset[]>([])
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoadError(null)
    try {
      const supabase = createClient()
      const [p, r, pa, s, fp] = await Promise.all([
        store.listProducts(), store.listRecipes(), store.listPantryItems(), store.getSettings(), getFeePresets(supabase),
      ])
      setProducts(p)
      setRecipes(r)
      setPantryItems(pa)
      setSettings(s ?? DEFAULT_SETTINGS)
      setFeePresets(fp)
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Something went wrong loading your products.'))
    } finally {
      setReady(true)
    }
  }, [store])

  useEffect(() => { if (!loading) refresh() }, [loading, refresh])

  const recipesById = Object.fromEntries(recipes.map((r) => [r.id, r]))
  const pantryById = Object.fromEntries(pantryItems.map((p) => [p.id, p]))

  async function handleSave(product: Product) {
    await store.upsertProduct(product)
    setEditing(null)
    refresh()
  }

  async function handleDelete(id: string) {
    const result = await store.deleteProduct(id)
    if (!result.ok) { setBlockedMessage(`Can't delete — still used in: ${result.blockedBy.join(', ')}`); return }
    refresh()
  }

  if (!ready) return <p className="text-sm text-[#6D5E6D]">Loading…</p>
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
        <span>Couldn&apos;t load your products: {loadError}</span>
        <button onClick={() => refresh()} className="shrink-0 font-semibold hover:underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#201D20] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Products</h1>
          <p className="text-sm text-[#6D5E6D]">Turn a recipe into something you sell, with a price that covers your real costs.</p>
        </div>
        {!editing && recipes.length > 0 && (
          <button onClick={() => setEditing(emptyProduct())} className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">
            Add product
          </button>
        )}
      </div>

      {recipes.length === 0 && !editing && (
        <div className="bg-[#F5EAC8] border border-[#C58930]/30 rounded-xl px-4 py-3 text-sm text-[#201D20]">
          Add a recipe first — products are built from one or more recipes.
        </div>
      )}

      {blockedMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 flex items-center justify-between">
          <span>{blockedMessage}</span>
          <button onClick={() => setBlockedMessage(null)} className="font-semibold">Dismiss</button>
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing} recipes={recipes} pantryItems={pantryItems} settings={settings} feePresets={feePresets}
          onSave={handleSave} onCancel={() => setEditing(null)}
        />
      )}

      {products.length > 0 && (
        <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
          {products.map((p) => {
            const pricing = computeProductPricing(p, recipesById, pantryById, settings, feePresets)
            const price = p.setPrice ?? (pricing.suggested.ok ? pricing.suggested.suggestedPrice.toNumber() : null)
            const outputs = price != null ? pricing.outputsAtPrice(price) : null
            const belowTarget = outputs && outputs.margin.lt(pricing.cost.ok ? (p.targetMarginPct ?? settings.defaultMarginPct) : 0)
            return (
              <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#201D20] truncate">{p.name}</p>
                  <p className="text-xs text-[#6D5E6D]">
                    {!pricing.cost.ok ? <span className="text-amber-700">incomplete cost</span>
                      : !pricing.suggested.ok ? <span className="text-red-600">fees + margin too high</span>
                      : <>{price != null ? formatMoney(outputs!.price) : '—'} · {outputs ? formatPercent(outputs.margin) : '—'} margin · {outputs?.effectiveHourlyWage ? formatMoney(outputs.effectiveHourlyWage) + '/hr' : '—'}
                        {belowTarget && <span className="text-amber-700"> · below target margin</span>}</>}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing(p)} className="text-xs font-medium text-[#C58930] hover:underline">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProductForm({
  product, recipes, pantryItems, settings, feePresets, onSave, onCancel,
}: {
  product: Product
  recipes: Recipe[]
  pantryItems: PantryItem[]
  settings: Settings
  feePresets: FeePreset[]
  onSave: (product: Product) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(product)
  const recipesById = Object.fromEntries(recipes.map((r) => [r.id, r]))
  const pantryById = Object.fromEntries(pantryItems.map((p) => [p.id, p]))
  const pricing = computeProductPricing(draft, recipesById, pantryById, settings, feePresets)

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function addComponent() {
    const recipeId = recipes[0]?.id
    if (!recipeId) return
    const comp: ProductComponent = { id: crypto.randomUUID(), recipeId, qty: 1, sortOrder: draft.components.length }
    update('components', [...draft.components, comp])
  }
  function updateComponent(id: string, patch: Partial<ProductComponent>) {
    update('components', draft.components.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }
  function removeComponent(id: string) {
    update('components', draft.components.filter((c) => c.id !== id))
  }

  function addPackaging() {
    const pantryItemId = pantryItems[0]?.id
    if (!pantryItemId) return
    const line: ProductPackagingLine = { id: crypto.randomUUID(), pantryItemId, qty: 1, unit: 'each' }
    update('packaging', [...draft.packaging, line])
  }
  function updatePackaging(id: string, patch: Partial<ProductPackagingLine>) {
    update('packaging', draft.packaging.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }
  function removePackaging(id: string) {
    update('packaging', draft.packaging.filter((p) => p.id !== id))
  }

  const marginPctDisplay = draft.targetMarginPct != null ? Math.round(draft.targetMarginPct * 100) : ''

  return (
    <div className="grid lg:grid-cols-[1fr,360px] gap-5 items-start">
      <form onSubmit={(e) => { e.preventDefault(); onSave(draft) }} className="bg-white rounded-xl border border-[#C58930] p-5 space-y-5">
        <div>
          <label className={labelCls}>Product name</label>
          <input required className={inputCls + ' w-full'} value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Box of 6 cookies" />
        </div>

        <div className="space-y-2">
          <label className={labelCls}>Recipe components</label>
          {draft.components.map((c) => (
            <div key={c.id} className="flex gap-2 items-center bg-[#FCFFEB] border border-[#EBD2AD] rounded-lg p-2">
              <select className={inputCls + ' flex-1'} value={c.recipeId} onChange={(e) => updateComponent(c.id, { recipeId: e.target.value })}>
                {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <input type="number" min="0.0001" step="any" className={inputCls + ' w-24'} value={c.qty} onChange={(e) => updateComponent(c.id, { qty: Number(e.target.value) })} />
              <span className="text-xs text-[#6D5E6D] shrink-0 w-24 truncate">{recipesById[c.recipeId]?.yieldUnitLabel}</span>
              <button type="button" onClick={() => removeComponent(c.id)} className="text-red-500 text-xs px-2">✕</button>
            </div>
          ))}
          <button type="button" onClick={addComponent} className="text-sm text-[#C58930] font-medium hover:underline">+ Add recipe component</button>
        </div>

        <div className="space-y-2">
          <label className={labelCls}>Packaging</label>
          {draft.packaging.map((p) => (
            <div key={p.id} className="flex gap-2 items-center bg-[#FCFFEB] border border-[#EBD2AD] rounded-lg p-2">
              <select className={inputCls + ' flex-1'} value={p.pantryItemId} onChange={(e) => updatePackaging(p.id, { pantryItemId: e.target.value })}>
                {pantryItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input type="number" min="0.0001" step="any" className={inputCls + ' w-20'} value={p.qty} onChange={(e) => updatePackaging(p.id, { qty: Number(e.target.value) })} />
              <select className={inputCls + ' w-24'} value={p.unit} onChange={(e) => updatePackaging(p.id, { unit: e.target.value as UnitCode })}>
                {UNIT_CODES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <button type="button" onClick={() => removePackaging(p.id)} className="text-red-500 text-xs px-2">✕</button>
            </div>
          ))}
          <button type="button" onClick={addPackaging} className="text-sm text-[#C58930] font-medium hover:underline">+ Add packaging</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 border-t border-[#EBD2AD] pt-4">
          <div>
            <label className={labelCls}>Extra minutes (boxing, decorating)</label>
            <input type="number" min="0" step="1" className={inputCls + ' w-full'} value={draft.extraMinutes} onChange={(e) => update('extraMinutes', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Target margin — override (%)</label>
            <input type="number" min="0" max="90" step="1" className={inputCls + ' w-full'} value={marginPctDisplay}
              placeholder={`default ${Math.round(settings.defaultMarginPct * 100)}%`}
              onChange={(e) => update('targetMarginPct', e.target.value ? Number(e.target.value) / 100 : null)} />
          </div>
          <div>
            <label className={labelCls}>Payment method — override</label>
            <select className={inputCls + ' w-full'} value={draft.feePresetId ?? ''} onChange={(e) => update('feePresetId', e.target.value || null)}>
              <option value="">Use default</option>
              {feePresets.map((fp) => <option key={fp.id} value={fp.id}>{fp.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Set your own price (optional)</label>
            <input type="number" min="0" step="0.01" className={inputCls + ' w-full'} value={draft.setPrice ?? ''}
              placeholder="use suggested price"
              onChange={(e) => update('setPrice', e.target.value ? Number(e.target.value) : null)} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">Save product</button>
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-[#EBD2AD] text-sm text-[#6D5E6D]">Cancel</button>
        </div>
      </form>

      <div className="space-y-4 lg:sticky lg:top-4">
        <PriceCard pricing={pricing} />
        {pricing.cost.ok && pricing.suggested.ok && <HomebakedCta placement="price_card" />}
      </div>
    </div>
  )
}
