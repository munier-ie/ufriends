"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { authFetch } from "@/lib/client-auth"
import { Trash2, RefreshCcw, CheckCircle2, XCircle, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type NinTemplate = {
  id: string
  name: string
  type: "digital" | "physical" | "nims"
  templateContent: string
  placeholders: string[]
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export default function AdminNinTemplatesPage() {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<NinTemplate[]>([])
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [name, setName] = useState("")
  const [type, setType] = useState<"digital" | "physical" | "nims">("digital")
  const [templateContent, setTemplateContent] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)

  // Real-data preview state
  const [isRealPreviewOpen, setIsRealPreviewOpen] = useState<boolean>(false)
  const [realReference, setRealReference] = useState<string>("")
  const [realMode, setRealMode] = useState<"current" | "stored">("current")
  const [realLoading, setRealLoading] = useState<boolean>(false)
  const [realError, setRealError] = useState<string | null>(null)
  const [realVerificationData, setRealVerificationData] = useState<any | null>(null)
  const [storedSlipHtml, setStoredSlipHtml] = useState<string | null>(null)
  const [realTemplateType, setRealTemplateType] = useState<"digital" | "physical" | "nims" | null>(null)

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [editType, setEditType] = useState<"digital" | "physical" | "nims">("digital")
  const [editContent, setEditContent] = useState<string>("")
  const [editActive, setEditActive] = useState<boolean>(true)
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  // Asset picker
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState<boolean>(false)
  const [assetLoading, setAssetLoading] = useState<boolean>(false)
  const [assets, setAssets] = useState<{ name: string; url: string; path: string }[]>([])
  const [assetDir, setAssetDir] = useState<string>("")

  const requiredPlaceholders = [
    "firstName",
    "lastName",
    "nin",
    "dateOfBirth",
    "gender",
    "issueDate",
    // Optional but recommended visual elements
    "photo",
    "qrCode",
  ]

  const detectedEditPlaceholders = useMemo(() => {
    const names = Array.from(editContent.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => m[1])
    return [...new Set(names)]
  }, [editContent])

  const missingRequired = useMemo(
    () => requiredPlaceholders.filter((p) => !detectedEditPlaceholders.includes(p)),
    [requiredPlaceholders, detectedEditPlaceholders],
  )

  const unknownPlaceholders = useMemo(
    () => detectedEditPlaceholders.filter((p) => !requiredPlaceholders.includes(p)),
    [requiredPlaceholders, detectedEditPlaceholders],
  )

  const extractedPlaceholders = useMemo(() => {
    const matches = Array.from(templateContent.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => `{{${m[1]}}}`)
    return [...new Set(matches)]
  }, [templateContent])

  const activeTemplateByType = useMemo(() => {
    if (!realTemplateType) return null
    return templates.find((t) => t.isActive && t.type === realTemplateType) || null
  }, [templates, realTemplateType])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter)
      params.set("pageSize", "50")
      const res = await authFetch(`/api/admin/nin-templates?${params.toString()}`)
      if (res.status === 401) {
        toast({ title: "Unauthorized", description: "Please log in as admin.", variant: "destructive" })
        setLoading(false)
        return
      }
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err) {
      toast({ title: "Failed to load templates", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter])

  const createTemplate = async () => {
    if (!name || !templateContent) {
      toast({ title: "Missing fields", description: "Name and content are required.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await authFetch("/api/admin/nin-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, templateContent, placeholders: extractedPlaceholders, isActive }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed: ${res.status}`)
      }
      toast({ title: "Template created", description: name })
      setName("")
      setTemplateContent("")
      setIsActive(true)
      setType("digital")
      await fetchTemplates()
    } catch (err) {
      toast({ title: "Create failed", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const buildPreviewHtml = (tpl: NinTemplate) => {
    const sample: Record<string, string> = {
      firstName: "John",
      middleName: "A.",
      lastName: "Doe",
      nin: "12345678901",
      dateOfBirth: "1990-01-01",
      gender: "MALE",
      issueDate: new Date().toISOString().slice(0, 10),
      photo: "/placeholder.jpg",
      qrCode: "SAMPLE-QR-CODE",
    }
    let html = tpl.templateContent
    for (const key of Object.keys(sample)) {
      const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g")
      html = html.replace(re, sample[key])
    }
    return sanitizeHtml(html)
  }

  const previewTemplate = (tpl: NinTemplate) => {
    const html = buildPreviewHtml(tpl)
    setPreviewHtml(html)
    setIsPreviewOpen(true)
  }

  const normalizeVerificationData = (raw: any) => {
    if (!raw) return {}
    const r = raw || {}
    const src = r.result || r.data || r
    const firstName = src.firstName || src.firstname || src.first_name || src.givenNames || src.given_name || ""
    const middleName = src.middleName || src.middlename || src.middle_name || src.otherNames || ""
    const lastName = src.lastName || src.lastname || src.last_name || src.surname || ""
    const nin = src.nin || src.ninNumber || src.nin_number || src.trackingId || src.tracking_id || src.nimcNin || ""
    const dateOfBirth = src.dateOfBirth || src.dob || src.birthDate || src.birth_date || ""
    const gender = (src.gender || src.sex || "").toString().toUpperCase()
    const phone = src.phone || src.msisdn || src.telephone || ""
    const address = src.address || src.residentialAddress || src.residential_address || src.homeAddress || ""
    const stateOfOrigin = src.stateOfOrigin || src.state_of_origin || src.state || ""
    const lga = src.lga || src.localGovt || src.local_government || ""
    const trackingId = src.trackingId || src.tracking_id || ""
    const issueDate = src.issueDate || src.issue_date || r.issueDate || ""
    const photoUrl = src.photoUrl || src.photo || src.imageUrl || src.image || ""
    const photoBase64 = src.photoBase64 || src.imageBase64 || ""
    const photo = photoUrl || (photoBase64 ? `data:image/png;base64,${photoBase64}` : "") || "/placeholder.jpg"
    const qrCode = src.qrCode || src.qr || r.qrCode || ""
    return {
      firstName,
      middleName,
      lastName,
      nin,
      dateOfBirth,
      gender,
      phone,
      address,
      stateOfOrigin,
      lga,
      trackingId,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      photo,
      qrCode,
    }
  }

  // Simple frontend HTML sanitizer to prevent basic XSS in previews
  const sanitizeHtml = (html: string): string => {
    if (!html) return ""
    // Remove script tags, onclick/onerror attributes, and iframes
    return html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
      .replace(/\bon\w+="[^"]*"/gim, "")
      .replace(/\bon\w+='[^']*'/gim, "")
      .replace(/\bjavascript:[^"']+/gim, "")
  }

  // Helper to render template content with actual data
  const renderWithData = (htmlContent: string, data: any): string => {
    let content = htmlContent || ""
    const normalized = normalizeVerificationData(data)
    const replacements: Record<string, any> = {
      "{{firstName}}": normalized.firstName || "",
      "{{lastName}}": normalized.lastName || "",
      "{{middleName}}": normalized.middleName || "",
      "{{nin}}": normalized.nin || "",
      "{{dateOfBirth}}": normalized.dateOfBirth || "",
      "{{gender}}": normalized.gender || "",
      "{{phone}}": normalized.phone || "",
      "{{address}}": normalized.address || "",
      "{{photo}}": normalized.photo || "/placeholder.jpg",
      "{{issueDate}}": normalized.issueDate || new Date().toISOString().slice(0, 10),
      "{{stateOfOrigin}}": normalized.stateOfOrigin || "",
      "{{lga}}": normalized.lga || "",
      "{{trackingId}}": normalized.trackingId || "",
      "{{qrCode}}": normalized.qrCode || "",
    }
    Object.entries(replacements).forEach(([ph, val]) => {
      content = content.replace(new RegExp(ph, "g"), String(val))
    })
    return sanitizeHtml(content)
  }

  const openRealPreview = () => {
    setIsRealPreviewOpen(true)
    setRealReference("")
    setRealMode("current")
    setRealError(null)
    setRealVerificationData(null)
    setStoredSlipHtml(null)
  }

  const loadRealPreview = async () => {
    if (!realReference) {
      setRealError("Enter a transaction reference")
      return
    }
    setRealLoading(true)
    setRealError(null)
    try {
      const res = await authFetch(`/api/admin/service/logs/${encodeURIComponent(realReference)}`)
      const json = await res.json()
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Failed (${res.status})`)
      }
      const meta = (json.transaction?.meta || {}) as any
      setRealVerificationData(meta?.verificationData || null)
      setStoredSlipHtml(meta?.slipData || null)
      setRealTemplateType((meta?.templateType as any) || null)
      if (!meta?.verificationData && !meta?.slipData) {
        setRealError("No verification or slip data found on transaction")
      }
    } catch (err: any) {
      setRealError(String(err?.message || err))
    } finally {
      setRealLoading(false)
    }
  }

  const openEdit = (tpl: NinTemplate) => {
    setEditId(tpl.id)
    setEditName(tpl.name)
    setEditType(tpl.type)
    setEditContent(tpl.templateContent)
    setEditActive(tpl.isActive)
    setIsEditOpen(true)
  }

  const fetchAssets = async () => {
    setAssetLoading(true)
    try {
      const params = new URLSearchParams()
      if (assetDir) params.set("prefix", assetDir)
      const res = await authFetch(`/api/admin/assets?${params.toString()}`)
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed (${res.status})`)
      setAssets((json.files || []).map((f: any) => ({ name: f.name, url: f.url, path: f.path })))
    } catch (err) {
      toast({ title: "Failed to load assets", description: String(err), variant: "destructive" })
    } finally {
      setAssetLoading(false)
    }
  }

  const saveEdit = async () => {
    if (!editId) return
    setLoading(true)
    try {
      const matches = Array.from(editContent.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => `{{${m[1]}}}`)
      const placeholders = [...new Set(matches)]
      const res = await authFetch(`/api/admin/nin-templates/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          type: editType,
          templateContent: editContent,
          isActive: editActive,
          placeholders,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed: ${res.status}`)
      }
      toast({ title: "Template updated", description: editName })
      setIsEditOpen(false)
      setEditId(null)
      await fetchTemplates()
    } catch (err) {
      toast({ title: "Update failed", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (tpl: NinTemplate) => {
    try {
      const res = await authFetch(`/api/admin/nin-templates/${tpl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tpl.isActive }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      await fetchTemplates()
    } catch (err) {
      toast({ title: "Update failed", description: String(err), variant: "destructive" })
    }
  }

  const deleteTemplate = async (tpl: NinTemplate) => {
    if (!confirm(`Delete template "${tpl.name}"?`)) return
    try {
      const res = await authFetch(`/api/admin/nin-templates/${tpl.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      await fetchTemplates()
    } catch (err) {
      toast({ title: "Delete failed", description: String(err), variant: "destructive" })
    }
  }

  const duplicateTemplate = async (tpl: NinTemplate) => {
    setLoading(true)
    try {
      // Extract placeholders from original content
      const matches = Array.from(tpl.templateContent.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => `{{${m[1]}}}`)
      const placeholders = [...new Set(matches)]
      const body = {
        name: `Copy of ${tpl.name}`,
        type: tpl.type,
        templateContent: tpl.templateContent,
        isActive: false,
        placeholders,
      }
      const res = await authFetch(`/api/admin/nin-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed: ${res.status}`)
      }
      toast({ title: "Template duplicated", description: body.name })
      await fetchTemplates()
    } catch (err) {
      toast({ title: "Duplicate failed", description: String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">NIN Templates</h1>
          <p className="text-muted-foreground">Manage templates used for NIN slip PDF generation</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Digital Slip v1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="nims">NIMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Template Content (HTML)</label>
            <Textarea rows={8} value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} placeholder="HTML with placeholders like {{firstName}}, {{lastName}}, {{nin}}" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm">Active</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Detected placeholders: {extractedPlaceholders.join(", ") || "<none>"}</div>
          <div className="mt-4">
            <Button onClick={createTemplate} disabled={loading}>Create Template</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Templates</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="nims">NIMS</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchTemplates} disabled={loading}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPreviewOpen && (
            <div className="border rounded-md p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Template Preview</div>
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>Close</Button>
              </div>
              <div className="bg-white border rounded p-4 overflow-auto" style={{ maxHeight: 500 }}>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Note: Images must exist in `public/`. Placeholders are filled with sample data.
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placeholders</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-medium">{tpl.name}</TableCell>
                  <TableCell className="capitalize">{tpl.type}</TableCell>
                  <TableCell>
                    {tpl.isActive ? (
                      <Badge className="bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>
                    ) : (
                      <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{tpl.placeholders?.join(", ") || "<none>"}</TableCell>
                  <TableCell className="text-xs">{new Date(tpl.updatedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(tpl)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => duplicateTemplate(tpl)}>Duplicate</Button>
                      <Button variant="outline" size="sm" onClick={() => previewTemplate(tpl)}>Preview</Button>
                      <Button variant="outline" size="sm" onClick={openRealPreview}>Real Preview</Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive(tpl)}>
                        {tpl.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteTemplate(tpl)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No templates found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit NIN Template</DialogTitle>
            <DialogDescription>Update template details and content. Placeholders auto-detect from HTML.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={editType} onValueChange={(v) => setEditType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="nims">NIMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Switch checked={editActive} onCheckedChange={setEditActive} />
            <span className="text-sm">Active</span>
          </div>
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Template Content (HTML)</label>
            <div className="grid gap-3 md:grid-cols-2">
              <Textarea ref={editTextareaRef} rows={8} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Placeholders</div>
                <div className="flex flex-wrap gap-2">
                  {["firstName", "middleName", "lastName", "nin", "dateOfBirth", "gender", "issueDate", "photo", "qrCode", "phone", "address", "stateOfOrigin", "lga", "trackingId"].map((ph) => (
                    <Button
                      key={ph}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const textarea = editTextareaRef.current
                        const insert = `{{${ph}}}`
                        if (textarea && typeof textarea.selectionStart === "number") {
                          const start = textarea.selectionStart
                          const end = textarea.selectionEnd
                          const before = editContent.slice(0, start)
                          const after = editContent.slice(end)
                          const next = before + insert + after
                          setEditContent(next)
                          requestAnimationFrame(() => {
                            textarea.selectionStart = textarea.selectionEnd = start + insert.length
                            textarea.focus()
                          })
                        } else {
                          setEditContent((prev) => prev + insert)
                        }
                      }}
                    >{`{{${ph}}}`}</Button>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <Input placeholder="assets subfolder (optional)" value={assetDir} onChange={(e) => setAssetDir(e.target.value)} />
                    <Button variant="outline" size="sm" onClick={() => { setIsAssetPickerOpen(true); fetchAssets() }}>Assets</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Validation hints */}
          <div className="mt-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              Required placeholders: {requiredPlaceholders.join(", ")}
            </div>
            {missingRequired.length > 0 && (
              <div className="text-xs text-red-600">
                Missing required placeholders: {missingRequired.join(", ")}
              </div>
            )}
            {unknownPlaceholders.length > 0 && (
              <div className="text-xs text-amber-600">
                Other detected placeholders: {unknownPlaceholders.join(", ")}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Detected placeholders: {Array.from(editContent.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => `{{${m[1]}}}`).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "<none>"}
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={loading || !editId || missingRequired.length > 0}>Save Changes</Button>
          </div>
          <div className="border rounded-md p-3 mt-4">
            <div className="text-sm font-medium mb-2">Live Preview (sample data)</div>
            <div className="bg-white border rounded p-4 overflow-auto" style={{ maxHeight: 300 }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const tpl: NinTemplate = {
                      id: editId || "",
                      name: editName,
                      type: editType,
                      templateContent: editContent,
                      placeholders: [],
                      isActive: editActive,
                      createdBy: "",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }
                    return buildPreviewHtml(tpl)
                  })(),
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">Images must exist in `public/`.</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Real-data Preview Dialog */}
      <Dialog open={isRealPreviewOpen} onOpenChange={setIsRealPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Real Data Preview</DialogTitle>
            <DialogDescription>Render a template using actual verification/slip data from a transaction reference.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Reference</label>
              <Input value={realReference} onChange={(e) => setRealReference(e.target.value)} placeholder="e.g., NIN-169..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview Mode</label>
              <div className="flex items-center gap-2">
                <Button variant={realMode === "current" ? "default" : "outline"} size="sm" onClick={() => setRealMode("current")}>Use current template</Button>
                <Button variant={realMode === "stored" ? "default" : "outline"} size="sm" onClick={() => setRealMode("stored")}>Use stored slip</Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadRealPreview} disabled={realLoading}>Load</Button>
            {realReference && (
              <a href={`/api/verification/nin-slip/${encodeURIComponent(realReference)}/pdf`} target="_blank" rel="noreferrer" className="text-sm underline">
                Open PDF endpoint
              </a>
            )}
          </div>
          {realError && <div className="text-sm text-red-600">{realError}</div>}
          <div className="border rounded-md p-3 mt-3">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="bg-white border rounded p-4 overflow-auto" style={{ maxHeight: 400 }}>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    realMode === "stored"
                      ? sanitizeHtml(storedSlipHtml || "<div class='text-muted-foreground text-sm'>No stored slip HTML for this reference.</div>")
                      : (realVerificationData
                        ? (() => {
                          const baseContent = activeTemplateByType?.templateContent || editContent || templateContent || ""
                          return renderWithData(baseContent, realVerificationData)
                        })()
                        : "<div class='text-muted-foreground text-sm'>Load a reference to render with current template.</div>")
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">Note: "Use current template" renders with the editor content; "Use stored slip" shows server-processed HTML if available.</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Picker Dialog */}
      <Dialog open={isAssetPickerOpen} onOpenChange={setIsAssetPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assets</DialogTitle>
            <DialogDescription>Select an image to insert into the template</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-3">
            <Input className="flex-1" placeholder="assets subfolder (optional)" value={assetDir} onChange={(e) => setAssetDir(e.target.value)} />
            <Button variant="outline" onClick={fetchAssets} disabled={assetLoading}><RefreshCcw className="h-4 w-4 mr-2" /> Refresh</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {assets.map((a) => (
              <div key={a.path} className="border rounded p-2 flex flex-col gap-2">
                <img src={a.url} alt={a.name} className="h-24 w-full object-cover rounded" />
                <div className="text-xs truncate" title={a.name}>{a.name}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const insert = `<img src='${a.url}' alt='${a.name}' />`
                    const textarea = editTextareaRef.current
                    if (textarea && typeof textarea.selectionStart === "number") {
                      const start = textarea.selectionStart
                      const end = textarea.selectionEnd
                      const before = editContent.slice(0, start)
                      const after = editContent.slice(end)
                      const next = before + insert + after
                      setEditContent(next)
                      requestAnimationFrame(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + insert.length
                        textarea.focus()
                      })
                    } else {
                      setEditContent((prev) => prev + insert)
                    }
                    setIsAssetPickerOpen(false)
                  }}>Insert &lt;img&gt;</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const insert = `style=\"background-image: url('${a.url}');\"`
                    const textarea = editTextareaRef.current
                    const attr = insert
                    if (textarea && typeof textarea.selectionStart === "number") {
                      const start = textarea.selectionStart
                      const end = textarea.selectionEnd
                      const before = editContent.slice(0, start)
                      const after = editContent.slice(end)
                      const next = before + attr + after
                      setEditContent(next)
                      requestAnimationFrame(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + attr.length
                        textarea.focus()
                      })
                    } else {
                      setEditContent((prev) => prev + attr)
                    }
                    setIsAssetPickerOpen(false)
                  }}>Insert bg</Button>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="text-sm text-muted-foreground col-span-full">No assets found. Upload images in Admin → Assets.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}