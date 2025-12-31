import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// POST /api/training/upload - upload training file (video, pdf, image, etc.)
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = [
            "video/mp4", "video/webm", "video/ogg",
            "application/pdf",
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ]

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Allowed: video, pdf, images, Word, Excel, PowerPoint"
            }, { status: 400 })
        }

        // Limit file size (50MB for videos, 10MB for others)
        const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024
        if (file.size > maxSize) {
            const maxMB = maxSize / (1024 * 1024)
            return NextResponse.json({ error: `File too large. Max ${maxMB}MB` }, { status: 400 })
        }

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "uploads", "training")
        await mkdir(uploadDir, { recursive: true })

        // Generate unique filename
        const ext = path.extname(file.name)
        const baseName = path.basename(file.name, ext).replace(/[^a-z0-9]/gi, "_")
        const uniqueName = `${baseName}_${Date.now()}${ext}`
        const filePath = path.join(uploadDir, uniqueName)

        // Write file
        const bytes = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))

        // Return public URL
        const fileUrl = `/uploads/training/${uniqueName}`

        return NextResponse.json({
            ok: true,
            fileUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
        })
    } catch (err) {
        return NextResponse.json({ error: "Failed to upload file", detail: String(err) }, { status: 500 })
    }
}
