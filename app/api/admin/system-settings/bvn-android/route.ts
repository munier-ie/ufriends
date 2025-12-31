import { NextResponse } from "next/server"
import { prisma as db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

const SETTING_KEY = "bvn_android_config"

export async function GET() {
  try {
    const setting = await db.systemSettings.findUnique({
      where: { key: SETTING_KEY },
    })

    if (!setting) {
      return NextResponse.json({ link: "", description: "" })
    }

    return NextResponse.json(setting.valueJson)
  } catch (error) {
    console.error("Error fetching BVN Android settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, { roles: ["ADMIN"] })
    if (!auth.ok) {
      return auth.response
    }

    const body = await req.json()
    const { link, description } = body

    if (typeof link !== 'string' || typeof description !== 'string') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const updatedSetting = await db.systemSettings.upsert({
      where: { key: SETTING_KEY },
      update: {
        valueJson: { link, description },
      },
      create: {
        key: SETTING_KEY,
        valueJson: { link, description },
      },
    })

    return NextResponse.json(updatedSetting.valueJson)
  } catch (error) {
    console.error("Error updating BVN Android settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
