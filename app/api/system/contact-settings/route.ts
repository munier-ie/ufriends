import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const FLOATING_ACTION_SETTINGS_KEY = "floating_action_settings"

// GET /api/system/contact-settings - fetch support and admin contact info (public endpoint)
export async function GET(req: NextRequest) {
    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: FLOATING_ACTION_SETTINGS_KEY },
        })

        const config = setting?.valueJson || {
            supportPhone: "2348012345678",
            adminContacts: [
                {
                    id: 1,
                    name: "Admin Support",
                    role: "General Support",
                    phone: "2348012345678",
                    initials: "AS",
                },
                {
                    id: 2,
                    name: "Technical Team",
                    role: "Technical Issues",
                    phone: "2348087654321",
                    initials: "TT",
                },
                {
                    id: 3,
                    name: "Finance Admin",
                    role: "Payment & Wallet",
                    phone: "2348098765432",
                    initials: "FA",
                },
            ],
        }

        return NextResponse.json({ ok: true, ...config as any })
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch contact settings" }, { status: 500 })
    }
}
