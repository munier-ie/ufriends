import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const SYSTEM_SETTINGS_KEY = "system_settings"

// GET /api/system/maintenance - check maintenance mode status (public endpoint)
export async function GET(req: NextRequest) {
    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: SYSTEM_SETTINGS_KEY },
        })

        const config = setting?.valueJson as any || {}
        const maintenanceMode = config.maintenanceMode === true

        return NextResponse.json({ ok: true, maintenanceMode })
    } catch (err) {
        return NextResponse.json({ maintenanceMode: false })
    }
}
