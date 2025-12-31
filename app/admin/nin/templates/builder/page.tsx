"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { authFetch } from "@/lib/client-auth"

type Elem = {
  id: string
  type: "text" | "image" | "placeholder" | "box"
  x: number
  y: number
  w?: number
  h?: number
  content?: string
  style?: {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    color?: string
  }
}

const DEFAULT_PLACEHOLDERS = [
  "generated_at","full_name","image",
  "firstName","middleName","lastName","nin","dateOfBirth","gender","issueDate","qrCode","phone","address","stateOfOrigin","lga","trackingId",
  "data.bvn","data.nin","data.firstName","data.lastName","data.middleName",
  "data.dateOfBirth","data.gender","data.phoneNumber1","data.phoneNumber2","data.email",
  "data.enrollmentBank","data.enrollmentBranch",
  "data.registrationDate","data.residentialAddress","data.stateOfResidence","data.lgaOfResidence",
  "data.stateOfOrigin","data.lgaOfOrigin",
  "verification.status","verification.reference",
]

const isImagePlaceholder = (ph?: string) => !!ph && (ph === "photo" || ph === "image" || ph === "qrCode")

export default function TemplateBuilderPage() {
  const [name, setName] = useState("")
  const [type, setType] = useState<"digital" | "physical" | "nims">("digital")
  const [isActive, setIsActive] = useState(true)
  const [canvasElems, setCanvasElems] = useState<Elem[]>([])
  const [bgColor, setBgColor] = useState<string>("#ffffff")
  const [bgUrl, setBgUrl] = useState<string>("")
  const [placeholders, setPlaceholders] = useState<string[]>(DEFAULT_PLACEHOLDERS)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{dx: number, dy: number}>({ dx: 0, dy: 0 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [textValue, setTextValue] = useState<string>("")
  const [globalFontFamily, setGlobalFontFamily] = useState<string>("Segoe UI, Arial, sans-serif")
  const [globalFontSize, setGlobalFontSize] = useState<number>(12)
  const [globalColor, setGlobalColor] = useState<string>("#000000")
  const [canvasW, setCanvasW] = useState<number>(794)
  const [canvasH, setCanvasH] = useState<number>(1123)
  const [bgFit, setBgFit] = useState<string>("contain")
  const [useImageSize, setUseImageSize] = useState<boolean>(true)

  const addElem = (e: Elem) => setCanvasElems((prev) => [...prev, e])
  const removeSelected = () => selectedId && setCanvasElems((prev) => prev.filter((el) => el.id !== selectedId))

  const onMouseDown = (id: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragId(id)
    setSelectedId(id)
    setDragOffset({ dx: e.clientX - rect.left, dy: e.clientY - rect.top })
  }
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragId || !canvasRef.current) return
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - canvasRect.left - dragOffset.dx, canvasRect.width - 10))
    const y = Math.max(0, Math.min(e.clientY - canvasRect.top - dragOffset.dy, canvasRect.height - 10))
    setCanvasElems((prev) => prev.map((el) => el.id === dragId ? { ...el, x, y } : el))
  }, [dragId, dragOffset])
  const onMouseUp = () => setDragId(null)

  const selected = useMemo(() => canvasElems.find((e) => e.id === selectedId) || null, [canvasElems, selectedId])

  const updateSelectedContent = (val: string) => {
    if (!selectedId) return
    setCanvasElems((prev) => prev.map((el) => el.id === selectedId ? { ...el, content: val } : el))
  }

  const toHtml = (): string => {
    const elemsHtml = canvasElems.map((el) => {
      const baseStyle = `position:absolute; left:${Math.round(el.x)}px; top:${Math.round(el.y)}px;`
      const fontStyle = el.style ? ` font-family:${el.style.fontFamily || globalFontFamily}; font-size:${el.style.fontSize || globalFontSize}px; color:${el.style.color || globalColor}; ${el.style.fontWeight ? `font-weight:${el.style.fontWeight};` : ""}` : ` font-family:${globalFontFamily}; font-size:${globalFontSize}px; color:${globalColor};`
      if (el.type === "text") {
        const sizeStyle = ` ${el.w ? `width:${el.w}px;` : ""}${el.h ? `height:${el.h}px;` : ""}`
        return `<div style='${baseStyle};${fontStyle}${sizeStyle}'>${(el.content || "Text")}</div>`
      }
      if (el.type === "image") {
        const src = el.content || "/placeholder.jpg"
        return `<img src='${src}' style='${baseStyle}; width:${el.w || 100}px; height:${el.h || 80}px; object-fit:cover;' />`
      }
      if (el.type === "placeholder") {
        const ph = el.content || "firstName"
        if (isImagePlaceholder(ph)) {
          return `<img src='{{${ph}}}' style='${baseStyle}; width:${el.w || 100}px; height:${el.h || 80}px; object-fit:cover;' />`
        }
        const sizeStyle = ` width:${el.w || 160}px; height:${el.h || 24}px;`
        return `<div style='${baseStyle};${fontStyle}${sizeStyle}'>{{${ph}}}</div>`
      }
      if (el.type === "box") {
        return `<div style='${baseStyle}; width:${el.w || 160}px; height:${el.h || 80}px; border:1px solid #333;'></div>`
      }
      return ""
    }).join("")
    const bg = normalizeAssetUrl(bgUrl)
    const bgImg = bg ? `<img src='${bg}' style='position:absolute;left:0;top:0;width:100%;height:100%;object-fit:${bgFit};' />` : ""
    const pageStyle = `<style>@page{size:${canvasW}px ${canvasH}px;margin:0}html,body{margin:0;padding:0}</style>`
    return `<!DOCTYPE html><html><head><meta charset='utf-8'>${pageStyle}</head><body style='background:${bgColor};'><div style='position:relative;width:${canvasW}px;height:${canvasH}px;'>${bgImg}${elemsHtml}</div></body></html>`
  }

  const saveTemplate = async () => {
    if (!name) { toast({ title: "Name required", description: "Enter a template name", variant: "destructive" }); return }
    const html = toHtml()
    const detected = Array.from(html.matchAll(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g)).map((m) => `{{${m[1]}}}`)
    const uniqPh = [...new Set(detected)]
    try {
      const res = await authFetch("/api/admin/nin-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, templateContent: html, placeholders: uniqPh, isActive }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Failed (${res.status})`)
      }
      toast({ title: "Template saved", description: name })
      setCanvasElems([])
      setName("")
      setType("digital")
      setIsActive(true)
    } catch (err: any) {
      toast({ title: "Save failed", description: String(err?.message || err), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <span className="text-primary text-sm">Builder</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold">NIN Template Builder</h1>
          <p className="text-muted-foreground">Drag placeholders and elements to compose a slip visually</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[240px_1fr_260px] gap-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Digital Slip v2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="nims">NIMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm">Active</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Background</label>
                <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Global Font</label>
                <Select value={globalFontFamily} onValueChange={(v) => setGlobalFontFamily(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Segoe UI, Arial, sans-serif">Segoe UI</SelectItem>
                    <SelectItem value="Arial, Helvetica, sans-serif">Arial</SelectItem>
                    <SelectItem value="Roboto, Arial, sans-serif">Roboto</SelectItem>
                    <SelectItem value="Times New Roman, Times, serif">Times New Roman</SelectItem>
                    <SelectItem value="Verdana, Geneva, sans-serif">Verdana</SelectItem>
                    <SelectItem value="Tahoma, Geneva, sans-serif">Tahoma</SelectItem>
                    <SelectItem value="Calibri, Arial, sans-serif">Calibri</SelectItem>
                    <SelectItem value="Georgia, Times, serif">Georgia</SelectItem>
                    <SelectItem value="Courier New, Courier, monospace">Courier New</SelectItem>
                    <SelectItem value="Open Sans, Arial, sans-serif">Open Sans</SelectItem>
                    <SelectItem value="Inter, Arial, sans-serif">Inter</SelectItem>
                    <SelectItem value="Poppins, Arial, sans-serif">Poppins</SelectItem>
                    <SelectItem value="Montserrat, Arial, sans-serif">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs">Size</label>
                    <Input type="number" value={globalFontSize} onChange={(e) => setGlobalFontSize(Number(e.target.value) || 12)} />
                  </div>
                  <div>
                    <label className="text-xs">Color</label>
                    <Input type="color" value={globalColor} onChange={(e) => setGlobalColor(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Background Image URL</label>
                <Input value={bgUrl} onChange={(e) => setBgUrl(normalizeAssetUrl(e.target.value))} placeholder="/assets/nin/premium.png" />
                <div className="text-xs text-muted-foreground">Upload in Admin → Assets, then paste the file URL here.</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Canvas Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs">Width</label>
                    <Input type="number" value={canvasW} onChange={(e) => setCanvasW(Number(e.target.value) || 794)} />
                  </div>
                  <div>
                    <label className="text-xs">Height</label>
                    <Input type="number" value={canvasH} onChange={(e) => setCanvasH(Number(e.target.value) || 1123)} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={useImageSize} onCheckedChange={setUseImageSize} />
                  <span className="text-xs">Use image intrinsic size</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Background Fit</label>
                <Select value={bgFit} onValueChange={(v) => setBgFit(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Element</label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => addElem({ id: crypto.randomUUID(), type: "text", x: 20, y: 20, content: "Text" })}>Text</Button>
                  <Button variant="outline" size="sm" onClick={() => addElem({ id: crypto.randomUUID(), type: "image", x: 40, y: 40, w: 120, h: 80, content: "/placeholder.jpg" })}>Image</Button>
                  <Button variant="outline" size="sm" onClick={() => addElem({ id: crypto.randomUUID(), type: "box", x: 60, y: 60, w: 160, h: 80 })}>Box</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Placeholders</label>
                <div className="grid grid-cols-2 gap-2">
                  {placeholders.map((ph) => (
                    <Button key={ph} variant="secondary" size="sm" onClick={() => addElem({ id: crypto.randomUUID(), type: "placeholder", x: 80, y: 80, content: ph, w: isImagePlaceholder(ph) ? 110 : 140, h: isImagePlaceholder(ph) ? 110 : 20, style: { fontFamily: globalFontFamily, fontSize: globalFontSize, color: globalColor } })}>{`{{${ph}}}`}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Placeholder</label>
                <div className="flex items-center gap-2">
                  <Input value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="e.g., nin" />
                  <Button variant="outline" size="sm" onClick={() => textValue && addElem({ id: crypto.randomUUID(), type: "placeholder", x: 100, y: 100, content: textValue, w: isImagePlaceholder(textValue) ? 110 : 140, h: isImagePlaceholder(textValue) ? 110 : 20, style: { fontFamily: globalFontFamily, fontSize: globalFontSize, color: globalColor } })}>Add</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Export HTML</label>
                <Textarea readOnly rows={6} value={toHtml()} />
              </div>
              <Button onClick={saveTemplate}>Save Template</Button>
            </div>

            <div>
              <div
                ref={canvasRef}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                style={{ background: bgColor, width: canvasW, height: canvasH }}
                className="relative border rounded-md overflow-hidden bg-white"
              >
                {bgUrl ? (
                  <img
                    src={normalizeAssetUrl(bgUrl)}
                    alt="bg"
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: bgFit as any }}
                    onLoad={(e) => {
                      if (!useImageSize) return
                      const img = e.currentTarget as HTMLImageElement
                      const nw = img.naturalWidth || canvasW
                      const nh = img.naturalHeight || canvasH
                      if (nw && nh) { setCanvasW(nw); setCanvasH(nh) }
                    }}
                  />
                ) : null}
                {canvasElems.map((el) => (
                  <div
                    key={el.id}
                    onMouseDown={(e) => onMouseDown(el.id, e)}
                    onClick={() => setSelectedId(el.id)}
                    className={`cursor-move ${selectedId === el.id ? "ring-2 ring-primary" : ""}`}
                    style={{ position: "absolute", left: el.x, top: el.y }}
                  >
                    {el.type === "text" && <div className="bg-white/70 px-2 py-1" style={{ width: el.w || undefined, height: el.h || undefined, fontFamily: el.style?.fontFamily || globalFontFamily, fontSize: (el.style?.fontSize || globalFontSize), color: el.style?.color || globalColor, fontWeight: el.style?.fontWeight }}>{el.content || "Text"}</div>}
                    {el.type === "image" && <img src={el.content || "/placeholder.jpg"} width={el.w || 100} height={el.h || 80} alt="img" className="border" />}
                    {el.type === "placeholder" && (isImagePlaceholder(el.content || "") ? <div style={{ width: el.w || 100, height: el.h || 80 }} className="border bg-amber-50 flex items-center justify-center text-xs">{`{{${el.content}}}`}</div> : <div className="bg-amber-50 border border-amber-200 px-2 py-1" style={{ width: el.w || 140, height: el.h || 20, fontFamily: el.style?.fontFamily || globalFontFamily, fontSize: (el.style?.fontSize || globalFontSize), color: el.style?.color || globalColor, fontWeight: el.style?.fontWeight }}>{`{{${el.content}}}`}</div>)}
                    {el.type === "box" && <div style={{ width: el.w || 160, height: el.h || 80 }} className="border border-dashed bg-white/30" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Selected</div>
                {selected ? (
                  <div className="space-y-2 text-sm">
                    <div>Type: {selected.type}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs">X</label>
                        <Input type="number" value={Math.round(selected.x)} onChange={(e) => setCanvasElems((prev) => prev.map((el) => el.id === selected.id ? { ...el, x: Number(e.target.value) } : el))} />
                      </div>
                      <div>
                        <label className="text-xs">Y</label>
                        <Input type="number" value={Math.round(selected.y)} onChange={(e) => setCanvasElems((prev) => prev.map((el) => el.id === selected.id ? { ...el, y: Number(e.target.value) } : el))} />
                      </div>
                      {(selected.type === "image" || selected.type === "box" || selected.type === "placeholder") && (
                        <>
                          <div>
                            <label className="text-xs">W</label>
                            <Input type="number" value={selected.w || 0} onChange={(e) => setCanvasElems((prev) => prev.map((el) => el.id === selected.id ? { ...el, w: Number(e.target.value) } : el))} />
                          </div>
                          <div>
                            <label className="text-xs">H</label>
                            <Input type="number" value={selected.h || 0} onChange={(e) => setCanvasElems((prev) => prev.map((el) => el.id === selected.id ? { ...el, h: Number(e.target.value) } : el))} />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Content</label>
                      <Input value={selected.content || ""} onChange={(e) => updateSelectedContent(e.target.value)} />
                    </div>
                    {(selected.type === "text" || selected.type === "placeholder") && !isImagePlaceholder(selected.content || "") && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs">Font</label>
                          <Select value={selected.style?.fontFamily || globalFontFamily} onValueChange={(v) => setCanvasElems((prev) => prev.map((el) => el.id === selected.id ? { ...el, style: { ...(el.style || {}), fontFamily: v } } : el))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Segoe UI, Arial, sans-serif">Segoe UI</SelectItem>
                              <SelectItem value="Arial, Helvetica, sans-serif">Arial</SelectItem>
                              <SelectItem value="Roboto, Arial, sans-serif">Roboto</SelectItem>
                              <SelectItem value="Times New Roman, Times, serif">Times New Roman</SelectItem>
                              <SelectItem value="Verdana, Geneva, sans-serif">Verdana</SelectItem>
                              <SelectItem value="Tahoma, Geneva, sans-serif">Tahoma</SelectItem>
                              <SelectItem value="Calibri, Arial, sans-serif">Calibri</SelectItem>
                              <SelectItem value="Georgia, Times, serif">Georgia</SelectItem>
                              <SelectItem value="Courier New, Courier, monospace">Courier New</SelectItem>
                              <SelectItem value="Open Sans, Arial, sans-serif">Open Sans</SelectItem>
                              <SelectItem value="Inter, Arial, sans-serif">Inter</SelectItem>
                              <SelectItem value="Poppins, Arial, sans-serif">Poppins</SelectItem>
                              <SelectItem value="Montserrat, Arial, sans-serif">Montserrat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs">Size</label>
                          <Input type="number" value={selected.style?.fontSize || globalFontSize} onChange={(e) => setCanvasElems((prev) => prev.map((el) => el.id === selected.id ? { ...el, style: { ...(el.style || {}), fontSize: Number(e.target.value) || globalFontSize } } : el))} />
                        </div>
                        <div>
                          <label className="text-xs">Color</label>
                          <Input type="color" value={selected.style?.color || globalColor} onChange={(e) => setCanvasElems((prev) => prev.map((el) => el.id === selected.id ? { ...el, style: { ...(el.style || {}), color: e.target.value } } : el))} />
                        </div>
                        <div>
                          <label className="text-xs">Weight</label>
                          <Input type="number" value={selected.style?.fontWeight || 400} onChange={(e) => setCanvasElems((prev) => prev.map((el) => el.id === selected.id ? { ...el, style: { ...(el.style || {}), fontWeight: Number(e.target.value) || 400 } } : el))} />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={removeSelected}>Delete</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Click an element to edit</div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Guidance</div>
                <div className="text-xs text-muted-foreground">
                  Use placeholders like {"{{data.bvn}}"}, {"{{data.firstName}}"}, {"{{data.dateOfBirth}}"}. Dot paths are supported: e.g. {"{{verification.reference}}"}. Saved templates appear in Admin → NIN Templates.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
  const normalizeAssetUrl = (u: string) => {
    try {
      let s = String(u || "").trim()
      s = s.replace(/\\\\/g, "/").replace(/\\/g, "/")
      return s
    } catch {
      return u
    }
  }
