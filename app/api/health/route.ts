import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"

// Centralized Arcjet protection via shared helper

export async function GET(req: Request) {
  // Apply centralized protection to mitigate automated probes
  try {
    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ status: "denied" }, { status: 403 })
    }
  } catch {
    // Fail open
  }

  try {
    // Attempt a lightweight query to validate DB connectivity
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ status: "ok", db: "not_connected", error: `${err}` }, { status: 200 })
  }
}