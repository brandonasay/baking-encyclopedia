'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Ingredient, CommonSubstitute } from '@/lib/database.types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function arrayToCSV(arr: string[]) {
  return arr.join(', ')
}

function csvToArray(str: string): string[] {
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#201D20] mb-1">
      {children}
    </label>
  )
}

const inputCls = 'w-full px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] placeholder-[#6D5E6D] focus:outline-none focus:ring-2 focus:ring-[#C58930] focus:border-transparent transition'
const textareaCls = `${inputCls} resize-y min-h-[100px]`

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C58930] ${checked ? 'bg-[#C58930]' : 'bg-[#EBD2AD]'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-sm text-[#201D20]">{label}</span>
    </label>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-[#201D20] uppercase tracking-wide mb-4">{children}</h3>
}

const TABS = ['Basic', 'Content', 'Tips', 'Substitutes', 'Tags', 'SEO', 'Image'] as const
type Tab = (typeof TABS)[number]

// ─── Main component ─────────────────────────────────────────────────────────

interface IngredientFormProps {
  ingredient?: Ingredient
}

export default function IngredientForm({ ingredient }: IngredientFormProps) {
  const router = useRouter()
  const isEdit = !!ingredient

  // Basic
  const [name, setName] = useState(ingredient?.name ?? '')
  const [slug, setSlug] = useState(ingredient?.slug ?? '')
  const [slugManual, setSlugManual] = useState(isEdit)
  const [category, setCategory] = useState(ingredient?.category ?? '')
  const [headline, setHeadline] = useState(ingredient?.headline ?? '')
  const [published, setPublished] = useState(ingredient?.published ?? false)

  // Content
  const [origins, setOrigins] = useState(ingredient?.origins ?? '')
  const [howUsedInBaking, setHowUsedInBaking] = useState(ingredient?.how_used_in_baking ?? '')
  const [flavorNotes, setFlavorNotes] = useState(ingredient?.flavor_notes ?? '')
  const [bakerPercentage, setBakerPercentage] = useState(ingredient?.baker_percentage ?? '')
  const [sourcingNotes, setSourcingNotes] = useState(ingredient?.sourcing_notes ?? '')

  // Tips
  const [storageTips, setStorageTips] = useState(ingredient?.storage_tips ?? '')
  const [buyingTips, setBuyingTips] = useState(ingredient?.buying_tips ?? '')

  // Substitutes
  const [substitutes, setSubstitutes] = useState<CommonSubstitute[]>(
    ingredient?.common_substitutes?.length ? ingredient.common_substitutes : [{ name: '', notes: '' }]
  )

  // Tags
  const [tags, setTags] = useState(arrayToCSV(ingredient?.tags ?? []))

  // SEO
  const [seoTitle, setSeoTitle] = useState(ingredient?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(ingredient?.seo_description ?? '')

  // Image
  const [imageUrl, setImageUrl] = useState(ingredient?.image_url ?? '')
  const [imageAlt, setImageAlt] = useState(ingredient?.image_alt ?? '')

  // UI
  const [activeTab, setActiveTab] = useState<Tab>('Basic')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function handleNameChange(val: string) {
    setName(val)
    if (!slugManual) setSlug(slugify(val))
  }

  function updateSubstitute(i: number, field: keyof CommonSubstitute, value: string) {
    setSubstitutes((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }
  function removeSubstitute(i: number) {
    setSubstitutes((prev) => prev.filter((_, idx) => idx !== i))
  }
  function addSubstitute() {
    setSubstitutes((prev) => [...prev, { name: '', notes: '' }])
  }

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name,
      slug,
      category,
      headline: headline || null,
      published,
      origins: origins || null,
      how_used_in_baking: howUsedInBaking || null,
      flavor_notes: flavorNotes || null,
      baker_percentage: bakerPercentage || null,
      sourcing_notes: sourcingNotes || null,
      storage_tips: storageTips || null,
      buying_tips: buyingTips || null,
      common_substitutes: substitutes.filter((s) => s.name.trim()),
      tags: csvToArray(tags),
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
    }

    try {
      const url = isEdit ? `/api/admin/ingredients/${ingredient.id}` : '/api/admin/ingredients'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Save failed')
      }
      const data = (await res.json()) as { id?: string }
      showToast('success', isEdit ? 'Ingredient updated!' : 'Ingredient created!')
      if (!isEdit && data.id) {
        router.push(`/admin/ingredients/${data.id}`)
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#201D20]">{isEdit ? `Edit: ${ingredient.name}` : 'New Ingredient'}</h1>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[#C58930] text-white rounded-lg font-medium text-sm hover:bg-[#A87225] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Ingredient' : 'Create Ingredient'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-[#EEF3EA] text-[#41622D] border border-[#B5C9A8]' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-[#C58930] text-white' : 'bg-white border border-[#EBD2AD] text-[#6D5E6D] hover:text-[#201D20]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6 space-y-5">

        {/* Basic */}
        {activeTab === 'Basic' && (
          <>
            <SectionHeading>Basic Info</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <input id="name" className={inputCls} value={name} onChange={(e) => handleNameChange(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <input id="slug" className={inputCls} value={slug} onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }} required />
                <p className="text-xs text-[#6D5E6D] mt-1">Auto-generated from name. Edit to override.</p>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <input id="category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Flours, Fats, Sweeteners" />
              </div>
              <div>
                <Label htmlFor="headline">Headline</Label>
                <input id="headline" className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Short description" />
              </div>
              <Toggle checked={published} onChange={setPublished} label="Published" />
            </div>
          </>
        )}

        {/* Content */}
        {activeTab === 'Content' && (
          <>
            <SectionHeading>Content</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="origins">Origins</Label>
                <textarea id="origins" className={textareaCls} value={origins} onChange={(e) => setOrigins(e.target.value)} placeholder="History and origin of this ingredient..." />
              </div>
              <div>
                <Label htmlFor="howUsed">How Used in Baking</Label>
                <textarea id="howUsed" className={textareaCls} value={howUsedInBaking} onChange={(e) => setHowUsedInBaking(e.target.value)} placeholder="How this ingredient functions in baking..." />
              </div>
              <div>
                <Label htmlFor="flavorNotes">Flavor Notes</Label>
                <textarea id="flavorNotes" className={textareaCls} value={flavorNotes} onChange={(e) => setFlavorNotes(e.target.value)} placeholder="Flavor profile description..." />
              </div>
              <div>
                <Label htmlFor="bakerPct">Baker Percentage</Label>
                <input id="bakerPct" className={inputCls} value={bakerPercentage} onChange={(e) => setBakerPercentage(e.target.value)} placeholder="e.g. 100% (reference flour)" />
              </div>
              <div>
                <Label htmlFor="sourcingNotes">Sourcing Notes</Label>
                <textarea id="sourcingNotes" className={textareaCls} value={sourcingNotes} onChange={(e) => setSourcingNotes(e.target.value)} placeholder="Where to source, brand recommendations..." />
              </div>
            </div>
          </>
        )}

        {/* Tips */}
        {activeTab === 'Tips' && (
          <>
            <SectionHeading>Tips</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="storageTips">Storage Tips</Label>
                <textarea id="storageTips" className={textareaCls} value={storageTips} onChange={(e) => setStorageTips(e.target.value)} placeholder="How to store this ingredient..." />
              </div>
              <div>
                <Label htmlFor="buyingTips">Buying Tips</Label>
                <textarea id="buyingTips" className={textareaCls} value={buyingTips} onChange={(e) => setBuyingTips(e.target.value)} placeholder="What to look for when buying..." />
              </div>
            </div>
          </>
        )}

        {/* Substitutes */}
        {activeTab === 'Substitutes' && (
          <>
            <SectionHeading>Common Substitutes</SectionHeading>
            <div className="space-y-3">
              {substitutes.map((sub, i) => (
                <div key={i} className="bg-[#FCFFEB] rounded-lg border border-[#EBD2AD] p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      className={inputCls + ' flex-1'}
                      placeholder="Substitute name"
                      value={sub.name}
                      onChange={(e) => updateSubstitute(i, 'name', e.target.value)}
                    />
                    <button type="button" onClick={() => removeSubstitute(i)} className="p-2 text-red-400 hover:text-red-600 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <textarea
                    className={textareaCls + ' min-h-[60px]'}
                    placeholder="Notes on how/when to substitute..."
                    value={sub.notes ?? ''}
                    onChange={(e) => updateSubstitute(i, 'notes', e.target.value)}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addSubstitute}
                className="inline-flex items-center gap-1.5 text-sm text-[#C58930] font-medium hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add substitute
              </button>
            </div>
          </>
        )}

        {/* Tags */}
        {activeTab === 'Tags' && (
          <>
            <SectionHeading>Tags</SectionHeading>
            <p className="text-xs text-[#6D5E6D] -mt-3 mb-4">Comma-separated values</p>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <input id="tags" className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. flour, gluten, protein" />
            </div>
          </>
        )}

        {/* SEO */}
        {activeTab === 'SEO' && (
          <>
            <SectionHeading>SEO</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <input id="seoTitle" className={inputCls} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Overrides title in <head>" />
                <p className="text-xs text-[#6D5E6D] mt-1">{seoTitle.length}/60 characters</p>
              </div>
              <div>
                <Label htmlFor="seoDesc">SEO Description</Label>
                <textarea id="seoDesc" className={textareaCls} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Meta description..." />
                <p className="text-xs text-[#6D5E6D] mt-1">{seoDescription.length}/160 characters</p>
              </div>
            </div>
          </>
        )}

        {/* Image */}
        {activeTab === 'Image' && (
          <>
            <SectionHeading>Image</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <input id="imageUrl" className={inputCls} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label htmlFor="imageAlt">Image Alt Text</Label>
                <input id="imageAlt" className={inputCls} value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Describe the image for accessibility" />
              </div>
              {imageUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={imageAlt || 'Preview'} className="max-h-64 rounded-lg border border-[#EBD2AD] object-cover" />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end pb-8">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#C58930] text-white rounded-lg font-medium hover:bg-[#A87225] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Ingredient' : 'Create Ingredient'}
        </button>
      </div>
    </form>
  )
}
