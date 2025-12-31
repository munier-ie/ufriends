import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { getAllServicesWithProviders } from "@/lib/services-config"

// GET /api/admin/services/availability
// Provides current availability with a lightweight provider base URL ping when available
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const services = await getAllServicesWithProviders()

    const results = await Promise.all(
      services.map(async (svc) => {
        const provider = svc.providerInfo?.provider || null
        let providerHealth: "unknown" | "ok" | "unreachable" = "unknown"
        if (provider?.apiBaseUrl) {
          try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 3000)
            const res = await fetch(provider.apiBaseUrl, { method: "GET", signal: controller.signal })
            clearTimeout(timeout)
            providerHealth = res.ok ? "ok" : "unreachable"
          } catch {
            providerHealth = "unreachable"
          }
        }
        return {
          id: svc.id,
          name: svc.name,
          isAvailable: !!svc.isAvailable,
          provider: provider ? { id: provider.id, name: provider.name } : null,
          providerHealth,
        }
      })
    )

    return NextResponse.json({ ok: true, services: results })
  } catch (err) {
    return NextResponse.json({ error: "Failed to check availability", detail: String(err) }, { status: 500 })
  }
}