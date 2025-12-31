function getDispositionFilename(res: Response): string | undefined {
  const disp = res.headers.get("Content-Disposition") || ""
  const m = disp.match(/filename="([^"]+)"/i)
  return m?.[1]
}

export async function downloadPdfViaServer(
  templateId: string,
  action: string,
  params: Record<string, any>,
  fileName?: string,
  data?: Record<string, any>
): Promise<void> {
  const res = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ templateId, action, params, fileName, data }),
  })

  if (!res.ok) {
    let msg = "Failed to generate PDF"
    try {
      const err = await res.json()
      msg = err?.error || msg
    } catch {}
    throw new Error(msg)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const suggested = getDispositionFilename(res)
  const fname = (fileName || suggested || `${action}-slip-${Date.now()}.pdf`)
  const a = document.createElement("a")
  a.href = url
  a.download = fname.endsWith(".pdf") ? fname : `${fname}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadPdfAuto(
  action: string,
  params: Record<string, any>,
  fileName?: string,
  slipType?: string
): Promise<void> {
  const r = await fetch("/api/templates/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, slipType }),
  })
  if (!r.ok) {
    let msg = "Failed to resolve template"
    try { const j = await r.json(); msg = j?.error || msg } catch {}
    throw new Error(msg)
  }
  const j = await r.json()
  const id = j?.templateId
  if (!id) throw new Error("Template ID missing")
  await downloadPdfViaServer(id, action, params, fileName)
}

export async function downloadPdfAutoWithData(
  action: string,
  data: Record<string, any>,
  fileName?: string,
  slipType?: string
): Promise<void> {
  const r = await fetch("/api/templates/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, slipType }),
  })
  if (!r.ok) {
    let msg = "Failed to resolve template"
    try { const j = await r.json(); msg = j?.error || msg } catch {}
    throw new Error(msg)
  }
  const j = await r.json()
  const id = j?.templateId
  if (!id) throw new Error("Template ID missing")
  await downloadPdfViaServer(id, action, {}, fileName, data)
}
