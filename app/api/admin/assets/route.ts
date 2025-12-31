import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import fs from "fs"
import path from "path"

const ASSETS_DIR = path.join(process.cwd(), "public", "assets")

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function safeJoin(base: string, target: string) {
  const resolved = path.join(base, target)
  const normalizedBase = path.normalize(base)
  const normalizedResolved = path.normalize(resolved)
  if (!normalizedResolved.startsWith(normalizedBase)) throw new Error("Invalid path")
  return normalizedResolved
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const prefix = (searchParams.get("prefix") || "").replace(/\\/g, "/")
    ensureDir(ASSETS_DIR)
    const dir = prefix ? safeJoin(ASSETS_DIR, prefix) : ASSETS_DIR
    ensureDir(dir)

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => {
        const full = path.join(dir, e.name)
        const stat = fs.statSync(full)
        const rel = path.relative(path.join(process.cwd(), "public"), full).replace(/\\\\/g, "/")
        return {
          name: e.name,
          path: rel,
          url: `/${rel}`,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        }
      })

    return NextResponse.json({ ok: true, files })
  } catch (err) {
    return NextResponse.json({ error: "Failed to list assets", detail: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const form = await req.formData()
    const file = form.get("file") as File | null
    const dirInput = (form.get("dir") as string | null) || ""
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

    ensureDir(ASSETS_DIR)
    const targetDir = dirInput ? safeJoin(ASSETS_DIR, dirInput.replace(/\\/g, "/")) : ASSETS_DIR
    ensureDir(targetDir)

    const orig = (file.name || "upload").replace(/[^a-zA-Z0-9._-]+/g, "-")
    const name = orig.toLowerCase()
    const dest = path.join(targetDir, name)
    const buf = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(dest, buf)

    const rel = path.relative(path.join(process.cwd(), "public"), dest).replace(/\\\\/g, "/")
    return NextResponse.json({ ok: true, file: { name, url: `/${rel}`, path: rel, size: buf.length } })
  } catch (err) {
    return NextResponse.json({ error: "Failed to upload asset", detail: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const relPath = (body?.path || body?.filename || "") as string
    if (!relPath) return NextResponse.json({ error: "Missing path" }, { status: 400 })
    ensureDir(ASSETS_DIR)
    const full = safeJoin(path.join(process.cwd(), "public"), relPath.replace(/\\/g, "/"))
    if (!fs.existsSync(full)) return NextResponse.json({ error: "Not found" }, { status: 404 })
    fs.unlinkSync(full)
    return NextResponse.json({ ok: true, deleted: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete asset", detail: String(err) }, { status: 500 })
  }
}