import { prisma } from "@/lib/db"

export interface RefundParams {
  userId: string
  amount: number
  originalReference: string
  reason: string
  actorId?: string // Admin ID if triggered by admin, otherwise system
}

export interface RefundResult {
  ok: boolean
  reference?: string
  newBalance?: number
  error?: string
}

/**
 * Process a wallet refund for failed service transactions
 * This function handles the atomic refund process including:
 * - Wallet credit
 * - Transaction record creation
 * - Audit log entry
 */
export async function processWalletRefund(params: RefundParams): Promise<RefundResult> {
  try {
    const { userId, amount, originalReference, reason, actorId } = params

    // Validate amount
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Invalid refund amount" }
    }

    // Ensure user exists and get/create wallet
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { id: true, email: true } 
    })
    if (!user) {
      return { ok: false, error: "User not found" }
    }

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, currency: "NGN" },
    })

    const currentBalance = Number(wallet.balance)
    const newBalance = currentBalance + amount
    const reference = `REF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Atomic refund transaction
    await prisma.$transaction([
      // Credit the wallet
      prisma.wallet.update({ 
        where: { userId }, 
        data: { balance: newBalance } 
      }),
      
      // Create refund transaction record
      prisma.transaction.create({
        data: {
          userId,
          type: "WALLET_REFUND",
          amount,
          status: "SUCCESS",
          reference,
          meta: { 
            reason, 
            originalReference,
            refundedBy: actorId || "SYSTEM",
            refundedAt: new Date().toISOString()
          },
        },
      }),
      
      // Create audit log
      prisma.auditLog.create({
        data: {
          actorId: actorId || "SYSTEM",
          action: "WALLET_REFUND_PROCESSED",
          resourceType: "Wallet",
          resourceId: userId,
          diffJson: { 
            from: currentBalance, 
            to: newBalance, 
            amount, 
            reason,
            originalReference,
            userEmail: user.email
          },
        },
      }),
    ])

    return { 
      ok: true, 
      reference, 
      newBalance 
    }

  } catch (error) {
    console.error("Wallet refund error:", error)
    return { 
      ok: false, 
      error: `Refund processing failed: ${String(error)}` 
    }
  }
}

/**
 * Check if a transaction is eligible for refund
 * Returns true if the transaction exists, belongs to the user, and is in FAILED status
 */
export async function isTransactionRefundable(reference: string, userId: string): Promise<boolean> {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        reference,
        userId,
        status: "FAILED",
        type: "SERVICE_PURCHASE"
      }
    })
    
    return !!transaction
  } catch (error) {
    console.error("Refund eligibility check error:", error)
    return false
  }
}

/**
 * Check if a refund has already been processed for a transaction
 */
export async function hasRefundBeenProcessed(originalReference: string): Promise<boolean> {
  try {
    const refundTransaction = await prisma.transaction.findFirst({
      where: {
        type: "WALLET_REFUND",
        meta: {
          path: ["originalReference"],
          equals: originalReference
        }
      }
    })
    
    return !!refundTransaction
  } catch (error) {
    console.error("Refund check error:", error)
    return false
  }
}