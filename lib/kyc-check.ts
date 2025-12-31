import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * Checks if a user has an approved KYC.
 * Returns null if verified, or a NextResponse error if blocked.
 */
export async function ensureKyc(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isKycVerified: true } as any,
    }) as any

    // If already flagged in user model, we are good
    if (user?.isKycVerified) {
        return null
    }

    // Fallback: Check if there's an APPROVED kycRequest (in case flag is out of sync)
    const approvedKyc = await prisma.kycRequest.findFirst({
        where: { userId, status: "APPROVED" },
    })

    if (approvedKyc) {
        // Self-heal: Update the flag if it was false but an approved request exists
        await prisma.user.update({
            where: { id: userId },
            data: { isKycVerified: true } as any,
        })
        return null
    }

    return NextResponse.json(
        {
            error: "KYC Required",
            message: "Please complete your KYC verification to access this service.",
            code: "KYC_REQUIRED",
        },
        { status: 403 }
    )
}
