import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sendAdminNotification } from "@/lib/notifications"

const registerSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    state: z.string().min(2),
    lga: z.string().min(2),
    marketingType: z.array(z.string()).min(1),
    passportUrl: z.string().min(1),
    validIdUrl: z.string().min(1),
    referralCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const sec = await protect(req as any)
        if (!sec.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const body = await req.json()
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
        }

        const { fullName, phone, state, lga, marketingType, passportUrl, validIdUrl, referralCode } = parsed.data

        // Check existing request
        const existing = await prisma.marketerProfile.findUnique({
            where: { userId: auth.user.id }
        })

        if (existing) {
            return NextResponse.json({ error: "You have already applied as a marketer" }, { status: 400 })
        }

        // Generate a temporary referral code
        const myReferralCode = `REF-${auth.user.id.slice(-4)}-${Math.floor(Math.random() * 10000)}`.toUpperCase()

        // Create profile
        const profile = await prisma.marketerProfile.create({
            data: {
                userId: auth.user.id,
                referralCode: myReferralCode,
                status: "Pending",
                state,
                lga,
                marketingType,
                passportUrl,
                validIdUrl,
                commissionBalance: 0,
                totalCommission: 0,
                totalSales: 0,
                totalReferrals: 0,
            }
        })

        // Notify Admins
        await sendAdminNotification({
            type: "NEW_MARKETER_REQUEST",
            title: "New Marketer Application",
            body: `A new marketer application has been submitted by ${fullName} (${auth.user.email}).`,
            email: {
                subject: "New Marketer Application - Admin Alert",
                html: `
                    <h3>New Marketer Application</h3>
                    <p><strong>Name:</strong> ${fullName}</p>
                    <p><strong>Email:</strong> ${auth.user.email}</p>
                    <p><strong>Marketing Types:</strong> ${marketingType.join(", ")}</p>
                    <p>Please log in to the admin panel to review the application.</p>
                `
            }
        })

        return NextResponse.json({ ok: true, profile })

    } catch (err: any) {
        console.error("Marketer registration error:", err)
        return NextResponse.json({ error: "Failed to submit request", detail: err.message }, { status: 500 })
    }
}

