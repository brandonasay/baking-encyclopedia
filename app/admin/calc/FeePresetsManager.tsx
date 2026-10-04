'use client'

import { useState } from 'react'
import type { CalcFeePreset } from '@/lib/database.types'

const inputCls = 'px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] outline-none focus:ring-2 focus:ring-[#C58930]'

function emptyPreset(): Partial<CalcFeePreset> {
  return { name: '', fee_pct: 0, fee_fixed: 0, source_url: '', verified_on: null, sort_order: 0, active: true }
}

export default function FeePresetsManager({ initialPresets }: { initialPresets: CalcFeePreset[] }) {
  const [presets, setPresets] = useState(initialPresets)
  const [editing, setEditing] = useState<Partial<CalcFeePreset> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const res = await fetch('/api/admin/calc/fee-presets')
    if (res.ok) setPresets(await res.json())
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    setError(null)
    const isNew = !editing.id
    const url = isNew ? '/api/admin/calc/fee-presets' : `/api/admin/calc/fee-presets/${editing.id}`
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editing.name,
        fee_pct: Number(editing.fee_pct),
        fee_fixed: Number(editing.fee_fixed),
        source_url: editing.source_url || null,
        verified_on: editing.verified_on || null,
        sort_order: Number(editing.sort_order ?? 0),
        active: editing.active ?? true,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Save failed')
      return
    }
    setEditing(null)
    refresh()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/calc/fee-presets/${id}`, { method: 'DELETE' })
    refresh()
  }

  async function toggleActive(preset: CalcFeePreset) {
    await fetch(`/api/admin/calc/fee-presets/${preset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !preset.active }),
    })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#201D20] uppercase tracking-wide">Payment method presets</h2>
        {!editing && (
          <button onClick={() => setEditing(emptyPreset())} className="text-sm text-[#C58930] font-medium hover:underline">+ Add preset</button>
        )}
      </div>

      {editing && (
        <div className="bg-white rounded-xl border border-[#C58930] p-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Name" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <input className={inputCls} placeholder="Source URL (optional)" value={editing.source_url ?? ''} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} />
            <div>
              <label className="block text-xs text-[#6D5E6D] mb-1">Fee %</label>
              <input type="number" min="0" max="100" step="0.01" className={inputCls + ' w-full'}
                value={editing.fee_pct != null ? editing.fee_pct * 100 : ''}
                onChange={(e) => setEditing({ ...editing, fee_pct: e.target.value ? Number(e.target.value) / 100 : 0 })} />
            </div>
            <div>
              <label className="block text-xs text-[#6D5E6D] mb-1">Fixed fee ($)</label>
              <input type="number" min="0" step="0.01" className={inputCls + ' w-full'}
                value={editing.fee_fixed ?? ''} onChange={(e) => setEditing({ ...editing, fee_fixed: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-[#6D5E6D] mb-1">Sort order</label>
              <input type="number" step="1" className={inputCls + ' w-full'}
                value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-[#6D5E6D] mb-1">Verified on</label>
              <input type="date" className={inputCls + ' w-full'}
                value={editing.verified_on ?? ''} onChange={(e) => setEditing({ ...editing, verified_on: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225] disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(null); setError(null) }} className="px-4 py-2 rounded-lg border border-[#EBD2AD] text-sm text-[#6D5E6D]">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#EBD2AD] divide-y divide-[#EBD2AD]">
        {presets.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className={!p.active ? 'opacity-50' : ''}>
              <p className="text-sm font-medium text-[#201D20]">{p.name}</p>
              <p className="text-xs text-[#6D5E6D]">{(p.fee_pct * 100).toFixed(2)}% + ${p.fee_fixed.toFixed(2)}{!p.active && ' · inactive'}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => toggleActive(p)} className="text-xs font-medium text-[#6D5E6D] hover:underline">{p.active ? 'Deactivate' : 'Activate'}</button>
              <button onClick={() => setEditing(p)} className="text-xs font-medium text-[#C58930] hover:underline">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
