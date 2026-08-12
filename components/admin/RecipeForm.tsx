'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type {
  Recipe,
  RecipeCategory,
  RecipeSubcategory,
  RecipeIngredient,
  RecipeInstruction,
  RecipeDifficulty,
  NutritionInfo,
} from '@/lib/database.types'

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
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function emptyIngredient(): RecipeIngredient {
  return { ingredient_name: '', quantity: '', unit: '', quantity_grams: undefined, notes: '', group_label: '' }
}

function emptyInstruction(stepNumber: number): RecipeInstruction {
  return { step_number: stepNumber, title: '', body: '' }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-[#201D20] uppercase tracking-wide mb-4">{children}</h3>
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[#201D20] mb-1">
      {children}
    </label>
  )
}

const inputCls = 'w-full px-3 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] placeholder-[#6D5E6D] focus:outline-none focus:ring-2 focus:ring-[#C58930] focus:border-transparent transition'
const textareaCls = `${inputCls} resize-y min-h-[80px]`
const selectCls = `${inputCls} cursor-pointer`

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

function IngredientRow({
  ing,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  ing: RecipeIngredient
  index: number
  total: number
  onChange: (i: number, field: keyof RecipeIngredient, value: string | number | undefined) => void
  onRemove: (i: number) => void
  onMove: (i: number, dir: -1 | 1) => void
}) {
  return (
    <div className="bg-[#FCFFEB] rounded-lg border border-[#EBD2AD] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#6D5E6D] font-medium w-5 text-center">{index + 1}</span>
        <input
          className={inputCls + ' flex-1'}
          placeholder="Ingredient name"
          value={ing.ingredient_name}
          onChange={(e) => onChange(index, 'ingredient_name', e.target.value)}
        />
        <div className="flex gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(index, -1)} className="p-1 text-[#6D5E6D] hover:text-[#201D20] disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
          </button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(index, 1)} className="p-1 text-[#6D5E6D] hover:text-[#201D20] disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <button type="button" onClick={() => onRemove(index)} className="p-1 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 ml-7">
        <input className={inputCls} placeholder="Qty" value={ing.quantity} onChange={(e) => onChange(index, 'quantity', e.target.value)} />
        <input className={inputCls} placeholder="Unit" value={ing.unit} onChange={(e) => onChange(index, 'unit', e.target.value)} />
        <input className={inputCls} type="number" placeholder="Grams" value={ing.quantity_grams ?? ''} onChange={(e) => onChange(index, 'quantity_grams', e.target.value ? Number(e.target.value) : undefined)} />
      </div>
      <div className="grid grid-cols-2 gap-2 ml-7">
        <input className={inputCls} placeholder="Notes (optional)" value={ing.notes ?? ''} onChange={(e) => onChange(index, 'notes', e.target.value)} />
        <input className={inputCls} placeholder="Group label (optional)" value={ing.group_label ?? ''} onChange={(e) => onChange(index, 'group_label', e.target.value)} />
      </div>
    </div>
  )
}

function InstructionRow({
  inst,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  inst: RecipeInstruction
  index: number
  total: number
  onChange: (i: number, field: keyof RecipeInstruction, value: string | number) => void
  onRemove: (i: number) => void
  onMove: (i: number, dir: -1 | 1) => void
}) {
  return (
    <div className="bg-[#FCFFEB] rounded-lg border border-[#EBD2AD] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[#C58930] w-5 text-center">{index + 1}</span>
        <input
          className={inputCls + ' flex-1'}
          placeholder="Step title (optional)"
          value={inst.title ?? ''}
          onChange={(e) => onChange(index, 'title', e.target.value)}
        />
        <div className="flex gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(index, -1)} className="p-1 text-[#6D5E6D] hover:text-[#201D20] disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
          </button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(index, 1)} className="p-1 text-[#6D5E6D] hover:text-[#201D20] disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <button type="button" onClick={() => onRemove(index)} className="p-1 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      <textarea
        className={textareaCls + ' ml-7'}
        placeholder="Step instructions..."
        value={inst.body}
        onChange={(e) => onChange(index, 'body', e.target.value)}
      />
    </div>
  )
}

function DynamicStringList({
  items,
  onChange,
  placeholder,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  function update(i: number, val: string) {
    const next = [...items]
    next[i] = val
    onChange(next)
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...items, ''])
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls + ' flex-1'} placeholder={placeholder} value={item} onChange={(e) => update(i, e.target.value)} />
          <button type="button" onClick={() => remove(i)} className="p-2 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-[#C58930] hover:underline font-medium">
        + Add item
      </button>
    </div>
  )
}

// ─── Tab nav ────────────────────────────────────────────────────────────────

const TABS = ['Basic', 'Times & Yield', 'Ingredients', 'Instructions', 'Details', 'Variants', 'Nutrition', 'Tags', 'SEO', 'Image'] as const
type Tab = (typeof TABS)[number]

// ─── Main component ─────────────────────────────────────────────────────────

import type { ImportedRecipeData } from '@/components/admin/RecipeImporter'

interface RecipeFormProps {
  recipe?: Recipe
  categories: RecipeCategory[]
  subcategories: RecipeSubcategory[]
  initialValues?: ImportedRecipeData
}

export default function RecipeForm({ recipe, categories, subcategories, initialValues }: RecipeFormProps) {
  const router = useRouter()
  const isEdit = !!recipe
  const iv = initialValues

  // Basic Info
  const [title, setTitle] = useState(recipe?.title ?? iv?.title ?? '')
  const [slug, setSlug] = useState(recipe?.slug ?? (iv?.title ? slugify(iv.title) : ''))
  const [slugManual, setSlugManual] = useState(isEdit)
  const [headline, setHeadline] = useState(recipe?.headline ?? iv?.headline ?? '')
  const [categoryId, setCategoryId] = useState(recipe?.category_id ?? '')
  const [subcategoryId, setSubcategoryId] = useState(recipe?.subcategory_id ?? '')
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>(recipe?.difficulty ?? iv?.difficulty ?? 'beginner')
  const [featured, setFeatured] = useState(recipe?.featured ?? false)
  const [published, setPublished] = useState(recipe?.published ?? false)

  // Times & Yield
  const [prepTime, setPrepTime] = useState(String(recipe?.prep_time_minutes ?? iv?.prep_time_minutes ?? ''))
  const [cookTime, setCookTime] = useState(String(recipe?.cook_time_minutes ?? iv?.cook_time_minutes ?? ''))
  const [baseYield, setBaseYield] = useState(recipe?.base_yield ?? iv?.base_yield ?? '')
  const [baseServings, setBaseServings] = useState(String(recipe?.base_servings ?? iv?.base_servings ?? ''))

  // Ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    recipe?.ingredients?.length ? recipe.ingredients
    : iv?.ingredients?.length ? iv.ingredients
    : [emptyIngredient()]
  )

  // Instructions
  const [instructions, setInstructions] = useState<RecipeInstruction[]>(
    recipe?.instructions?.length ? recipe.instructions
    : iv?.instructions?.length ? iv.instructions
    : [emptyInstruction(1)]
  )

  // Details
  const [tips, setTips] = useState<string[]>(recipe?.tips ?? iv?.tips ?? [''])
  const [equipment, setEquipment] = useState<string[]>(recipe?.equipment ?? iv?.equipment ?? [''])
  const [storageInstructions, setStorageInstructions] = useState(recipe?.storage_instructions ?? iv?.storage_instructions ?? '')

  // Variants — Gluten Free
  const [hasGlutenFree, setHasGlutenFree] = useState(recipe?.has_gluten_free ?? iv?.has_gluten_free ?? false)
  const [glutenFreeNotes, setGlutenFreeNotes] = useState(recipe?.gluten_free_notes ?? iv?.gluten_free_notes ?? '')
  const [glutenFreeIngredients, setGlutenFreeIngredients] = useState<RecipeIngredient[]>(
    recipe?.gluten_free_ingredients?.length ? recipe.gluten_free_ingredients
    : iv?.gluten_free_ingredients?.length ? iv.gluten_free_ingredients
    : [emptyIngredient()]
  )
  const [glutenFreeInstructions, setGlutenFreeInstructions] = useState<RecipeInstruction[]>(
    recipe?.gluten_free_instructions?.length ? recipe.gluten_free_instructions
    : iv?.gluten_free_instructions?.length ? iv.gluten_free_instructions
    : [emptyInstruction(1)]
  )

  // Variants — High Protein
  const [hasHighProtein, setHasHighProtein] = useState(recipe?.has_high_protein ?? false)
  const [highProteinNotes, setHighProteinNotes] = useState(recipe?.high_protein_notes ?? '')
  const [highProteinIngredients, setHighProteinIngredients] = useState<RecipeIngredient[]>(
    recipe?.high_protein_ingredients ?? [emptyIngredient()]
  )
  const [highProteinInstructions, setHighProteinInstructions] = useState<RecipeInstruction[]>(
    recipe?.high_protein_instructions ?? [emptyInstruction(1)]
  )

  // Nutrition
  const nutrition = recipe?.nutrition_per_serving
  const [calories, setCalories] = useState(String(nutrition?.calories ?? ''))
  const [proteinG, setProteinG] = useState(String(nutrition?.protein_g ?? ''))
  const [carbsG, setCarbsG] = useState(String(nutrition?.carbs_g ?? ''))
  const [fatG, setFatG] = useState(String(nutrition?.fat_g ?? ''))
  const [fiberG, setFiberG] = useState(String(nutrition?.fiber_g ?? ''))

  // Tags
  const [tags, setTags] = useState(arrayToCSV(recipe?.tags ?? iv?.tags ?? []))
  const [occasionTags, setOccasionTags] = useState(arrayToCSV(recipe?.occasion_tags ?? []))
  const [seasonTags, setSeasonTags] = useState(arrayToCSV(recipe?.season_tags ?? []))
  const [dietaryTags, setDietaryTags] = useState(arrayToCSV(recipe?.dietary_tags ?? []))

  // SEO
  const [seoTitle, setSeoTitle] = useState(recipe?.seo_title ?? iv?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(recipe?.seo_description ?? iv?.seo_description ?? '')

  // Image
  const [imageUrl, setImageUrl] = useState(recipe?.image_url ?? iv?.image_url ?? '')
  const [imageAlt, setImageAlt] = useState(recipe?.image_alt ?? '')
  const [imageUploading, setImageUploading] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>('Basic')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Helpers for title → slug
  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) setSlug(slugify(val))
  }

  // Ingredient helpers
  function updateIngredient(i: number, field: keyof RecipeIngredient, value: string | number | undefined) {
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)))
  }
  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i))
  }
  function moveIngredient(i: number, dir: -1 | 1) {
    setIngredients((prev) => {
      const next = [...prev]
      const j = i + dir
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  // Instruction helpers
  function updateInstruction(i: number, field: keyof RecipeInstruction, value: string | number) {
    setInstructions((prev) =>
      prev.map((inst, idx) => (idx === i ? { ...inst, [field]: value } : inst))
    )
  }
  function removeInstruction(i: number) {
    setInstructions((prev) =>
      prev.filter((_, idx) => idx !== i).map((inst, idx) => ({ ...inst, step_number: idx + 1 }))
    )
  }
  function moveInstruction(i: number, dir: -1 | 1) {
    setInstructions((prev) => {
      const next = [...prev]
      const j = i + dir
      ;[next[i], next[j]] = [next[j], next[i]]
      return next.map((inst, idx) => ({ ...inst, step_number: idx + 1 }))
    })
  }

  // Variant ingredient/instruction helpers (gluten free)
  function updateGFIngredient(i: number, field: keyof RecipeIngredient, value: string | number | undefined) {
    setGlutenFreeIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)))
  }
  function removeGFIngredient(i: number) { setGlutenFreeIngredients((prev) => prev.filter((_, idx) => idx !== i)) }
  function moveGFIngredient(i: number, dir: -1 | 1) {
    setGlutenFreeIngredients((prev) => { const next = [...prev]; const j = i + dir; [next[i], next[j]] = [next[j], next[i]]; return next })
  }
  function updateGFInstruction(i: number, field: keyof RecipeInstruction, value: string | number) {
    setGlutenFreeInstructions((prev) => prev.map((inst, idx) => (idx === i ? { ...inst, [field]: value } : inst)))
  }
  function removeGFInstruction(i: number) { setGlutenFreeInstructions((prev) => prev.filter((_, idx) => idx !== i).map((inst, idx) => ({ ...inst, step_number: idx + 1 }))) }
  function moveGFInstruction(i: number, dir: -1 | 1) {
    setGlutenFreeInstructions((prev) => { const next = [...prev]; const j = i + dir; [next[i], next[j]] = [next[j], next[i]]; return next.map((inst, idx) => ({ ...inst, step_number: idx + 1 })) })
  }

  // Variant ingredient/instruction helpers (high protein)
  function updateHPIngredient(i: number, field: keyof RecipeIngredient, value: string | number | undefined) {
    setHighProteinIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)))
  }
  function removeHPIngredient(i: number) { setHighProteinIngredients((prev) => prev.filter((_, idx) => idx !== i)) }
  function moveHPIngredient(i: number, dir: -1 | 1) {
    setHighProteinIngredients((prev) => { const next = [...prev]; const j = i + dir; [next[i], next[j]] = [next[j], next[i]]; return next })
  }
  function updateHPInstruction(i: number, field: keyof RecipeInstruction, value: string | number) {
    setHighProteinInstructions((prev) => prev.map((inst, idx) => (idx === i ? { ...inst, [field]: value } : inst)))
  }
  function removeHPInstruction(i: number) { setHighProteinInstructions((prev) => prev.filter((_, idx) => idx !== i).map((inst, idx) => ({ ...inst, step_number: idx + 1 }))) }
  function moveHPInstruction(i: number, dir: -1 | 1) {
    setHighProteinInstructions((prev) => { const next = [...prev]; const j = i + dir; [next[i], next[j]] = [next[j], next[i]]; return next.map((inst, idx) => ({ ...inst, step_number: idx + 1 })) })
  }

  const filteredSubcategories = subcategories.filter((s) => s.category_id === categoryId)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const nutritionObj: NutritionInfo | null =
      calories || proteinG || carbsG || fatG || fiberG
        ? {
            calories: calories ? Number(calories) : undefined,
            protein_g: proteinG ? Number(proteinG) : undefined,
            carbs_g: carbsG ? Number(carbsG) : undefined,
            fat_g: fatG ? Number(fatG) : undefined,
            fiber_g: fiberG ? Number(fiberG) : undefined,
          }
        : null

    const payload = {
      title,
      slug,
      headline: headline || null,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      difficulty,
      featured,
      published,
      prep_time_minutes: prepTime ? Number(prepTime) : null,
      cook_time_minutes: cookTime ? Number(cookTime) : null,
      base_yield: baseYield || null,
      base_servings: baseServings ? Number(baseServings) : null,
      ingredients: ingredients.filter((i) => i.ingredient_name.trim()),
      instructions: instructions.filter((i) => i.body.trim()),
      tips: tips.filter(Boolean),
      equipment: equipment.filter(Boolean),
      storage_instructions: storageInstructions || null,
      has_gluten_free: hasGlutenFree,
      gluten_free_notes: hasGlutenFree ? glutenFreeNotes || null : null,
      gluten_free_ingredients: hasGlutenFree ? glutenFreeIngredients.filter((i) => i.ingredient_name.trim()) : null,
      gluten_free_instructions: hasGlutenFree ? glutenFreeInstructions.filter((i) => i.body.trim()) : null,
      has_high_protein: hasHighProtein,
      high_protein_notes: hasHighProtein ? highProteinNotes || null : null,
      high_protein_ingredients: hasHighProtein ? highProteinIngredients.filter((i) => i.ingredient_name.trim()) : null,
      high_protein_instructions: hasHighProtein ? highProteinInstructions.filter((i) => i.body.trim()) : null,
      nutrition_per_serving: nutritionObj,
      tags: csvToArray(tags),
      occasion_tags: csvToArray(occasionTags),
      season_tags: csvToArray(seasonTags),
      dietary_tags: csvToArray(dietaryTags),
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
    }

    try {
      const url = isEdit ? `/api/admin/recipes/${recipe.id}` : '/api/admin/recipes'
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
      showToast('success', isEdit ? 'Recipe updated!' : 'Recipe created!')
      if (!isEdit && data.id) {
        router.push(`/admin/recipes/${data.id}`)
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-[#201D20]">{isEdit ? `Edit: ${recipe.title}` : 'New Recipe'}</h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPublished(p => !p)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${published ? 'bg-[#EEF3EA] border-[#A0B890] text-[#41622D] hover:bg-[#DCE8D5]' : 'bg-white border-[#EBD2AD] text-[#6D5E6D] hover:border-[#C58930] hover:text-[#C58930]'}`}
          >
            <span className={`w-2 h-2 rounded-full ${published ? 'bg-[#EEF3EA]0' : 'bg-[#D4C498]'}`} />
            {published ? 'Published' : 'Draft'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#C58930] text-white rounded-lg font-medium text-sm hover:bg-[#A87225] disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Recipe'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-[#EEF3EA] text-[#41622D] border border-[#B5C9A8]' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.message}
        </div>
      )}

      {/* Tab nav */}
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

      {/* Tab panels */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6 space-y-5">

        {/* Basic Info */}
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
                <input
                  id="slug"
                  className={inputCls}
                  value={slug}
                  onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }}
                  required
                />
                <p className="text-xs text-[#6D5E6D] mt-1">Auto-generated from title. Edit to override.</p>
              </div>
              <div>
                <Label htmlFor="headline">Headline</Label>
                <input id="headline" className={inputCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Short description shown in cards" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select id="category" className={selectCls} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId('') }}>
                    <option value="">— None —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <select id="subcategory" className={selectCls} value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} disabled={!categoryId}>
                    <option value="">— None —</option>
                    {filteredSubcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select id="difficulty" className={selectCls} value={difficulty} onChange={(e) => setDifficulty(e.target.value as RecipeDifficulty)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="flex gap-6">
                <Toggle checked={featured} onChange={setFeatured} label="Featured" />
              </div>
            </div>
          </>
        )}

        {/* Times & Yield */}
        {activeTab === 'Times & Yield' && (
          <>
            <SectionHeading>Times & Yield</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                <input id="prepTime" className={inputCls} type="number" min="0" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cookTime">Cook Time (minutes)</Label>
                <input id="cookTime" className={inputCls} type="number" min="0" value={cookTime} onChange={(e) => setCookTime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="baseYield">Yield</Label>
                <input id="baseYield" className={inputCls} placeholder="e.g. 1 loaf, 12 cookies" value={baseYield} onChange={(e) => setBaseYield(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="baseServings">Servings</Label>
                <input id="baseServings" className={inputCls} type="number" min="1" value={baseServings} onChange={(e) => setBaseServings(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Ingredients */}
        {activeTab === 'Ingredients' && (
          <>
            <SectionHeading>Ingredients</SectionHeading>
            <div className="space-y-3">
              {ingredients.map((ing, i) => (
                <IngredientRow
                  key={i}
                  ing={ing}
                  index={i}
                  total={ingredients.length}
                  onChange={updateIngredient}
                  onRemove={removeIngredient}
                  onMove={moveIngredient}
                />
              ))}
              <button
                type="button"
                onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
                className="inline-flex items-center gap-1.5 text-sm text-[#C58930] font-medium hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add ingredient
              </button>
            </div>
          </>
        )}

        {/* Instructions */}
        {activeTab === 'Instructions' && (
          <>
            <SectionHeading>Instructions</SectionHeading>
            <div className="space-y-3">
              {instructions.map((inst, i) => (
                <InstructionRow
                  key={i}
                  inst={inst}
                  index={i}
                  total={instructions.length}
                  onChange={updateInstruction}
                  onRemove={removeInstruction}
                  onMove={moveInstruction}
                />
              ))}
              <button
                type="button"
                onClick={() => setInstructions((prev) => [...prev, emptyInstruction(prev.length + 1)])}
                className="inline-flex items-center gap-1.5 text-sm text-[#C58930] font-medium hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add step
              </button>
            </div>
          </>
        )}

        {/* Details */}
        {activeTab === 'Details' && (
          <>
            <SectionHeading>Details</SectionHeading>
            <div className="space-y-5">
              <div>
                <Label>Tips</Label>
                <DynamicStringList items={tips} onChange={setTips} placeholder="Tip..." />
              </div>
              <div>
                <Label>Equipment</Label>
                <DynamicStringList items={equipment} onChange={setEquipment} placeholder="Equipment item..." />
              </div>
              <div>
                <Label htmlFor="storage">Storage Instructions</Label>
                <textarea id="storage" className={textareaCls} value={storageInstructions} onChange={(e) => setStorageInstructions(e.target.value)} placeholder="How to store this recipe..." />
              </div>
            </div>
          </>
        )}

        {/* Variants */}
        {activeTab === 'Variants' && (
          <>
            <SectionHeading>Variants</SectionHeading>
            <div className="space-y-8">
              {/* Gluten Free */}
              <div className="space-y-4">
                <Toggle checked={hasGlutenFree} onChange={setHasGlutenFree} label="Has Gluten-Free variant" />
                {hasGlutenFree && (
                  <div className="pl-4 border-l-2 border-[#EBD2AD] space-y-4">
                    <div>
                      <Label htmlFor="gfNotes">Gluten-Free Notes</Label>
                      <textarea id="gfNotes" className={textareaCls} value={glutenFreeNotes} onChange={(e) => setGlutenFreeNotes(e.target.value)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#201D20] mb-2">GF Ingredients</p>
                      <div className="space-y-3">
                        {glutenFreeIngredients.map((ing, i) => (
                          <IngredientRow key={i} ing={ing} index={i} total={glutenFreeIngredients.length} onChange={updateGFIngredient} onRemove={removeGFIngredient} onMove={moveGFIngredient} />
                        ))}
                        <button type="button" onClick={() => setGlutenFreeIngredients((p) => [...p, emptyIngredient()])} className="text-sm text-[#C58930] font-medium hover:underline">+ Add GF ingredient</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#201D20] mb-2">GF Instructions</p>
                      <div className="space-y-3">
                        {glutenFreeInstructions.map((inst, i) => (
                          <InstructionRow key={i} inst={inst} index={i} total={glutenFreeInstructions.length} onChange={updateGFInstruction} onRemove={removeGFInstruction} onMove={moveGFInstruction} />
                        ))}
                        <button type="button" onClick={() => setGlutenFreeInstructions((p) => [...p, emptyInstruction(p.length + 1)])} className="text-sm text-[#C58930] font-medium hover:underline">+ Add GF step</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* High Protein */}
              <div className="space-y-4">
                <Toggle checked={hasHighProtein} onChange={setHasHighProtein} label="Has High-Protein variant" />
                {hasHighProtein && (
                  <div className="pl-4 border-l-2 border-[#EBD2AD] space-y-4">
                    <div>
                      <Label htmlFor="hpNotes">High-Protein Notes</Label>
                      <textarea id="hpNotes" className={textareaCls} value={highProteinNotes} onChange={(e) => setHighProteinNotes(e.target.value)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#201D20] mb-2">HP Ingredients</p>
                      <div className="space-y-3">
                        {highProteinIngredients.map((ing, i) => (
                          <IngredientRow key={i} ing={ing} index={i} total={highProteinIngredients.length} onChange={updateHPIngredient} onRemove={removeHPIngredient} onMove={moveHPIngredient} />
                        ))}
                        <button type="button" onClick={() => setHighProteinIngredients((p) => [...p, emptyIngredient()])} className="text-sm text-[#C58930] font-medium hover:underline">+ Add HP ingredient</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#201D20] mb-2">HP Instructions</p>
                      <div className="space-y-3">
                        {highProteinInstructions.map((inst, i) => (
                          <InstructionRow key={i} inst={inst} index={i} total={highProteinInstructions.length} onChange={updateHPInstruction} onRemove={removeHPInstruction} onMove={moveHPInstruction} />
                        ))}
                        <button type="button" onClick={() => setHighProteinInstructions((p) => [...p, emptyInstruction(p.length + 1)])} className="text-sm text-[#C58930] font-medium hover:underline">+ Add HP step</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Nutrition */}
        {activeTab === 'Nutrition' && (
          <>
            <SectionHeading>Nutrition per Serving</SectionHeading>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Calories', value: calories, setter: setCalories, id: 'cal' },
                { label: 'Protein (g)', value: proteinG, setter: setProteinG, id: 'protein' },
                { label: 'Carbs (g)', value: carbsG, setter: setCarbsG, id: 'carbs' },
                { label: 'Fat (g)', value: fatG, setter: setFatG, id: 'fat' },
                { label: 'Fiber (g)', value: fiberG, setter: setFiberG, id: 'fiber' },
              ].map(({ label, value, setter, id }) => (
                <div key={id}>
                  <Label htmlFor={id}>{label}</Label>
                  <input id={id} className={inputCls} type="number" min="0" step="0.1" value={value} onChange={(e) => setter(e.target.value)} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Tags */}
        {activeTab === 'Tags' && (
          <>
            <SectionHeading>Tags</SectionHeading>
            <p className="text-xs text-[#6D5E6D] -mt-3 mb-4">Comma-separated values</p>
            <div className="space-y-4">
              {[
                { label: 'Tags', value: tags, setter: setTags, id: 'tags' },
                { label: 'Occasion Tags', value: occasionTags, setter: setOccasionTags, id: 'occ' },
                { label: 'Season Tags', value: seasonTags, setter: setSeasonTags, id: 'sea' },
                { label: 'Dietary Tags', value: dietaryTags, setter: setDietaryTags, id: 'diet' },
              ].map(({ label, value, setter, id }) => (
                <div key={id}>
                  <Label htmlFor={id}>{label}</Label>
                  <input id={id} className={inputCls} value={value} onChange={(e) => setter(e.target.value)} placeholder="e.g. quick, weeknight, summer" />
                </div>
              ))}
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
              {/* Upload */}
              <div>
                <Label>Upload Image</Label>
                <label className="flex items-center gap-3 cursor-pointer w-fit">
                  <span className="px-4 py-2 bg-white border border-[#EBD2AD] rounded-lg text-sm text-[#201D20] hover:border-[#C58930] hover:text-[#C58930] transition-colors font-medium">
                    {imageUploading ? 'Uploading…' : 'Choose file'}
                  </span>
                  <span className="text-xs text-[#6D5E6D]">JPG, PNG or WebP · max 5 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={imageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setImageUploading(true)
                      try {
                        const fd = new FormData()
                        fd.append('file', file)
                        fd.append('bucket', 'recipe-images')
                        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
                        const json = await res.json()
                        if (!res.ok) throw new Error(json.error ?? 'Upload failed')
                        setImageUrl(json.url)
                      } catch (err) {
                        showToast('error', err instanceof Error ? err.message : 'Upload failed')
                      } finally {
                        setImageUploading(false)
                        e.target.value = ''
                      }
                    }}
                  />
                </label>
              </div>
              <div>
                <Label htmlFor="imageUrl">Or paste an image URL</Label>
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

      {/* Bottom save */}
      <div className="flex justify-end pb-8">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#C58930] text-white rounded-lg font-medium hover:bg-[#A87225] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Recipe' : 'Create Recipe'}
        </button>
      </div>
    </form>
  )
}
