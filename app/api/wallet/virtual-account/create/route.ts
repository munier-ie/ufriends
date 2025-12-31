import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { paymentPointCreateVirtualAccount } from "@/lib/paymentpoint"

export async function POST(req: NextRequest) {
    try {
        const sec = await protect(req as any)
        if (!sec.allowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const auth = await requireAuth(req)
        if (!auth.ok) return auth.response

        const userInfo = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: {
                email: true,
                profile: { select: { name: true, phone: true } },
                virtualAccount: true
            },
        })

        if (userInfo?.virtualAccount?.ppAccountNumber) {
            return NextResponse.json({
                ok: true,
                message: "Virtual account already exists",
                virtualAccount: {
                    accountNumber: userInfo.virtualAccount.ppAccountNumber,
                    bankName: userInfo.virtualAccount.ppBankName
                }
            })
        }

        const accountName = userInfo?.profile?.name || (userInfo?.email?.split("@")[0] || "UFriends User")
        const customerEmail = userInfo?.email || ""
        const phoneNumber = userInfo?.profile?.phone || ""

        const created = await paymentPointCreateVirtualAccount({
            email: customerEmail,
            name: accountName,
            phoneNumber
        })

        const accountNumber = created.accountNumber
        const bankName = created.bankName
        const createdAccountName = created.accountName
        const accountReference = created.accountReference

        await prisma.virtualAccount.upsert({
            where: { userId: auth.user.id },
            update: {
                ppAccountNumber: accountNumber,
                ppBankName: bankName,
                ppAccountName: createdAccountName,
                ppAccountReference: accountReference
            },
            create: {
                userId: auth.user.id,
                ppAccountNumber: accountNumber,
                ppBankName: bankName,
                ppAccountName: createdAccountName,
                ppAccountReference: accountReference
            },
        })

        await prisma.auditLog.create({
            data: {
                actorId: auth.user.id,
                action: "PAYMENTPOINT_VIRTUAL_ACCOUNT_MANUAL_CREATED",
                resourceType: "VirtualAccount",
                resourceId: accountNumber,
                diffJson: { accountNumber, bankName, accountReference },
            },
        }).catch(() => { })

        return NextResponse.json({
            ok: true,
            virtualAccount: { accountNumber, bankName }
        })
    } catch (err) {
        console.error("Manual PaymentPoint VA creation error details:", err)
        return NextResponse.json({
            error: "Failed to create virtual account",
            detail: err instanceof Error ? err.message : String(err),
            location: "api/wallet/virtual-account/create"
        }, { status: 500 })
    }
}
