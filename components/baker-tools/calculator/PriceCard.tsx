'use client'

import { useEffect, useRef, useState } from 'react'
import Decimal from 'decimal.js'
import type { ProductPricing } from '@/lib/calculator/bridge'
import { formatMoney, formatPercent } from '@/lib/calculator/money'
import { trackCalcEvent } from '@/lib/calculator/track'

export default function PriceCard({ pricing }: { pricing: ProductPricing }) {
  const [customPrice, setCustomPrice] = useState('')
  const { cost, suggested, outputsAtSuggested } = pricing
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current || !cost.ok) return
    tracked.current = true
    trackCalcEvent('calc_product_priced', {
      complete: cost.ok,
      margin_pct: suggested.ok && outputsAtSuggested ? outputsAtSuggested.margin.toDecimalPlaces(4).toNumber() : null,
      used_custom_price: false,
    })
  }, [cost.ok, suggested.ok, outputsAtSuggested])

  if (!cost.ok) {
    return (
      <div className="bg-white rounded-xl border border-amber-300 p-5">
        <p className="text-sm font-semibold text-amber-800 mb-1">Cost is incomplete</p>
        <p className="text-sm text-[#6D5E6D]">
          {cost.missingComponentRecipeIds.length > 0 && 'A recipe component is missing or can\'t be costed. '}
          {cost.missingPackagingLineIds.length > 0 && 'A packaging line can\'t be costed — check its pantry item has a price and, if needed, a density.'}
        </p>
      </div>
    )
  }

  if (!suggested.ok) {
    return (
      <div className="bg-white rounded-xl border border-red-300 p-5">
        <p className="text-sm font-semibold text-red-700">Fees plus margin leave nothing to cover cost</p>
        <p className="text-sm text-[#6D5E6D] mt-1">Lower the target margin or choose a payment method with lower fees.</p>
      </div>
    )
  }

  const effectivePrice = customPrice.trim() ? Number(customPrice) : suggested.suggestedPrice.toNumber()
  const outputs = customPrice.trim() ? pricing.outputsAtPrice(effectivePrice) : outputsAtSuggested!
  const isCustom = customPrice.trim().length > 0
  const belowBreakEven = effectivePrice < suggested.breakEven.toNumber()

  const breakdownTotal = outputs.breakdown.I.plus(outputs.breakdown.P).plus(outputs.breakdown.L).plus(outputs.breakdown.O).plus(outputs.breakdown.fees).plus(outputs.breakdown.profit.lt(0) ? 0 : outputs.breakdown.profit)
  const segments = [
    { label: 'Ingredients', value: outputs.breakdown.I, color: '#C58930' },
    { label: 'Packaging', value: outputs.breakdown.P, color: '#A87225' },
    { label: 'Labor', value: outputs.breakdown.L, color: '#8A5D1A' },
    { label: 'Overhead', value: outputs.breakdown.O, color: '#6D5E6D' },
    { label: 'Fees', value: outputs.breakdown.fees, color: '#B5C9A8' },
    { label: 'Profit', value: outputs.breakdown.profit.gt(0) ? outputs.breakdown.profit : outputs.breakdown.profit.mul(0), color: '#41622D' },
  ]

  return (
    <div className="bg-white rounded-xl border border-[#EBD2AD] p-5 space-y-4">
      {belowBreakEven && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
          This price is below break-even — you&apos;d lose {formatMoney(suggested.breakEven.minus(effectivePrice))} per item.
        </div>
      )}

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#6D5E6D] uppercase tracking-wide">{isCustom ? 'Your price' : 'Suggested price'}</p>
          <p className="text-4xl font-bold text-[#201D20]" style={{ fontFamily: 'var(--font-playfair)' }}>{formatMoney(new Decimal(effectivePrice))}</p>
        </div>
        <div className="text-right">
          <label className="block text-xs font-medium text-[#6D5E6D] mb-1">Try a price</label>
          <input
            type="number" step="0.01" placeholder={suggested.suggestedPrice.toFixed(2)}
            value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
            className="w-28 px-2 py-1.5 border border-[#EBD2AD] rounded-lg text-sm text-right outline-none focus:ring-2 focus:ring-[#C58930]"
          />
          {isCustom && <button onClick={() => setCustomPrice('')} className="block ml-auto mt-1 text-xs text-[#C58930] hover:underline">Reset</button>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Profit" value={formatMoney(outputs.profit)} negative={outputs.profit.isNegative()} />
        <Stat label="Margin" value={formatPercent(outputs.margin)} negative={outputs.margin.isNegative()} />
        <Stat label="Hourly wage" value={outputs.effectiveHourlyWage ? formatMoney(outputs.effectiveHourlyWage) : '—'} negative={outputs.effectiveHourlyWage?.isNegative() ?? false} />
      </div>

      <div className="flex justify-between text-xs text-[#6D5E6D] border-t border-[#EBD2AD] pt-3">
        <span>Break-even: {formatMoney(suggested.breakEven)}</span>
        <span>Fees: {formatMoney(outputs.fees)}</span>
        <span>Markup: {formatPercent(outputs.markupOnCost, 0)}</span>
      </div>

      <div>
        <div className="flex h-3 rounded-full overflow-hidden" role="img" aria-label="Price breakdown">
          {segments.map((s) => {
            const pct = breakdownTotal.gt(0) ? s.value.div(breakdownTotal).times(100).toNumber() : 0
            return <div key={s.label} style={{ width: `${Math.max(0, pct)}%`, backgroundColor: s.color }} title={`${s.label}: ${formatMoney(s.value)}`} />
          })}
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#6D5E6D]">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}: {formatMoney(s.value)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Stat({ label, value, negative }: { label: string; value: string; negative: boolean }) {
  return (
    <div>
      <p className={`text-lg font-bold ${negative ? 'text-red-600' : 'text-[#201D20]'}`}>{value}</p>
      <p className="text-xs text-[#6D5E6D]">{label}</p>
    </div>
  )
}
