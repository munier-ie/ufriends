import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

// GET /api/notifications - fetch user notifications
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const { searchParams } = new URL(req.url)
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)))
        const unreadOnly = searchParams.get("unreadOnly") === "true"

        const where: any = { userId: auth.user.id }
        if (unreadOnly) {
            where.readAt = null
        }

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
            }),
            prisma.notification.count({
                where: { userId: auth.user.id, readAt: null },
            }),
        ])

        return NextResponse.json({ ok: true, notifications, unreadCount })
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch notifications", detail: String(err) }, { status: 500 })
    }
}

// POST /api/notifications - mark notifications as read
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const body = await req.json().catch(() => ({}))
        const { ids, markAllRead } = body as { ids?: string[]; markAllRead?: boolean }

        if (markAllRead) {
            await prisma.notification.updateMany({
                where: { userId: auth.user.id, readAt: null },
                data: { readAt: new Date() },
            })
            return NextResponse.json({ ok: true, message: "All notifications marked as read" })
        }

        if (Array.isArray(ids) && ids.length > 0) {
            await prisma.notification.updateMany({
                where: { id: { in: ids }, userId: auth.user.id },
                data: { readAt: new Date() },
            })
            return NextResponse.json({ ok: true, message: `${ids.length} notifications marked as read` })
        }

        return NextResponse.json({ error: "No notification IDs provided" }, { status: 400 })
    } catch (err) {
        return NextResponse.json({ error: "Failed to update notifications", detail: String(err) }, { status: 500 })
    }
}
