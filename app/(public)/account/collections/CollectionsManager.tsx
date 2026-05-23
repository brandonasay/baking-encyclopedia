'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Collection } from '@/lib/database.types'
import {
  Plus, Pencil, Trash2, Globe, Lock, ChevronRight,
  Check, X, Loader2,
} from 'lucide-react'

type CollectionWithCount = Collection & {
  collection_items: { count: number }[]
}

type Props = {
  collections: CollectionWithCount[]
}

function getItemCount(c: CollectionWithCount): number {
  return c.collection_items?.[0]?.count ?? 0
}

export default function CollectionsManager({ collections: initial }: Props) {
  const [collections, setCollections] = useState<CollectionWithCount[]>(initial)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // Per-collection editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/user/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const { collection } = await res.json()
      setCollections((prev) => [{ ...collection, collection_items: [] }, ...prev])
      setNewName('')
      setShowNewForm(false)
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  // -------------------------------------------------------------------------
  // Rename
  // -------------------------------------------------------------------------
  async function handleRename(id: string) {
    if (!editName.trim()) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/user/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to rename')
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c))
      )
      setEditingId(null)
    } catch {
      // silent
    } finally {
      setLoadingId(null)
    }
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  async function handleDelete(id: string) {
    if (!confirm('Delete this collection?')) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/user/collections/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setCollections((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // silent
    } finally {
      setLoadingId(null)
    }
  }

  // -------------------------------------------------------------------------
  // Toggle public
  // -------------------------------------------------------------------------
  async function handleTogglePublic(col: CollectionWithCount) {
    setLoadingId(col.id)
    try {
      const res = await fetch(`/api/user/collections/${col.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !col.is_public }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, is_public: !col.is_public } : c))
      )
    } catch {
      // silent
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      {/* New collection button / form */}
      {!showNewForm ? (
        <button
          onClick={() => setShowNewForm(true)}
          className="mb-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C58930] hover:bg-[#a87225] text-white font-medium text-sm transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex items-center gap-3 p-4 bg-white rounded-xl border border-[#EBD2AD]"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            autoFocus
            className="flex-1 px-3 py-2 rounded-lg border border-[#EBD2AD] bg-[#FCFFEB] text-sm text-[#201D20] focus:outline-none focus:ring-2 focus:ring-[#C58930]/40"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-4 py-2 rounded-lg bg-[#C58930] hover:bg-[#a87225] text-white text-sm font-medium disabled:opacity-60 flex items-center gap-1.5"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create
          </button>
          <button
            type="button"
            onClick={() => { setShowNewForm(false); setNewName('') }}
            className="p-2 rounded-lg hover:bg-[#FCFFEB] text-[#6D5E6D]"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Empty state */}
      {collections.length === 0 && (
        <div className="text-center py-20 text-[#6D5E6D]">
          <p className="mb-2 text-lg font-medium text-[#201D20]" style={{ fontFamily: 'var(--font-playfair)' }}>
            No collections yet
          </p>
          <p className="text-sm">Create a collection to group your favourite recipes.</p>
        </div>
      )}

      {/* Collection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {collections.map((col) => {
          const isLoading = loadingId === col.id
          const isEditing = editingId === col.id
          const count = getItemCount(col)

          return (
            <div
              key={col.id}
              className="bg-white rounded-xl border border-[#EBD2AD] p-5 flex flex-col gap-3"
            >
              {/* Name / edit */}
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#EBD2AD] text-sm text-[#201D20] focus:outline-none focus:ring-2 focus:ring-[#C58930]/40"
                  />
                  <button
                    onClick={() => handleRename(col.id)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-[#C58930] text-white disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg hover:bg-[#FCFFEB] text-[#6D5E6D]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/account/collections/${col.id}`}
                    className="text-base font-semibold text-[#201D20] hover:text-[#C58930] transition-colors duration-150 line-clamp-1"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {col.name}
                  </Link>
                  <Link
                    href={`/account/collections/${col.id}`}
                    className="shrink-0 text-[#6D5E6D] hover:text-[#C58930]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-2 text-xs text-[#6D5E6D]">
                <span>{count} {count === 1 ? 'recipe' : 'recipes'}</span>
                <span>·</span>
                <button
                  onClick={() => handleTogglePublic(col)}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors duration-150 ${
                    col.is_public
                      ? 'bg-[#EEF3EA] text-[#41622D] border-[#B5C9A8] hover:bg-[#DCE8D5]'
                      : 'bg-[#FCFFEB] text-[#6D5E6D] border-[#EBD2AD] hover:border-[#C58930]'
                  } disabled:opacity-60`}
                >
                  {col.is_public ? (
                    <><Globe className="w-3 h-3" /> Public</>
                  ) : (
                    <><Lock className="w-3 h-3" /> Private</>
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#EBD2AD]">
                <button
                  onClick={() => { setEditingId(col.id); setEditName(col.name) }}
                  className="inline-flex items-center gap-1 text-xs text-[#6D5E6D] hover:text-[#C58930] transition-colors duration-150"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </button>
                <span className="text-[#EBD2AD]">|</span>
                <button
                  onClick={() => handleDelete(col.id)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 text-xs text-[#6D5E6D] hover:text-red-600 transition-colors duration-150 disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
