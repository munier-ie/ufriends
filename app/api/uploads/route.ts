import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"

// We'll store user uploads in public/uploads for now
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads")

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const sec = await protect(req as any)
        if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const form = await req.formData()
        const file = form.get("file") as File | null

        if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

        ensureDir(UPLOADS_DIR)

        // Generate specific filename to avoid collisions
        const ext = path.extname(file.name || "").toLowerCase() || ".jpg"
        const allowedExts = [".jpg", ".jpeg", ".png", ".pdf", ".webp"]
        if (!allowedExts.includes(ext)) {
            return NextResponse.json({ error: "Invalid file type. Only images and PDFs allowed." }, { status: 400 })
        }

        const filename = `${auth.user.id}-${randomUUID()}${ext}`
        const dest = path.join(UPLOADS_DIR, filename)

        const buf = Buffer.from(await file.arrayBuffer())
        fs.writeFileSync(dest, buf)

        const url = `/uploads/${filename}`

        return NextResponse.json({ ok: true, url, filename })
    } catch (err) {
        console.error("Upload error:", err)
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }
}
