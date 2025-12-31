"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type CatalogItem = {
  id: number
  category: string
  subservice: string
  variant: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminCatalogPage() {
  const router = useRouter()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItem | null>(null)
  const [form, setForm] = useState({ category: "", subservice: "", variant: "", description: "" })

  async function load() {
    try {
      setLoading(true)
      const url = filter ? `/api/service-catalog?category=${encodeURIComponent(filter)}` : "/api/service-catalog"
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setItems(data)
      setError(null)
    } catch (e: any) {
      setError(e?.message || "Failed to load catalog")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items])

  function openNew() {
    setEditing(null)
    setForm({ category: "", subservice: "", variant: "", description: "" })
    setDialogOpen(true)
  }
  function openEdit(item: CatalogItem) {
    setEditing(item)
    setForm({
      category: item.category,
      subservice: item.subservice,
      variant: item.variant || "",
      description: item.description || "",
    })
    setDialogOpen(true)
  }
  function closeDialog() { setDialogOpen(false) }

  async function save() {
    const payload = {
      category: form.category.trim(),
      subservice: form.subservice.trim(),
      variant: (form.variant || "").trim(),
      description: form.description?.trim() || undefined,
    }
    const url = editing ? `/api/admin/catalog/${editing.id}` : "/api/admin/catalog"
    const method = editing ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || `Request failed (${res.status})`)
      return
    }
    closeDialog()
    await load()
    // Notify pricing page (if any) to refresh dropdowns
    try {
      window.dispatchEvent(new CustomEvent("ufriends_catalog_updated"))
      localStorage.setItem("ufriends_service_catalog", JSON.stringify(items))
    } catch {}
  }

  async function remove(item: CatalogItem) {
    if (!confirm(`Delete ${item.category} / ${item.subservice} / ${item.variant || "(no variant)"}?`)) return
    const res = await fetch(`/api/admin/catalog/${item.id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || `Delete failed (${res.status})`)
      return
    }
    await load()
    try {
      window.dispatchEvent(new CustomEvent("ufriends_catalog_updated"))
      localStorage.setItem("ufriends_service_catalog", JSON.stringify(items))
    } catch {}
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Service Catalog</h1>
        <div className="flex items-center gap-2">
          <select className="border rounded px-2 py-1" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded" onClick={openNew}>Add</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 border">Category</th>
                <th className="text-left p-2 border">Subservice</th>
                <th className="text-left p-2 border">Variant</th>
                <th className="text-left p-2 border">Description</th>
                <th className="text-left p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{item.category}</td>
                  <td className="p-2 border">{item.subservice}</td>
                  <td className="p-2 border">{item.variant || ""}</td>
                  <td className="p-2 border">{item.description || ""}</td>
                  <td className="p-2 border">
                    <button className="text-blue-700 mr-3" onClick={() => openEdit(item)}>Edit</button>
                    <button className="text-red-700" onClick={() => remove(item)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded shadow-lg p-4 w-[480px]">
            <h2 className="text-lg font-semibold mb-3">{editing ? "Edit Entry" : "New Entry"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Category</label>
                <input className="w-full border rounded px-2 py-1" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Subservice</label>
                <input className="w-full border rounded px-2 py-1" value={form.subservice} onChange={e => setForm({ ...form, subservice: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Variant (optional)</label>
                <input className="w-full border rounded px-2 py-1" value={form.variant} onChange={e => setForm({ ...form, variant: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Description (optional)</label>
                <textarea className="w-full border rounded px-2 py-1" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-1 rounded border" onClick={closeDialog}>Cancel</button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}