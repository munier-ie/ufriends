import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
    try {
        // This is a temporary debug endpoint to help the user share webhook logs
        // It retrieves the last 20 webhooks logged to the AuditLog table
        const logs = await prisma.auditLog.findMany({
            where: {
                action: {
                    contains: "WEBHOOK_RECEIVED"
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 20
        })

        return NextResponse.json({
            ok: true,
            logs: logs.map(l => ({
                time: l.createdAt,
                action: l.action,
                payload: l.diffJson
            }))
        })
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
}
