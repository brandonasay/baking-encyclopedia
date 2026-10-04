'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCalculatorStore } from '@/lib/calculator/store/use-calculator-store'
import { getFeePresets } from '@/lib/calculator/store/fee-presets'
import { DEFAULT_SETTINGS, type FeePreset, type Settings } from '@/lib/calculator/types'

const inputCls = 'w-full px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] outline-none focus:ring-2 focus:ring-[#C58930]'
const labelCls = 'block text-sm font-medium text-[#201D20] mb-1'

export default function SettingsPage() {
  const { store, loading } = useCalculatorStore()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [feePresets, setFeePresets] = useState<FeePreset[]>([])
  const [feeChoice, setFeeChoice] = useState<string>('custom')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading) return
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const [existing, presets] = await Promise.all([store.getSettings(), getFeePresets(supabase)])
      if (cancelled) return
      const s = existing ?? DEFAULT_SETTINGS
      setSettings(s)
      setFeePresets(presets)
      setFeeChoice(s.defaultFeePresetId ?? (s.customFeePct != null ? 'custom' : presets[0]?.id ?? 'custom'))
      setReady(true)
    }
    load()
    return () => { cancelled = true }
  }, [store, loading])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const toSave: Settings = {
      ...settings,
      defaultFeePresetId: feeChoice === 'custom' ? null : feeChoice,
    }
    await store.upsertSettings(toSave)
    setSaving(false)
    setSaved(true)
  }

  if (!ready) return <p className="text-sm text-[#6D5E6D]">Loading…</p>

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#201D20] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Settings</h1>
        <p className="text-sm text-[#6D5E6D]">These defaults apply to every product and plan unless overridden individually.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Hourly wage ($)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={settings.hourlyRate}
              onChange={(e) => update('hourlyRate', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Price step</label>
            <select className={inputCls} value={settings.priceStep} onChange={(e) => update('priceStep', Number(e.target.value))}>
              {[0.05, 0.25, 0.5, 1].map((v) => <option key={v} value={v}>${v.toFixed(2)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Monthly overhead ($)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={settings.monthlyOverhead}
              onChange={(e) => update('monthlyOverhead', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Expected products / month</label>
            <input type="number" min="0" step="1" className={inputCls} value={settings.expectedProductsPerMonth}
              onChange={(e) => update('expectedProductsPerMonth', Number(e.target.value))} />
            <p className="text-xs text-[#6D5E6D] mt-1">0 excludes overhead from product costs.</p>
          </div>
          <div>
            <label className={labelCls}>Default target margin (%)</label>
            <input type="number" min="0" max="90" step="1" className={inputCls} value={Math.round(settings.defaultMarginPct * 100)}
              onChange={(e) => update('defaultMarginPct', Number(e.target.value) / 100)} />
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-2 border-t border-[#EBD2AD]">
          <button
            type="button" role="switch" aria-checked={settings.countLaborAsCost}
            onClick={() => update('countLaborAsCost', !settings.countLaborAsCost)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.countLaborAsCost ? 'bg-[#C58930]' : 'bg-[#EBD2AD]'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.countLaborAsCost ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-[#201D20]">Pay myself for my time</p>
            <p className="text-xs text-[#6D5E6D]">
              {settings.countLaborAsCost
                ? 'Your hourly wage is built into every suggested price.'
                : "Off — suggested prices won't include a wage for your time. Good for hobby/break-even selling."}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#201D20] uppercase tracking-wide">Default payment method</h2>
        <select className={inputCls} value={feeChoice} onChange={(e) => { setFeeChoice(e.target.value); setSaved(false) }}>
          {feePresets.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {(p.feePct * 100).toFixed(1)}% + ${p.feeFixed.toFixed(2)}</option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {feeChoice === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fee %</label>
              <input type="number" min="0" max="100" step="0.1" className={inputCls}
                value={settings.customFeePct != null ? settings.customFeePct * 100 : ''}
                onChange={(e) => update('customFeePct', e.target.value ? Number(e.target.value) / 100 : null)} />
            </div>
            <div>
              <label className={labelCls}>Fixed fee ($)</label>
              <input type="number" min="0" step="0.01" className={inputCls}
                value={settings.customFeeFixed ?? ''}
                onChange={(e) => update('customFeeFixed', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#C58930] text-white font-medium text-sm hover:bg-[#A87225] disabled:opacity-60">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="text-sm text-[#41622D]">Saved.</span>}
      </div>
    </form>
  )
}
