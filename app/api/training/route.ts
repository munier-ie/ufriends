import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

const TRAININGS_KEY = "trainings_content"

export interface Training {
    id: string
    category: "Free" | "Premium" | "CAC" | "NIN" | "BVN" | "Agency"
    title: string
    description: string
    videoUrl?: string
    pdfUrl?: string
    fileUrl?: string
    fileType?: string
    fileName?: string
    createdAt: string
}

// GET /api/training - fetch all trainings (optionally by category)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get("category")

        const setting = await prisma.systemSettings.findUnique({
            where: { key: TRAININGS_KEY },
        })

        const trainings: Training[] = setting?.valueJson ? (setting.valueJson as any) : []

        if (category) {
            return NextResponse.json({ ok: true, trainings: trainings.filter((t) => t.category === category) })
        }

        return NextResponse.json({ ok: true, trainings })
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch trainings", detail: String(err) }, { status: 500 })
    }
}

// POST /api/training - create, update, or delete training (admin only)
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        const body = await req.json()
        const { action, training, id, updates } = body as {
            action: "create" | "update" | "delete"
            training?: Omit<Training, "id" | "createdAt">
            id?: string
            updates?: Partial<Training>
        }

        const setting = await prisma.systemSettings.findUnique({
            where: { key: TRAININGS_KEY },
        })

        let trainings: Training[] = setting?.valueJson ? (setting.valueJson as any) : []

        if (action === "create" && training) {
            const newTraining: Training = {
                ...training,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            }
            trainings.push(newTraining)
        } else if (action === "update" && id && updates) {
            trainings = trainings.map((t) =>
                t.id === id ? { ...t, ...updates } : t
            )
        } else if (action === "delete" && id) {
            trainings = trainings.filter((t) => t.id !== id)
        } else {
            return NextResponse.json({ error: "Invalid action or missing data" }, { status: 400 })
        }

        await prisma.systemSettings.upsert({
            where: { key: TRAININGS_KEY },
            update: { valueJson: trainings as any },
            create: { key: TRAININGS_KEY, valueJson: trainings as any },
        })

        return NextResponse.json({ ok: true, trainings })
    } catch (err) {
        return NextResponse.json({ error: "Failed to update trainings", detail: String(err) }, { status: 500 })
    }
}
