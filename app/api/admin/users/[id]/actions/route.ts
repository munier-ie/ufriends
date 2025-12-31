import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"

// Centralized Arcjet protection via shared helper

// POST /api/admin/users/[id]/actions - suspend/verify/activate (audit only)
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const { id } = await context.params
    // Parse body FIRST to avoid any stream consumption issues
    // Prefer reading from a cloned request to avoid any prior stream usage edge-cases
    let body: any = {}
    let parsedFrom: "json" | "text" | "form" | "none" = "none"
    try {
      body = await req.clone().json()
      parsedFrom = "json"
    } catch {
      // Try form data
      try {
        const fd = await req.clone().formData()
        const entries: Record<string, any> = {}
        for (const [k, v] of Array.from(fd.entries())) entries[k] = v
        body = entries
        parsedFrom = "form"
      } catch {
        // Fallback: try to parse raw text if json/form fails
        try {
          const raw = await req.clone().text()
          // Handle urlencoded like: action=SUSPEND&note=...
          if (raw.includes("=") && !raw.trim().startsWith("{")) {
            const params = new URLSearchParams(raw)
            const obj: Record<string, string> = {}
            params.forEach((val, key) => { obj[key] = val })
            body = obj
            parsedFrom = "text"
          } else {
            body = JSON.parse(raw)
            parsedFrom = "text"
          }
        } catch {
          body = {}
          parsedFrom = "none"
        }
      }
    }
    const url = new URL(req.url)
    const actionParam = url.searchParams.get("action")
    const headerAction = req.headers.get("x-action")
    const action = String((body?.action ?? actionParam ?? headerAction ?? "")).trim().toUpperCase()
    const note = body?.note as string | undefined

    // Clone the request to avoid body consumption issues
    const sec = await protect(req.clone() as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!id || !action || !["SUSPEND", "VERIFY", "ACTIVATE"].includes(action)) {
      // Diagnostic payload to help identify parsing issues
      const contentType = req.headers.get("content-type") || ""
      return NextResponse.json({
        error: "Invalid action",
        details: {
          parsedFrom,
          contentType,
          actionParam: actionParam || null,
          headerAction: headerAction || null,
          bodyKeys: Object.keys(body || {}),
          previewBody: body || null,
        },
      }, { status: 400 })
    }

    // Ensure the user exists
    const exists = await prisma.user.findUnique({ where: { id } })
    if (!exists) return NextResponse.json({ error: "User not found" }, { status: 404 })

    await prisma.auditLog
      .create({
        data: {
          actorId: auth.user.id,
          action: `USER_${action}`,
          resourceType: "User",
          resourceId: id,
          diffJson: { note },
        },
      })
      .catch(() => { })

    // Persistent status update
    const newStatus = action === "SUSPEND" ? "suspended" : action === "VERIFY" ? "active" : "active"

    await prisma.user.update({
      where: { id },
      data: { status: newStatus }
    })

    return NextResponse.json({ ok: true, user: { id, status: newStatus } })
  } catch (err) {
    return NextResponse.json({ error: "Action failed", detail: String(err) }, { status: 500 })
  }
}