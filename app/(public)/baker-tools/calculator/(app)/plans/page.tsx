'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useCalculatorStore } from '@/lib/calculator/store/use-calculator-store'
import { trackCalcEvent } from '@/lib/calculator/track'
import type { Plan } from '@/lib/calculator/types'
import { getErrorMessage } from '@/lib/calculator/error-message'

function emptyPlan(): Plan {
  return { id: crypto.randomUUID(), name: '', saleDate: null, feePresetId: null, frozenAt: null, frozenSnapshot: null, orders: [], onHand: [] }
}

export default function PlansPage() {
  const { store, loading } = useCalculatorStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [saleDate, setSaleDate] = useState('')

  const refresh = useCallback(async () => {
    setLoadError(null)
    try {
      const list = await store.listPlans()
      setPlans(list)
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Something went wrong loading your plans.'))
    } finally {
      setReady(true)
    }
  }, [store])

  // refresh is useCallback-memoized and owns its own try/catch/finally
  // (including setReady), so this is the standard fetch-on-mount effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!loading) refresh() }, [loading, refresh])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const plan = { ...emptyPlan(), name, saleDate: saleDate || null }
    await store.upsertPlan(plan)
    trackCalcEvent('calc_plan_created', {})
    window.location.href = `/baker-tools/calculator/plans/${plan.id}`
  }

  if (!ready) return <p className="text-sm text-[#6D5E6D]">Loading…</p>
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
        <span>Couldn&apos;t load your plans: {loadError}</span>
        <button onClick={() => refresh()} className="shrink-0 font-semibold hover:underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#201D20] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Plans</h1>
          <p className="text-sm text-[#6D5E6D]">Turn a list of orders into batches, a shopping list, and a profit and loss.</p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">
            New plan
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-[#C58930] p-5 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#6D5E6D] mb-1">Plan name</label>
            <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Saturday porch pickup"
              className="w-full px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C58930]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6D5E6D] mb-1">Sale date</label>
            <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
              className="px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C58930]" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225]">Create</button>
          <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg border border-[#EBD2AD] text-sm text-[#6D5E6D]">Cancel</button>
        </form>
      )}

      {plans.length === 0 && !creating ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#EBD2AD]">
          <p className="text-[#6D5E6D] text-sm">No plans yet. Create one for your next sale or market.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
          {plans.map((p) => (
            <Link key={p.id} href={`/baker-tools/calculator/plans/${p.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[#FCFFEB]">
              <div>
                <p className="text-sm font-medium text-[#201D20]">{p.name}</p>
                <p className="text-xs text-[#6D5E6D]">
                  {p.saleDate ? new Date(p.saleDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                  {' · '}{p.orders.length} order{p.orders.length === 1 ? '' : 's'}
                  {p.frozenAt && ' · frozen'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
