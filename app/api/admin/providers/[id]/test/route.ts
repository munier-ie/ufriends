import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { PremblyClient } from "@/lib/prembly"
import { SubAndGainClient } from "@/lib/providers/subandgain"
import { requireAuth } from "@/lib/require-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Require ADMIN role using shared helper (supports JWT or NextAuth session)
    const auth = await requireAuth(request, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const provider = await prisma.serviceProvider.findUnique({
      where: { id },
      include: { apiKeys: true }
    })

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    const config = (provider.configJson as Record<string, any>) || {}
    const adapter = config.adapter || provider.name.toLowerCase()

    let testResult: any = null
    let success = false
    let error = null

    try {
      switch (adapter) {
        case "prembly": {
          const apiKey = provider.apiKeys.find(k => k.keyName === "api_key")?.keyValue || provider.apiKeys.find(k => k.keyName === "apiKey")?.keyValue
          const appId = provider.apiKeys.find(k => k.keyName === "app_id")?.keyValue || provider.apiKeys.find(k => k.keyName === "appId")?.keyValue || process.env.PREMBLY_APP_ID || ""
          if (!apiKey) throw new Error("API key not found")
          if (!appId) throw new Error("App ID not found")

          const client = new PremblyClient({ apiKey, appId })
          testResult = await client.getNINPrintout({ nin: "12345678901" })
          success = !!testResult?.status
          break
        }

        case "subandgain": {
          const apiKey = provider.apiKeys.find(k => k.keyName === "api_key")?.keyValue
          const username = provider.apiKeys.find(k => k.keyName === "username")?.keyValue
          if (!apiKey || !username) throw new Error("API key or username not found")

          const client = new SubAndGainClient({ baseUrl: provider.apiBaseUrl, apiKey, username })
          testResult = await client.getBalance()
          success = true
          break
        }

        case "portedsim": {
          const apiKey = provider.apiKeys.find(k => k.keyName === "api_key")?.keyValue
          if (!apiKey) throw new Error("API key not found")
          testResult = { message: "Provider configured successfully" }
          success = true
          break
        }

        default: {
          testResult = { message: "Provider configured" }
          success = true
        }
      }
    } catch (err: any) {
      success = false
      error = err?.message || "Test failed"
    }

    return NextResponse.json({
      success,
      data: testResult,
      error,
      provider: { id: provider.id, name: provider.name, adapter }
    })

  } catch (error) {
    console.error("Provider test error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}