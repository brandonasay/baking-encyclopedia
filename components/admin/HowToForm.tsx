'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { HowToArticle, HowToStep, HowtoSection } from '@/lib/database.types'

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

function emptyStep(stepNumber: number): HowToStep {
  return { step_number: stepNumber, title: '', description: '' }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#1C1410] mb-1">
      {children}
    </label>
  )
}

const inputCls = 'w-full px-3 py-2 bg-white border border-[#E8E0D5] rounded-lg text-sm text-[#1C1410] placeholder-[#7A6A5E] focus:outline-none focus:ring-2 focus:ring-[#C8652A] focus:border-transparent transition'
const textareaCls = `${inputCls} resize-y min-h-[100px]`
const selectCls = `${inputCls} cursor-pointer`

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8652A] ${checked ? 'bg-[#C8652A]' : 'bg-[#E8E0D5]'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-sm text-[#1C1410]">{label}</span>
    </label>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-[#1C1410] uppercase tracking-wide mb-4">{children}</h3>
}

const TABS = ['Basic', 'Steps', 'Body', 'Meta', 'Related', 'SEO', 'Image'] as const
type Tab = (typeof TABS)[number]

// ─── Main component ─────────────────────────────────────────────────────────

interface HowToFormProps {
  article?: HowToArticle
}

export default function HowToForm({ article }: HowToFormProps) {
  const router = useRouter()
  const isEdit = !!article

  // Basic
  const [title, setTitle] = useState(article?.title ?? '')
  const [slug, setSlug] = useState(article?.slug ?? '')
  const [slugManual, setSlugManual] = useState(isEdit)
  const [headline, setHeadline] = useState(article?.headline ?? '')
  const [section, setSection] = useState<HowtoSection>(article?.section ?? 'baking')
  const [featured, setFeatured] = useState(article?.featured ?? false)
  const [published, setPublished] = useState(article?.published ?? false)

  // Steps
  const [steps, setSteps] = useState<HowToStep[]>(
    article?.steps?.length ? article.steps : [emptyStep(1)]
  )

  // Body
  const [body, setBody] = useState(article?.body ?? '')

  // Meta
  const [readTime, setReadTime] = useState(String(article?.read_time_minutes ?? ''))
  const [tags, setTags] = useState(arrayToCSV(article?.tags ?? []))

  // Related
  const [relatedRecipeIds, setRelatedRecipeIds] = useState(arrayToCSV(article?.related_recipe_ids ?? []))
  const [relatedArticleIds, setRelatedArticleIds] = useState(arrayToCSV(article?.related_article_ids ?? []))
  const [relatedIngredientIds, setRelatedIngredientIds] = useState(arrayToCSV(article?.related_ingredient_ids ?? []))

  // SEO
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(article?.seo_description ?? '')

  // Image
  const [imageUrl, setImageUrl] = useState(article?.image_url ?? '')
  const [imageAlt, setImageAlt] = useState(article?.image_alt ?? '')

  // UI
  const [activeTab, setActiveTab] = useState<Tab>('Basic')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) setSlug(slugify(val))
  }

  function updateStep(i: number, field: keyof HowToStep, value: string | number) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }
  function removeStep(i: number) {
    setSteps((prev) =>
      prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step_number: idx + 1 }))
    )
  }
  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev]
      const j = i + dir
      ;[next[i], next[j]] = [next[j], next[i]]
      return next.map((s, idx) => ({ ...s, step_number: idx + 1 }))
    })
  }

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload = {
      title,
      slug,
      headline: headline || null,
      section,
      featured,
      published,
      steps: steps.filter((s) => s.title.trim() || s.description.trim()),
      body: body || null,
      read_time_minutes: readTime ? Number(readTime) : null,
      tags: csvToArray(tags),
      related_recipe_ids: csvToArray(relatedRecipeIds),
      related_article_ids: csvToArray(relatedArticleIds),
      related_ingredient_ids: csvToArray(relatedIngredientIds),
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
    }

    try {
      const url = isEdit ? `/api/admin/how-tos/${article.id}` : '/api/admin/how-tos'
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
      showToast('success', isEdit ? 'Article updated!' : 'Article created!')
      if (!isEdit && data.id) {
        router.push(`/admin/how-tos/${data.id}`)
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
        <h1 className="text-2xl font-bold text-[#1C1410]">{isEdit ? `Edit: ${article.title}` : 'New How-To Article'}</h1>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[#C8652A] text-white rounded-lg font-medium text-sm hover:bg-[#B55A24] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Article' : 'Create Article'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
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
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-[#C8652A] text-white' : 'bg-white border border-[#E8E0D5] text-[#7A6A5E] hover:text-[#1C1410]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E8E0D5] p-6 space-y-5">

        {/* Basic */}
        {activeTab === 'Basic' && (
          <>
            <SectionHeading>Basic Info</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <input id="title" className={inputCls} value={title} onChange={(e) => handleTitleChange(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <input id="slug" className={inputCls} value={slug} onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }} required />
                <p className="text-xs text-[#7A6A5E] mt-1">Auto-generated from title. Edit to override.</p>
              </div>
              <div>
                <Label htmlFor="headline">Headline</Label>
                <input id="headline" className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Short description shown in cards" />
              </div>
              <div>
                <Label htmlFor="section">Section</Label>
                <select id="section" className={selectCls} value={section} onChange={(e) => setSection(e.target.value as HowtoSection)}>
                  <option value="baking">Baking</option>
                  <option value="microbakery">Microbakery</option>
                </select>
              </div>
              <div className="flex gap-6">
                <Toggle checked={featured} onChange={setFeatured} label="Featured" />
                <Toggle checked={published} onChange={setPublished} label="Published" />
              </div>
            </div>
          </>
        )}

        {/* Steps */}
        {activeTab === 'Steps' && (
          <>
            <SectionHeading>Steps</SectionHeading>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="bg-[#FAF8F4] rounded-lg border border-[#E8E0D5] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#C8652A] w-5 text-center">{i + 1}</span>
                    <input
                      className={inputCls + ' flex-1'}
                      placeholder="Step title"
                      value={step.title}
                      onChange={(e) => updateStep(i, 'title', e.target.value)}
                    />
                    <div className="flex gap-1">
                      <button type="button" disabled={i === 0} onClick={() => moveStep(i, -1)} className="p-1 text-[#7A6A5E] hover:text-[#1C1410] disabled:opacity-30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                      </button>
                      <button type="button" disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)} className="p-1 text-[#7A6A5E] hover:text-[#1C1410] disabled:opacity-30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                      <button type="button" onClick={() => removeStep(i)} className="p-1 text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <textarea
                    className={textareaCls + ' ml-7'}
                    placeholder="Step description..."
                    value={step.description}
                    onChange={(e) => updateStep(i, 'description', e.target.value)}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSteps((prev) => [...prev, emptyStep(prev.length + 1)])}
                className="inline-flex items-center gap-1.5 text-sm text-[#C8652A] font-medium hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add step
              </button>
            </div>
          </>
        )}

        {/* Body */}
        {activeTab === 'Body' && (
          <>
            <SectionHeading>Body Content</SectionHeading>
            <p className="text-xs text-[#7A6A5E] -mt-3 mb-3">Supports Markdown</p>
            <textarea
              className={`${inputCls} resize-y min-h-[400px] font-mono text-xs`}
              placeholder="Full article body in Markdown..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        )}

        {/* Meta */}
        {activeTab === 'Meta' && (
          <>
            <SectionHeading>Meta</SectionHeading>
            <div className="space-y-4">
              <div>
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <input id="readTime" className={inputCls} type="number" min="1" value={readTime} onChange={(e) => setReadTime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <input id="tags" className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma-separated, e.g. bread, sourdough, fermentation" />
              </div>
            </div>
          </>
        )}

        {/* Related */}
        {activeTab === 'Related' && (
          <>
            <SectionHeading>Related Content</SectionHeading>
            <p className="text-xs text-[#7A6A5E] -mt-3 mb-4">Comma-separated UUIDs</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="relRecipes">Related Recipe IDs</Label>
                <input id="relRecipes" className={inputCls} value={relatedRecipeIds} onChange={(e) => setRelatedRecipeIds(e.target.value)} placeholder="uuid1, uuid2, ..." />
              </div>
              <div>
                <Label htmlFor="relArticles">Related Article IDs</Label>
                <input id="relArticles" className={inputCls} value={relatedArticleIds} onChange={(e) => setRelatedArticleIds(e.target.value)} placeholder="uuid1, uuid2, ..." />
              </div>
              <div>
                <Label htmlFor="relIngredients">Related Ingredient IDs</Label>
                <input id="relIngredients" className={inputCls} value={relatedIngredientIds} onChange={(e) => setRelatedIngredientIds(e.target.value)} placeholder="uuid1, uuid2, ..." />
              </div>
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
                <p className="text-xs text-[#7A6A5E] mt-1">{seoTitle.length}/60 characters</p>
              </div>
              <div>
                <Label htmlFor="seoDesc">SEO Description</Label>
                <textarea id="seoDesc" className={textareaCls} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Meta description..." />
                <p className="text-xs text-[#7A6A5E] mt-1">{seoDescription.length}/160 characters</p>
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
                  <img src={imageUrl} alt={imageAlt || 'Preview'} className="max-h-64 rounded-lg border border-[#E8E0D5] object-cover" />
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
          className="px-6 py-3 bg-[#C8652A] text-white rounded-lg font-medium hover:bg-[#B55A24] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Article' : 'Create Article'}
        </button>
      </div>
    </form>
  )
}
