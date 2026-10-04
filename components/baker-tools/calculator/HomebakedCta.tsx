'use client'

import { useDismissible } from '@/lib/calculator/use-dismissible'
import { trackCalcEvent } from '@/lib/calculator/track'

const HOMEBAKED_URL = 'https://homebakedapp.com/'

export default function HomebakedCta({ placement }: { placement: 'price_card' | 'plan_pnl' }) {
  const { dismissed, dismiss, ready } = useDismissible(`homebaked-cta-${placement}`)
  if (!ready || dismissed) return null

  return (
    <div className="bg-[#F5EAC8] border border-[#C58930]/30 rounded-xl p-4 flex items-start justify-between gap-3">
      <p className="text-sm text-[#201D20]">
        Selling these? List them on <span className="font-semibold">Homebaked</span>. Zero fees on every order.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`${HOMEBAKED_URL}?utm_source=bakingencyclopedia&utm_medium=calculator&utm_campaign=${placement}`}
          target="_blank" rel="noopener noreferrer"
          onClick={() => trackCalcEvent('calc_homebaked_cta_clicked', { placement })}
          className="px-3 py-1.5 rounded-lg bg-[#C58930] text-white text-xs font-semibold hover:bg-[#A87225] whitespace-nowrap"
        >
          See Homebaked
        </a>
        <button
          onClick={() => { trackCalcEvent('calc_homebaked_cta_dismissed', { placement }); dismiss() }}
          aria-label="Dismiss"
          className="text-[#6D5E6D] text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
