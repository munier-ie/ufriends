import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

const SYSTEM_SETTINGS_KEY = "system_settings"
const ADMIN_NOTIFICATION_PREFS_KEY = "admin_notification_prefs"
const FLOATING_ACTION_SETTINGS_KEY = "floating_action_settings"

// GET /api/admin/settings - fetch system settings and admin preferences
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        // Get system settings
        const systemSetting = await prisma.systemSettings.findUnique({
            where: { key: SYSTEM_SETTINGS_KEY },
        })

        // Get admin notification preferences
        const notifSetting = await prisma.systemSettings.findUnique({
            where: { key: ADMIN_NOTIFICATION_PREFS_KEY },
        })

        // Get floating action bar settings
        const floatingSetting = await prisma.systemSettings.findUnique({
            where: { key: FLOATING_ACTION_SETTINGS_KEY },
        })

        // Get admin profile data from user
        const adminProfile = await prisma.user.findUnique({
            where: { id: auth.user.id },
            include: { profile: true },
        })

        const systemConfig = systemSetting?.valueJson || {
            appName: "UFriends Information Technology",
            maintenanceMode: false,
            defaultCurrency: "NGN",
            timezone: "Africa/Lagos",
            dateFormat: "DD/MM/YYYY",
            itemsPerPage: "20",
        }

        const notifications = notifSetting?.valueJson || {
            emailNewUser: true,
            emailNewOrder: true,
            emailDispute: true,
            smsNewOrder: false,
            smsDispute: true,
            pushNotifications: true,
        }

        const floatingActionConfig = floatingSetting?.valueJson || {
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

        const profile = {
            name: adminProfile?.profile?.name || "Admin User",
            email: adminProfile?.email || "",
            phone: adminProfile?.profile?.phone || "",
            avatar: adminProfile?.profile?.avatarUrl || "",
        }

        return NextResponse.json({ ok: true, systemConfig, notifications, profile, floatingActionConfig })
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch settings", detail: String(err) }, { status: 500 })
    }
}

// POST /api/admin/settings - update settings
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req, { roles: ["ADMIN"] })
        if (!auth.ok) return auth.response

        const body = await req.json()
        const { type, data } = body as { type: "system" | "notifications" | "profile" | "floating_action"; data: any }

        if (type === "system") {
            await prisma.systemSettings.upsert({
                where: { key: SYSTEM_SETTINGS_KEY },
                update: { valueJson: data },
                create: { key: SYSTEM_SETTINGS_KEY, valueJson: data },
            })
            return NextResponse.json({ ok: true, message: "System settings updated" })
        }

        if (type === "notifications") {
            await prisma.systemSettings.upsert({
                where: { key: ADMIN_NOTIFICATION_PREFS_KEY },
                update: { valueJson: data },
                create: { key: ADMIN_NOTIFICATION_PREFS_KEY, valueJson: data },
            })
            return NextResponse.json({ ok: true, message: "Notification preferences updated" })
        }

        if (type === "floating_action") {
            await prisma.systemSettings.upsert({
                where: { key: FLOATING_ACTION_SETTINGS_KEY },
                update: { valueJson: data },
                create: { key: FLOATING_ACTION_SETTINGS_KEY, valueJson: data },
            })
            return NextResponse.json({ ok: true, message: "Floating action settings updated" })
        }

        if (type === "profile") {
            await prisma.profile.upsert({
                where: { userId: auth.user.id },
                update: { name: data.name, phone: data.phone },
                create: { userId: auth.user.id, name: data.name, phone: data.phone },
            })
            return NextResponse.json({ ok: true, message: "Profile updated" })
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    } catch (err) {
        return NextResponse.json({ error: "Failed to update settings", detail: String(err) }, { status: 500 })
    }
}
