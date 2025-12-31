import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

const POPUP_MESSAGES_KEY = "popup_messages"

export interface PopupMessage {
    id: string
    title: string
    message: string
    type: "info" | "warning" | "success" | "error"
    includeUserName: boolean
    isActive: boolean
    createdAt: string
    updatedAt: string
}

// GET /api/popup-messages - fetch all popup messages (active only for users, all for admins)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const activeOnly = searchParams.get("activeOnly") === "true"

        const setting = await prisma.systemSettings.findUnique({
            where: { key: POPUP_MESSAGES_KEY },
        })

        const messages: PopupMessage[] = setting?.valueJson ? (setting.valueJson as any) : []

        if (activeOnly) {
            return NextResponse.json({ ok: true, messages: messages.filter((m) => m.isActive) })
        }

        return NextResponse.json({ ok: true, messages })
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch popup messages", detail: String(err) }, { status: 500 })
    }
}

// POST /api/popup-messages - create or update messages (admin only)
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        const body = await req.json()
        const { action, message, id, updates } = body as {
            action: "create" | "update" | "delete" | "toggle"
            message?: Omit<PopupMessage, "id" | "createdAt" | "updatedAt">
            id?: string
            updates?: Partial<PopupMessage>
        }

        const setting = await prisma.systemSettings.findUnique({
            where: { key: POPUP_MESSAGES_KEY },
        })

        let messages: PopupMessage[] = setting?.valueJson ? (setting.valueJson as any) : []

        if (action === "create" && message) {
            const newMessage: PopupMessage = {
                ...message,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            messages.push(newMessage)
        } else if (action === "update" && id && updates) {
            messages = messages.map((m) =>
                m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
            )
        } else if (action === "delete" && id) {
            messages = messages.filter((m) => m.id !== id)
        } else if (action === "toggle" && id) {
            messages = messages.map((m) =>
                m.id === id ? { ...m, isActive: !m.isActive, updatedAt: new Date().toISOString() } : m
            )
        } else {
            return NextResponse.json({ error: "Invalid action or missing data" }, { status: 400 })
        }

        await prisma.systemSettings.upsert({
            where: { key: POPUP_MESSAGES_KEY },
            update: { valueJson: messages as any },
            create: { key: POPUP_MESSAGES_KEY, valueJson: messages as any },
        })

        return NextResponse.json({ ok: true, messages })
    } catch (err) {
        return NextResponse.json({ error: "Failed to update popup messages", detail: String(err) }, { status: 500 })
    }
}
