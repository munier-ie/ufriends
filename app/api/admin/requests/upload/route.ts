import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// POST /api/admin/requests/upload - upload proof file for manual service requests
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
            "application/pdf",
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain", "text/csv"
        ]

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Allowed: PDF, images, Word, Excel, text files"
            }, { status: 400 })
        }

        // Limit file size (10MB)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large. Maximum 10MB" }, { status: 400 })
        }

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "uploads", "proofs")
        await mkdir(uploadDir, { recursive: true })

        // Generate unique filename
        const ext = path.extname(file.name)
        const baseName = path.basename(file.name, ext).replace(/[^a-z0-9]/gi, "_")
        const uniqueName = `proof_${Date.now()}_${baseName}${ext}`
        const filePath = path.join(uploadDir, uniqueName)

        // Write file
        const bytes = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))

        // Return public URL
        const fileUrl = `/uploads/proofs/${uniqueName}`

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
