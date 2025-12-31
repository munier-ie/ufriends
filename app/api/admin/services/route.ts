import { NextRequest, NextResponse } from "next/server"
import { protect } from "@/lib/security"
import { requireAuth } from "@/lib/require-auth"
import { getAllServicesWithProviders } from "@/lib/services-config"

// GET /api/admin/services
// Returns the service catalogue enriched with providerInfo and availability
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const services = await getAllServicesWithProviders()
    return NextResponse.json({ ok: true, services })
  } catch (err) {
    return NextResponse.json({ error: "Failed to list services", detail: String(err) }, { status: 500 })
  }
}