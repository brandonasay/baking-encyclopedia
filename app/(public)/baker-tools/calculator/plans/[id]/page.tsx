'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Decimal from 'decimal.js'
import { createClient } from '@/lib/supabase/client'
import { useCalculatorStore } from '@/lib/calculator/store/use-calculator-store'
import { getFeePresets } from '@/lib/calculator/store/fee-presets'
import { computePlanSummary, deserializePlanSummary, resolveOrderLinePrice, serializePlanSummary, type SerializedPlanSummary } from '@/lib/calculator/bridge'
import { formatMoney } from '@/lib/calculator/money'
import { trackCalcEvent } from '@/lib/calculator/track'
import { DEFAULT_SETTINGS, type FeePreset, type PantryItem, type Plan, type PlanOrder, type PlanOrderLine, type Product, type Recipe, type Settings } from '@/lib/calculator/types'
import HomebakedCta from '@/components/baker-tools/calculator/HomebakedCta'

const inputCls = 'px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] outline-none focus:ring-2 focus:ring-[#C58930]'

const TABS = ['Orders', 'Batches', 'Shopping', 'P&L'] as const
type Tab = (typeof TABS)[number]

function emptyOrder(sortOrder: number): PlanOrder {
  return { id: crypto.randomUUID(), customerLabel: null, note: null, sortOrder, lines: [] }
}

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { store, loading } = useCalculatorStore()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [feePresets, setFeePresets] = useState<FeePreset[]>([])
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('Orders')
  const [copyLabel, setCopyLabel] = useState('Copy list')

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const [p, pr, r, pa, s, fp] = await Promise.all([
      store.getPlan(id), store.listProducts(), store.listRecipes(), store.listPantryItems(), store.getSettings(), getFeePresets(supabase),
    ])
    setPlan(p)
    setProducts(pr)
    setRecipes(r)
    setPantryItems(pa)
    setSettings(s ?? DEFAULT_SETTINGS)
    setFeePresets(fp)
    setReady(true)
  }, [store, id])

  useEffect(() => { if (!loading) refresh() }, [loading, refresh])

  useEffect(() => { if (tab === 'P&L') trackCalcEvent('calc_plan_viewed_pnl', { order_count: plan?.orders.length ?? 0, product_count: products.length }) }, [tab, plan, products.length])

  async function save(updated: Plan) {
    setPlan(updated)
    await store.upsertPlan(updated)
  }

  if (!ready || !plan) return <p className="text-sm text-[#6D5E6D]">Loading…</p>

  const productsById = Object.fromEntries(products.map((p) => [p.id, p]))
  const recipesById = Object.fromEntries(recipes.map((r) => [r.id, r]))
  const pantryById = Object.fromEntries(pantryItems.map((p) => [p.id, p]))

  const live = computePlanSummary(plan, productsById, recipesById, pantryById, settings, feePresets)
  const frozen = plan.frozenAt && plan.frozenSnapshot ? deserializePlanSummary(plan.frozenSnapshot as unknown as SerializedPlanSummary) : null
  const summary = frozen ?? live
  const salePassed = plan.saleDate != null && new Date(plan.saleDate + 'T23:59:59') < new Date()

  async function freeze() {
    if (!plan) return
    await save({ ...plan, frozenAt: new Date().toISOString(), frozenSnapshot: serializePlanSummary(live) as unknown as Plan['frozenSnapshot'] })
  }
  async function unfreeze() {
    if (!plan) return
    await save({ ...plan, frozenAt: null, frozenSnapshot: null })
  }

  async function copyList() {
    if (!summary.ok) return
    const unchecked = summary.shopping.filter((s) => !s.checked && s.packagesToBuy.toNumber() > 0)
    const text = unchecked.map((s) => `${s.packagesToBuy.toString()}x ${s.pantryItem.name} (${formatMoney(s.estimatedSpend)})`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopyLabel('Copied!')
      trackCalcEvent('calc_shopping_list_copied', { item_count: unchecked.length })
      setTimeout(() => setCopyLabel('Copy list'), 2000)
    } catch {
      setCopyLabel('Copy failed')
    }
  }

  async function toggleChecked(pantryItemId: string, checked: boolean) {
    if (!plan) return
    const existing = plan.onHand.find((h) => h.pantryItemId === pantryItemId)
    const item = pantryById[pantryItemId]
    const onHand = existing
      ? plan.onHand.map((h) => (h.pantryItemId === pantryItemId ? { ...h, checked } : h))
      : [...plan.onHand, { pantryItemId, qty: 0, unit: item.packageUnit, checked }]
    await save({ ...plan, onHand })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#201D20] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>{plan.name}</h1>
        <p className="text-sm text-[#6D5E6D]">{plan.saleDate ? new Date(plan.saleDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'No sale date set'}</p>
      </div>

      {salePassed && !plan.frozenAt && (
        <div className="bg-[#F5EAC8] border border-[#C58930]/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-[#201D20]">This plan&apos;s sale date has passed. Freeze it to keep these numbers even if your pantry prices change later.</span>
          <button onClick={freeze} className="shrink-0 px-3 py-1.5 rounded-lg bg-[#C58930] text-white font-semibold hover:bg-[#A87225]">Freeze</button>
        </div>
      )}
      {plan.frozenAt && (
        <div className="bg-[#EEF3EA] border border-[#B5C9A8] rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm text-[#41622D]">
          <span>Frozen on {new Date(plan.frozenAt).toLocaleDateString()} — these numbers won&apos;t change if pantry prices do.</span>
          <button onClick={unfreeze} className="shrink-0 font-semibold hover:underline">Unfreeze</button>
        </div>
      )}

      <div className="flex gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-[#C58930] text-white' : 'bg-white border border-[#EBD2AD] text-[#6D5E6D] hover:text-[#201D20]'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Orders' && (
        <OrdersTab
          plan={plan} products={products} recipesById={recipesById} pantryById={pantryById} settings={settings} feePresets={feePresets}
          onChange={save}
        />
      )}

      {tab === 'Batches' && (
        <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
          {!summary.ok ? (
            <p className="p-4 text-sm text-amber-700">{summary.incompleteReason ?? 'Add orders to see batches.'}</p>
          ) : summary.batches.length === 0 ? (
            <p className="p-4 text-sm text-[#6D5E6D]">No orders yet.</p>
          ) : (
            summary.batches.map((b) => (
              <div key={b.recipeId} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#201D20]">{recipesById[b.recipeId]?.name ?? b.recipeId}</span>
                <span className="text-sm text-[#6D5E6D]">
                  {b.batches.toString()} batch{b.batches.toNumber() === 1 ? '' : 'es'} = {b.unitsProduced.toString()} {recipesById[b.recipeId]?.yieldUnitLabel}
                  {b.surplus.gt(0) && <>, {b.surplus.toString()} extra</>}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'Shopping' && summary.ok && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={copyList} className="text-sm text-[#C58930] font-medium hover:underline">{copyLabel}</button>
          </div>
          {(['ingredient', 'packaging', 'other'] as const).map((kind) => {
            const rows = summary.shopping.filter((s) => s.pantryItem.kind === kind && !s.fullyCovered)
            if (rows.length === 0) return null
            return (
              <div key={kind}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6D5E6D] mb-2">{kind === 'ingredient' ? 'Ingredients' : kind === 'packaging' ? 'Packaging' : 'Other'}</h3>
                <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
                  {rows.map((s) => (
                    <label key={s.pantryItemId} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer">
                      <input type="checkbox" checked={s.checked} onChange={(e) => toggleChecked(s.pantryItemId, e.target.checked)} className="accent-[#C58930]" />
                      <span className={`flex-1 text-sm ${s.checked ? 'line-through text-[#6D5E6D]' : 'text-[#201D20]'}`}>{s.pantryItem.name}</span>
                      <span className="text-sm text-[#6D5E6D]">{s.packagesToBuy.toString()} pkg</span>
                      <span className="text-sm font-medium text-[#201D20] w-16 text-right">{formatMoney(s.estimatedSpend)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
          {summary.shopping.some((s) => s.fullyCovered) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6D5E6D] mb-2">Already have</h3>
              <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
                {summary.shopping.filter((s) => s.fullyCovered).map((s) => (
                  <div key={s.pantryItemId} className="px-4 py-2.5 text-sm text-[#6D5E6D]">{s.pantryItem.name}</div>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-[#201D20] font-medium">
            Estimated spend at the store: {formatMoney(summary.shopping.reduce((sum, s) => sum.plus(s.estimatedSpend), new Decimal(0)))}
          </p>
        </div>
      )}

      {tab === 'P&L' && summary.ok && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
            <PnlRow label="Revenue" value={formatMoney(summary.pnl.revenue)} />
            <PnlRow label="Payment fees" value={`-${formatMoney(summary.pnl.fees)}`} />
            <PnlRow label="Ingredients used" value={`-${formatMoney(summary.pnl.ingredientsUsed)}`} />
            <PnlRow label="Packaging" value={`-${formatMoney(summary.pnl.packaging)}`} />
            <PnlRow label="Labor" value={`-${formatMoney(summary.pnl.laborCost)}`} sub={`${summary.pnl.laborHours.toDecimalPlaces(2).toString()} hours`} />
            <PnlRow label="Overhead" value={`-${formatMoney(summary.pnl.overhead)}`} />
            <PnlRow label="Profit" value={formatMoney(summary.pnl.profit)} bold negative={summary.pnl.profit.isNegative()} />
            <PnlRow label="Effective hourly wage" value={summary.pnl.effectiveHourlyWage ? formatMoney(summary.pnl.effectiveHourlyWage) : '—'} />
          </div>
          <HomebakedCta placement="plan_pnl" />
        </div>
      )}
      {tab === 'P&L' && !summary.ok && <p className="text-sm text-amber-700">{summary.incompleteReason ?? 'Add orders to see profit and loss.'}</p>}
    </div>
  )
}

function PnlRow({ label, value, sub, bold, negative }: { label: string; value: string; sub?: string; bold?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className={`text-sm ${bold ? 'font-semibold text-[#201D20]' : 'text-[#6D5E6D]'}`}>{label}{sub && <span className="text-xs text-[#6D5E6D] ml-1.5">({sub})</span>}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${negative ? 'text-red-600' : 'text-[#201D20]'}`}>{value}</span>
    </div>
  )
}

function OrdersTab({
  plan, products, recipesById, pantryById, settings, feePresets, onChange,
}: {
  plan: Plan
  products: Product[]
  recipesById: Record<string, Recipe>
  pantryById: Record<string, PantryItem>
  settings: Settings
  feePresets: FeePreset[]
  onChange: (plan: Plan) => void
}) {
  function addOrder() {
    onChange({ ...plan, orders: [...plan.orders, emptyOrder(plan.orders.length)] })
  }
  function updateOrder(id: string, patch: Partial<PlanOrder>) {
    onChange({ ...plan, orders: plan.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  }
  function removeOrder(id: string) {
    onChange({ ...plan, orders: plan.orders.filter((o) => o.id !== id) })
  }
  function addLine(orderId: string) {
    const productId = products[0]?.id
    if (!productId) return
    const line: PlanOrderLine = { id: crypto.randomUUID(), productId, qty: 1, unitPriceOverride: null }
    updateOrder(orderId, { lines: [...(plan.orders.find((o) => o.id === orderId)?.lines ?? []), line] })
  }
  function updateLine(orderId: string, lineId: string, patch: Partial<PlanOrderLine>) {
    const order = plan.orders.find((o) => o.id === orderId)
    if (!order) return
    updateOrder(orderId, { lines: order.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) })
  }
  function removeLine(orderId: string, lineId: string) {
    const order = plan.orders.find((o) => o.id === orderId)
    if (!order) return
    updateOrder(orderId, { lines: order.lines.filter((l) => l.id !== lineId) })
  }

  if (products.length === 0) {
    return <div className="bg-[#F5EAC8] border border-[#C58930]/30 rounded-xl px-4 py-3 text-sm text-[#201D20]">Add a product first — orders are made of products.</div>
  }

  return (
    <div className="space-y-4">
      {plan.orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl border border-[#EBD2AD] p-4 space-y-3">
          <div className="flex gap-2 items-center">
            <input
              className={inputCls + ' flex-1'} placeholder="Customer (optional)"
              value={order.customerLabel ?? ''} onChange={(e) => updateOrder(order.id, { customerLabel: e.target.value || null })}
            />
            <button onClick={() => removeOrder(order.id)} className="text-red-500 text-xs px-2">Remove order</button>
          </div>
          {order.lines.map((line) => {
            const product = products.find((p) => p.id === line.productId)
            const resolvedPrice = product ? resolveOrderLinePrice(product, line.unitPriceOverride, recipesById, pantryById, settings, feePresets) : null
            return (
              <div key={line.id} className="flex gap-2 items-center bg-[#FCFFEB] border border-[#EBD2AD] rounded-lg p-2">
                <select className={inputCls + ' flex-1'} value={line.productId} onChange={(e) => updateLine(order.id, line.id, { productId: e.target.value })}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" step="1" className={inputCls + ' w-16'} value={line.qty} onChange={(e) => updateLine(order.id, line.id, { qty: Number(e.target.value) })} />
                <input
                  type="number" min="0" step="0.01" className={inputCls + ' w-24'}
                  placeholder={resolvedPrice ? resolvedPrice.toFixed(2) : '—'}
                  value={line.unitPriceOverride ?? ''}
                  onChange={(e) => updateLine(order.id, line.id, { unitPriceOverride: e.target.value ? Number(e.target.value) : null })}
                />
                <button onClick={() => removeLine(order.id, line.id)} className="text-red-500 text-xs px-2">✕</button>
              </div>
            )
          })}
          <button onClick={() => addLine(order.id)} className="text-sm text-[#C58930] font-medium hover:underline">+ Add product</button>
        </div>
      ))}
      <button onClick={addOrder} className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">+ Add order</button>
    </div>
  )
}
