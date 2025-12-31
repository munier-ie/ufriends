"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { authFetch } from "@/lib/client-auth"
import { RefreshCcw, UploadCloud, Trash2, Image as ImageIcon } from "lucide-react"

type AssetFile = {
  name: string
  path: string
  url: string
  size: number
  modifiedAt: string
}

export default function AdminAssetsPage() {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<AssetFile[]>([])
  const [dir, setDir] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [fileInput, setFileInput] = useState<File | null>(null)

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dir) params.set("prefix", dir)
      const res = await authFetch(`/api/admin/assets?${params.toString()}`)
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed (${res.status})`)
      setFiles(json.files || [])
    } catch (err) {
      toast({ title: "Failed to list assets", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir])

  const upload = async () => {
    if (!fileInput) {
      toast({ title: "No file selected", variant: "destructive" })
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.set("file", fileInput)
      if (dir) form.set("dir", dir)
      const res = await authFetch(`/api/admin/assets`, { method: "POST", body: form })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed (${res.status})`)
      toast({ title: "Uploaded", description: json.file?.url || fileInput.name })
      setFileInput(null)
      await fetchFiles()
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const remove = async (f: AssetFile) => {
    if (!confirm(`Delete ${f.name}?`)) return
    try {
      const res = await authFetch(`/api/admin/assets`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: f.path }),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed (${res.status})`)
      await fetchFiles()
    } catch (err) {
      toast({ title: "Delete failed", description: String(err), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ImageIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground">Upload and manage images used by templates</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Folder (optional)</label>
              <Input placeholder="e.g. templates/nin" value={dir} onChange={(e) => setDir(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select file</label>
              <Input type="file" accept="image/*" onChange={(e) => setFileInput(e.target.files?.[0] || null)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={upload} disabled={uploading}><UploadCloud className="h-4 w-4 mr-2" /> Upload</Button>
              <Button variant="outline" onClick={fetchFiles} disabled={loading}><RefreshCcw className="h-4 w-4 mr-2" /> Refresh</Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">Uploaded files are saved under <Badge variant="secondary">/public/assets{dir ? `/${dir}` : ""}</Badge> and served at <Badge variant="secondary">/assets{dir ? `/${dir}` : ""}/filename</Badge>.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((f) => (
                <TableRow key={f.path}>
                  <TableCell>
                    <img src={f.url} alt={f.name} className="h-10 w-10 object-cover rounded" />
                  </TableCell>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-xs">{(f.size / 1024).toFixed(1)} KB</TableCell>
                  <TableCell className="text-xs">{new Date(f.modifiedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-sm underline">Open</a>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(f.url)}>Copy URL</Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(f)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No files</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}