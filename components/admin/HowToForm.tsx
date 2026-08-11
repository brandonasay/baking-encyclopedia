'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { HowToArticle, HowtoSection, ContentBlock } from '@/lib/database.types'
import type { GeneratedHowToData } from './HowToGenerator'

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function newId() {
  return crypto.randomUUID()
}

function parseBlocks(body: string | null): ContentBlock[] {
  if (!body) return []
  try {
    const parsed = JSON.parse(body)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.type) return parsed as ContentBlock[]
  } catch {}
  return []
}

function arrayToCSV(arr: string[]) {
  return arr.join(', ')
}

function csvToArray(str: string): string[] {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] placeholder-[#6D5E6D] focus:outline-none focus:ring-2 focus:ring-[#C58930] focus:border-transparent transition'
const selectCls = `${inputCls} cursor-pointer`

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
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

// ─── Block editors ───────────────────────────────────────────────────────────

function HeadingBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'heading' }; onChange: (b: ContentBlock) => void }) {
  return (
    <input
      className={`${inputCls} text-lg font-semibold`}
      placeholder="Section heading"
      value={block.content}
      onChange={(e) => onChange({ ...block, content: e.target.value })}
    />
  )
}

function TextBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'text' }; onChange: (b: ContentBlock) => void }) {
  return (
    <textarea
      className={`${inputCls} resize-none min-h-[100px]`}
      placeholder="Write some text..."
      value={block.content}
      rows={4}
      onChange={(e) => onChange({ ...block, content: e.target.value })}
    />
  )
}

function ImageBlockEditor({ block, onChange }: { block: ContentBlock & { type: 'image' }; onChange: (b: ContentBlock) => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'howto-images')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      onChange({ ...block, url: json.url! })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {block.description && (
        <p className="text-xs text-[#A87225] bg-[#FBF3DC] border border-[#EBD2AD] rounded-lg px-3 py-2">
          <span className="font-semibold">Shot brief:</span> {block.description}
        </p>
      )}
      {block.url ? (
        <div className="space-y-3">
          <Image
            src={block.url}
            alt={block.alt || ''}
            width={0}
            height={0}
            sizes="600px"
            className="w-full h-auto rounded-lg border border-[#EBD2AD]"
          />
          <button
            type="button"
            onClick={() => onChange({ ...block, url: '' })}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Remove image
          </button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-[#EBD2AD] rounded-lg p-8 text-center cursor-pointer hover:border-[#C58930] transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <p className="text-sm text-[#6D5E6D]">Uploading…</p>
          ) : (
            <>
              <p className="text-sm text-[#6D5E6D]">Click to upload an image</p>
              <p className="text-xs text-[#6D5E6D] mt-1">JPEG, PNG, or WebP · max 5MB</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      <input
        className={inputCls}
        placeholder="Alt text (describes the image)"
        value={block.alt}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
      />
    </div>
  )
}

function ListBlockEditor({
  block,
  onChange,
}: {
  block: ContentBlock & { type: 'numbered_list' | 'bulleted_list' }
  onChange: (b: ContentBlock) => void
}) {
  function updateItem(i: number, val: string) {
    const items = [...block.items]
    items[i] = val
    onChange({ ...block, items })
  }
  function removeItem(i: number) {
    onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })
  }
  function addItem() {
    onChange({ ...block, items: [...block.items, ''] })
  }

  const Bullet = block.type === 'numbered_list'
    ? ({ i }: { i: number }) => (
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F5EAC8] flex items-center justify-center text-xs font-semibold text-[#C58930] mt-2">
          {i + 1}
        </span>
      )
    : () => <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#C58930] mt-3.5" />

  return (
    <div className="space-y-2">
      {block.items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <Bullet i={i} />
          <input
            className={`${inputCls} flex-1`}
            placeholder={`Item ${i + 1}`}
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="mt-1.5 p-1.5 text-[#6D5E6D] hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-sm text-[#C58930] font-medium hover:underline mt-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add item
      </button>
    </div>
  )
}

// ─── Block wrapper ────────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<ContentBlock['type'], string> = {
  heading: 'Heading',
  text: 'Text',
  image: 'Image',
  numbered_list: 'Numbered List',
  bulleted_list: 'Bulleted List',
}

function BlockWrapper({
  block,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  block: ContentBlock
  index: number
  total: number
  onChange: (b: ContentBlock) => void
  onMove: (i: number, dir: -1 | 1) => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-[#EBD2AD] overflow-hidden">
      {/* Block header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#FCFFEB] border-b border-[#EBD2AD]">
        <span className="text-xs font-semibold text-[#6D5E6D] uppercase tracking-wide">
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            className="p-1 text-[#6D5E6D] hover:text-[#201D20] disabled:opacity-30 transition-colors"
            title="Move up"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            className="p-1 text-[#6D5E6D] hover:text-[#201D20] disabled:opacity-30 transition-colors"
            title="Move down"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 text-[#6D5E6D] hover:text-red-500 transition-colors"
            title="Remove block"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Block content */}
      <div className="p-4">
        {block.type === 'heading' && <HeadingBlockEditor block={block} onChange={onChange} />}
        {block.type === 'text' && <TextBlockEditor block={block} onChange={onChange} />}
        {block.type === 'image' && <ImageBlockEditor block={block} onChange={onChange} />}
        {(block.type === 'numbered_list' || block.type === 'bulleted_list') && (
          <ListBlockEditor block={block} onChange={onChange} />
        )}
      </div>
    </div>
  )
}

// ─── Main form ───────────────────────────────────────────────────────────────

interface HowToFormProps {
  article?: HowToArticle
  initialValues?: GeneratedHowToData
}

export default function HowToForm({ article, initialValues }: HowToFormProps) {
  const router = useRouter()
  const isEdit = !!article
  const iv = initialValues

  const [title, setTitle] = useState(article?.title ?? iv?.title ?? '')
  const [slug, setSlug] = useState(article?.slug ?? (iv?.title ? slugify(iv.title) : ''))
  const [slugManual, setSlugManual] = useState(isEdit)
  const [headline, setHeadline] = useState(article?.headline ?? iv?.headline ?? '')
  const [section, setSection] = useState<HowtoSection>(article?.section ?? iv?.section ?? 'baking')
  const [featured, setFeatured] = useState(article?.featured ?? false)
  const [published, setPublished] = useState(article?.published ?? false)
  const [blocks, setBlocks] = useState<ContentBlock[]>(() =>
    article ? parseBlocks(article.body) : (iv?.blocks ?? [])
  )

  const [tags, setTags] = useState(arrayToCSV(article?.tags ?? iv?.tags ?? []))
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? iv?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(article?.seo_description ?? iv?.seo_description ?? '')

  const [imageUrl, setImageUrl] = useState(article?.image_url ?? '')
  const [imageAlt, setImageAlt] = useState(article?.image_alt ?? '')
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [thumbnailError, setThumbnailError] = useState<string | null>(null)
  const thumbnailRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) setSlug(slugify(val))
  }

  function addBlock(type: ContentBlock['type']) {
    const base = { id: newId() }
    let block: ContentBlock
    if (type === 'heading') block = { ...base, type, content: '' }
    else if (type === 'text') block = { ...base, type, content: '' }
    else if (type === 'image') block = { ...base, type, url: '', alt: '' }
    else block = { ...base, type: type as 'numbered_list' | 'bulleted_list', items: [''] }
    setBlocks((prev) => [...prev, block])
  }

  function updateBlock(updated: ContentBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
  }

  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev]
      const j = i + dir
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function removeBlock(i: number) {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i))
  }

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
      body: JSON.stringify(blocks),
      steps: [],
      tags: csvToArray(tags),
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
      if (!isEdit && data.id) router.push(`/admin/how-tos/${data.id}`)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#201D20]">
          {isEdit ? 'Edit Article' : 'New How-To Article'}
        </h1>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[#C58930] text-white rounded-lg font-medium text-sm hover:bg-[#A87225] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-[#EEF3EA] text-[#41622D] border border-[#B5C9A8]' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.message}
        </div>
      )}

      {/* Article fields */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#201D20] mb-1">Title *</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Article title"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#201D20] mb-1">Slug *</label>
          <input
            className={inputCls}
            value={slug}
            onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }}
            placeholder="url-friendly-slug"
            required
          />
          <p className="text-xs text-[#6D5E6D] mt-1">Auto-generated from title. Edit to override.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#201D20] mb-1">Headline</label>
          <input
            className={inputCls}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Short description shown in cards and under the title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#201D20] mb-1">Thumbnail</label>
          {imageUrl ? (
            <div className="space-y-2">
              <div className="relative w-full aspect-[4/3] max-w-xs rounded-lg overflow-hidden border border-[#EBD2AD]">
                <Image src={imageUrl} alt={imageAlt || ''} fill className="object-cover" sizes="320px" />
              </div>
              <div className="flex items-center gap-3">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="Alt text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => { setImageUrl(''); setImageAlt('') }}
                  className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className="border-2 border-dashed border-[#EBD2AD] rounded-lg p-6 text-center cursor-pointer hover:border-[#C58930] transition-colors"
                onClick={() => thumbnailRef.current?.click()}
              >
                {thumbnailUploading ? (
                  <p className="text-sm text-[#6D5E6D]">Uploading…</p>
                ) : (
                  <>
                    <p className="text-sm text-[#6D5E6D]">Click to upload thumbnail</p>
                    <p className="text-xs text-[#6D5E6D] mt-1">JPEG, PNG, or WebP · max 5MB</p>
                  </>
                )}
                <input
                  ref={thumbnailRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setThumbnailUploading(true)
                    setThumbnailError(null)
                    try {
                      const fd = new FormData()
                      fd.append('file', file)
                      fd.append('bucket', 'howto-images')
                      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
                      const json = await res.json() as { url?: string; error?: string }
                      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
                      setImageUrl(json.url!)
                    } catch (err) {
                      setThumbnailError(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setThumbnailUploading(false)
                      if (thumbnailRef.current) thumbnailRef.current.value = ''
                    }
                  }}
                />
              </div>
              {thumbnailError && <p className="text-xs text-red-600">{thumbnailError}</p>}
            </div>
          )}
        </div>

        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-[#201D20] mb-1">Section</label>
            <select
              className={selectCls}
              value={section}
              onChange={(e) => setSection(e.target.value as HowtoSection)}
            >
              <option value="baking">The Baking Side</option>
              <option value="microbakery">The Business Side</option>
            </select>
          </div>
          <div className="flex gap-5 pb-2">
            <Toggle checked={featured} onChange={setFeatured} label="Featured" />
            <Toggle checked={published} onChange={setPublished} label="Published" />
          </div>
        </div>
      </div>

      {/* Tags & SEO */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#201D20] uppercase tracking-wide">Tags & SEO</h2>
        <div>
          <label className="block text-sm font-medium text-[#201D20] mb-1">Tags</label>
          <input
            className={inputCls}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. laminated dough, croissant, technique"
          />
          <p className="text-xs text-[#6D5E6D] mt-1">Comma-separated</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#201D20] mb-1">SEO Title</label>
          <input
            className={inputCls}
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="Overrides title in <head>"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#201D20] mb-1">SEO Description</label>
          <textarea
            className={`${inputCls} resize-none min-h-[80px]`}
            rows={3}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Meta description..."
          />
          <p className="text-xs text-[#6D5E6D] mt-1">{seoDescription.length}/160 characters</p>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#201D20] uppercase tracking-wide">Content</h2>

        {blocks.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-[#EBD2AD] py-12 text-center text-[#6D5E6D] text-sm">
            No content yet — add a block below.
          </div>
        )}

        {blocks.map((block, i) => (
          <BlockWrapper
            key={block.id}
            block={block}
            index={i}
            total={blocks.length}
            onChange={updateBlock}
            onMove={moveBlock}
            onRemove={removeBlock}
          />
        ))}

        {/* Add block toolbar */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-[#6D5E6D] self-center mr-1">Add block:</span>
          {(['heading', 'text', 'image', 'numbered_list', 'bulleted_list'] as ContentBlock['type'][]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-[#EBD2AD] bg-white text-[#201D20] hover:border-[#C58930] hover:text-[#C58930] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {BLOCK_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#C58930] text-white rounded-lg font-medium hover:bg-[#A87225] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Article' : 'Create Article'}
        </button>
      </div>
    </form>
  )
}
