'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCalculatorStore } from '@/lib/calculator/store/use-calculator-store'
import { useImportOnSignIn } from '@/lib/calculator/store/use-import-on-signin'
import { trackCalcEvent } from '@/lib/calculator/track'
import SignInPrompt from './SignInPrompt'

const TABS = [
  { href: '/baker-tools/calculator/products', label: 'Products' },
  { href: '/baker-tools/calculator/recipes', label: 'Recipes' },
  { href: '/baker-tools/calculator/pantry', label: 'Pantry' },
  { href: '/baker-tools/calculator/plans', label: 'Plans' },
]

export default function CalculatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isGuest, loading, localStatus } = useCalculatorStore()
  const importStatus = useImportOnSignIn()
  const [showSignIn, setShowSignIn] = useState(false)
  const startTracked = useRef(false)

  useEffect(() => {
    if (loading || startTracked.current) return
    startTracked.current = true
    const entry = pathname.includes('/plans') ? 'plan' : 'price'
    trackCalcEvent('calc_start', { entry, signed_in: !isGuest })
  }, [loading, isGuest, pathname])

  useEffect(() => {
    if (importStatus.phase === 'done' && importStatus.count > 0) {
      trackCalcEvent('calc_import_completed', { entity_count: importStatus.count })
    }
  }, [importStatus])

  return (
    <div className="min-h-screen bg-[#FCFFEB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guest / storage banners */}
        {isGuest && (
          <div className="flex items-center justify-between gap-3 bg-[#F5EAC8] border border-[#C58930]/30 rounded-xl px-4 py-2.5 mb-5 text-sm">
            <span className="text-[#201D20]">
              {localStatus.persistent
                ? 'Saved on this device only. Sign in to keep it everywhere.'
                : "Private browsing detected — nothing will be saved after you close this tab."}
            </span>
            <button onClick={() => { trackCalcEvent('calc_signin_prompt_clicked', { source: 'guest_banner' }); setShowSignIn(true) }} className="shrink-0 text-[#C58930] font-semibold hover:underline">
              Sign in
            </button>
          </div>
        )}
        {localStatus.recoveredFromBackup && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 mb-5 text-sm text-amber-900">
            We couldn&apos;t read your saved calculator data, so we started fresh. Your old data is kept as a backup in this browser&apos;s storage.
          </div>
        )}
        {importStatus.phase === 'importing' && (
          <div className="bg-[#F5EAC8] border border-[#C58930]/30 rounded-xl px-4 py-2.5 mb-5 text-sm text-[#201D20]">
            Moving your calculator data into your account…
          </div>
        )}
        {importStatus.phase === 'done' && importStatus.count > 0 && (
          <div className="bg-[#EEF3EA] border border-[#B5C9A8] rounded-xl px-4 py-2.5 mb-5 text-sm text-[#41622D]">
            Moved {importStatus.count} item{importStatus.count === 1 ? '' : 's'} into your account.
          </div>
        )}
        {importStatus.phase === 'error' && (
          <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-5 text-sm text-red-700">
            <span>Couldn&apos;t move your local data into your account: {importStatus.message}</span>
            <button onClick={importStatus.retry} className="shrink-0 font-semibold hover:underline">Retry</button>
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between gap-4 mb-6 overflow-x-auto">
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-[#C58930] text-white' : 'bg-white border border-[#EBD2AD] text-[#6D5E6D] hover:text-[#201D20]'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
          <Link
            href="/baker-tools/calculator/settings"
            className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith('/baker-tools/calculator/settings') ? 'bg-[#C58930] text-white' : 'bg-white border border-[#EBD2AD] text-[#6D5E6D] hover:text-[#201D20]'
            }`}
          >
            Settings
          </Link>
        </div>

        {children}
      </div>

      {showSignIn && <SignInPrompt onClose={() => setShowSignIn(false)} />}
    </div>
  )
}
