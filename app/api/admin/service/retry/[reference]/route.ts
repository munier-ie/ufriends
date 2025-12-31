import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sendAirtime } from "@/lib/providers/airtime"
import { sendDataBundle } from "@/lib/providers/data"
import { payBill } from "@/lib/providers/bills"

// POST /api/admin/service/retry/[reference]
// Body: { note?: string }
// Retries a FAILED service transaction by re-calling the mock provider.
export async function POST(req: NextRequest, context: { params: Promise<{ reference: string }> }) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { reference } = await context.params
    if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 })

    const raw = await req.json().catch(() => ({}))
    const Schema = z.object({ note: z.string().optional(), reason: z.string().optional() })
    const parsed = Schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", detail: parsed.error.flatten() }, { status: 400 })
    }
    const note = parsed.data.reason ?? parsed.data.note

    // Load transaction
    const tx = await prisma.transaction.findUnique({ where: { reference } })
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    if (tx.type !== "SERVICE_PURCHASE") {
      return NextResponse.json({ error: "Not a service transaction" }, { status: 400 })
    }
    if (tx.status !== "FAILED") {
      return NextResponse.json({ error: `Retry allowed only for FAILED, got ${tx.status}` }, { status: 400 })
    }

    const meta: any = tx.meta || {}
    const serviceId = String(meta.serviceId || "")
    const actionId = String(meta.action || "")
    const serviceParams = (meta.params || {}) as Record<string, unknown>

    // Wallet balance check (debit happens only on success)
    const wallet = await prisma.wallet.findUnique({ where: { userId: tx.userId } })
    if (!wallet || Number(wallet.balance) < Number(tx.amount)) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 })
    }

    // Mark as PENDING and log retry intent
    await prisma.$transaction([
      prisma.transaction.update({
        where: { reference },
        data: {
          status: "PENDING",
          meta: {
            ...meta,
            adminRetryNote: note,
            adminRetryCount: Number(meta.adminRetryCount || 0) + 1,
            adminRetryRequestedAt: new Date().toISOString(),
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "ADMIN_SERVICE_RETRY_REQUEST",
          resourceType: "Transaction",
          resourceId: reference,
          diffJson: { reference, serviceId, actionId, note },
        },
      }),
    ])

    // Call provider based on service/action
    let success = false
    let providerRef: string | undefined
    let errorMsg: string | undefined

    try {
      if (serviceId === "airtime" && actionId === "vtu") {
        const res = await sendAirtime({ 
          amount: Number(tx.amount), 
          params: { phone: String(serviceParams.phone || ""), network: String(serviceParams.network || "") },
          providerId: String(meta.providerId || "mock"),
          subServiceId: String(meta.subServiceId || "") || undefined,
        })
        success = res.ok
        providerRef = (res as any).providerReference
        errorMsg = (res as any).message || (res as any).error
      } else if (serviceId === "data" && actionId === "bundle") {
        const res = await sendDataBundle({ 
          amount: Number(tx.amount), 
          params: { 
            phone: String(serviceParams.phone || ""), 
            network: String(serviceParams.network || ""), 
            planCode: String((serviceParams as any).planCode || (serviceParams as any).plan || "") 
          },
          providerId: String(meta.providerId || "mock"),
          subServiceId: String(meta.subServiceId || "") || undefined,
        })
        success = res.ok
        providerRef = (res as any).providerReference
        errorMsg = (res as any).message || (res as any).error
      } else if (serviceId === "bills" && actionId === "electricity") {
        const res = await payBill({ 
          amount: Number(tx.amount), 
          params: { 
            meterNumber: String((serviceParams as any).meterNumber || ""), 
            serviceProvider: String((serviceParams as any).serviceProvider || ""), 
            customerName: String((serviceParams as any).customerName || ""), 
            customerAddress: String((serviceParams as any).customerAddress || ""), 
          },
          providerId: String(meta.providerId || "mock"),
          subServiceId: String(meta.subServiceId || "") || undefined,
        })
        success = res.ok
        providerRef = (res as any).providerReference
        errorMsg = (res as any).message || (res as any).error
      } else {
        return NextResponse.json({ error: `Unsupported service/action: ${serviceId}/${actionId}` }, { status: 400 })
      }
    } catch (err) {
      errorMsg = String(err)
      success = false
    }

    if (success) {
      // Success: mark transaction and debit wallet atomically
      await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            meta: { ...meta, providerRef, adminRetriedAt: new Date().toISOString() },
          },
        }),
        prisma.wallet.update({ where: { userId: tx.userId }, data: { balance: { decrement: Number(tx.amount) } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "ADMIN_SERVICE_RETRY_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { reference, amount: Number(tx.amount), providerRef },
          },
        }),
      ])

      return NextResponse.json({ ok: true, reference, status: "SUCCESS", providerRef })
    }

    // Failure: mark as FAILED and log
    await prisma.$transaction([
      prisma.transaction.update({
        where: { reference },
        data: { status: "FAILED", meta: { ...meta, error: errorMsg, adminRetriedAt: new Date().toISOString() } },
      }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "ADMIN_SERVICE_RETRY_FAILED",
          resourceType: "Transaction",
          resourceId: reference,
          diffJson: { reference, amount: Number(tx.amount), error: errorMsg },
        },
      }),
    ])

    return NextResponse.json({ ok: false, reference, status: "FAILED", error: errorMsg })
  } catch (err) {
    return NextResponse.json({ error: "Retry failed", detail: String(err) }, { status: 500 })
  }
}