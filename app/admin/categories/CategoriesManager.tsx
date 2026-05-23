'use client'

import { useState } from 'react'

type Subcategory = {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  category_id: string
}

type Category = {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
  recipe_subcategories: Subcategory[]
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CategoriesManager({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // New category form state
  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [catError, setCatError] = useState('')

  // New subcategory form state per category
  const [newSubName, setNewSubName] = useState<Record<string, string>>({})
  const [newSubSlug, setNewSubSlug] = useState<Record<string, string>>({})
  const [addingSub, setAddingSub] = useState<Record<string, boolean>>({})
  const [subError, setSubError] = useState<Record<string, string>>({})

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    setAddingCat(true)
    setCatError('')
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug || slugify(newCatName), description: newCatDesc || null }),
      })
      if (!res.ok) {
        const json = await res.json()
        setCatError(json.error ?? 'Failed to create category')
      } else {
        const cat: Category = { ...(await res.json()), recipe_subcategories: [] }
        setCategories((prev) => [...prev, cat])
        setNewCatName('')
        setNewCatSlug('')
        setNewCatDesc('')
      }
    } catch {
      setCatError('Network error')
    } finally {
      setAddingCat(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category? This cannot be undone.')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleAddSubcategory(e: React.FormEvent, catId: string) {
    e.preventDefault()
    setAddingSub((prev) => ({ ...prev, [catId]: true }))
    setSubError((prev) => ({ ...prev, [catId]: '' }))
    const name = newSubName[catId] ?? ''
    const slug = newSubSlug[catId] || slugify(name)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: catId, name, slug, type: 'subcategory' }),
      })
      if (!res.ok) {
        const json = await res.json()
        setSubError((prev) => ({ ...prev, [catId]: json.error ?? 'Failed' }))
      } else {
        const sub: Subcategory = await res.json()
        setCategories((prev) =>
          prev.map((c) =>
            c.id === catId
              ? { ...c, recipe_subcategories: [...c.recipe_subcategories, sub] }
              : c
          )
        )
        setNewSubName((prev) => ({ ...prev, [catId]: '' }))
        setNewSubSlug((prev) => ({ ...prev, [catId]: '' }))
      }
    } catch {
      setSubError((prev) => ({ ...prev, [catId]: 'Network error' }))
    } finally {
      setAddingSub((prev) => ({ ...prev, [catId]: false }))
    }
  }

  async function handleDeleteSubcategory(catId: string, subId: string) {
    if (!confirm('Delete this subcategory?')) return
    const res = await fetch(`/api/admin/categories/${subId}?type=subcategory`, { method: 'DELETE' })
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId
            ? { ...c, recipe_subcategories: c.recipe_subcategories.filter((s) => s.id !== subId) }
            : c
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Category table */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] overflow-hidden">
        {categories.length === 0 ? (
          <div className="py-12 text-center text-[#6D5E6D]">No categories yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EBD2AD] bg-[#FCFFEB]">
                <th className="text-left px-4 py-3 font-semibold text-[#201D20]">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-[#201D20]">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-[#201D20]">Subcategories</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <>
                  <tr
                    key={cat.id}
                    className="border-b border-[#EBD2AD] last:border-0 hover:bg-[#FCFFEB] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#201D20]">{cat.name}</td>
                    <td className="px-4 py-3 text-[#6D5E6D] font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3 text-[#6D5E6D]">
                      {cat.recipe_subcategories.length}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                          className="text-xs text-[#C58930] hover:underline"
                        >
                          {expandedId === cat.id ? 'Collapse' : 'Manage subcategories'}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === cat.id && (
                    <tr key={`${cat.id}-sub`} className="bg-[#FCFFEB] border-b border-[#EBD2AD]">
                      <td colSpan={4} className="px-6 py-4">
                        <p className="text-xs font-semibold text-[#6D5E6D] uppercase tracking-wider mb-3">
                          Subcategories of {cat.name}
                        </p>

                        {cat.recipe_subcategories.length > 0 ? (
                          <div className="space-y-1 mb-4">
                            {cat.recipe_subcategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between bg-white rounded-lg border border-[#EBD2AD] px-3 py-2"
                              >
                                <div>
                                  <span className="text-sm font-medium text-[#201D20]">{sub.name}</span>
                                  <span className="ml-2 text-xs font-mono text-[#6D5E6D]">{sub.slug}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[#6D5E6D] mb-4">No subcategories yet.</p>
                        )}

                        {/* Add subcategory inline form */}
                        <form
                          onSubmit={(e) => handleAddSubcategory(e, cat.id)}
                          className="flex flex-wrap items-end gap-2"
                        >
                          <div>
                            <label className="block text-xs font-medium text-[#6D5E6D] mb-1">Name</label>
                            <input
                              type="text"
                              required
                              value={newSubName[cat.id] ?? ''}
                              onChange={(e) => setNewSubName((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                              placeholder="Subcategory name"
                              className="px-3 py-1.5 rounded-lg border border-[#EBD2AD] text-sm text-[#201D20] bg-white focus:outline-none focus:ring-1 focus:ring-[#C58930]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#6D5E6D] mb-1">Slug (optional)</label>
                            <input
                              type="text"
                              value={newSubSlug[cat.id] ?? ''}
                              onChange={(e) => setNewSubSlug((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                              placeholder="auto-generated"
                              className="px-3 py-1.5 rounded-lg border border-[#EBD2AD] text-sm text-[#6D5E6D] bg-white font-mono focus:outline-none focus:ring-1 focus:ring-[#C58930]"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={addingSub[cat.id]}
                            className="px-4 py-1.5 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225] disabled:opacity-60 transition-colors"
                          >
                            {addingSub[cat.id] ? 'Adding…' : 'Add'}
                          </button>
                          {subError[cat.id] && (
                            <p className="text-xs text-red-600 w-full">{subError[cat.id]}</p>
                          )}
                        </form>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create new category */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6">
        <h2 className="text-base font-semibold text-[#201D20] mb-4">Add Category</h2>
        <form onSubmit={handleAddCategory} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-[#6D5E6D] mb-1">Name *</label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Cakes & Tortes"
              className="px-3 py-2 rounded-lg border border-[#EBD2AD] text-sm text-[#201D20] bg-[#FCFFEB] focus:outline-none focus:ring-1 focus:ring-[#C58930]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6D5E6D] mb-1">Slug (optional)</label>
            <input
              type="text"
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value)}
              placeholder="auto-generated"
              className="px-3 py-2 rounded-lg border border-[#EBD2AD] text-sm text-[#6D5E6D] bg-[#FCFFEB] font-mono focus:outline-none focus:ring-1 focus:ring-[#C58930]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6D5E6D] mb-1">Description</label>
            <input
              type="text"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Optional description"
              className="px-3 py-2 rounded-lg border border-[#EBD2AD] text-sm text-[#201D20] bg-[#FCFFEB] focus:outline-none focus:ring-1 focus:ring-[#C58930] w-64"
            />
          </div>
          <button
            type="submit"
            disabled={addingCat}
            className="px-5 py-2 rounded-lg bg-[#C58930] text-white text-sm font-medium hover:bg-[#A87225] disabled:opacity-60 transition-colors"
          >
            {addingCat ? 'Adding…' : 'Add Category'}
          </button>
          {catError && <p className="text-xs text-red-600 w-full">{catError}</p>}
        </form>
      </div>
    </div>
  )
}
