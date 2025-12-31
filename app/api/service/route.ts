import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"
import { getActiveProvider } from "@/lib/provider-manager"
import { sendAirtimeViaPorted } from "@/lib/providers/airtime-ported"
import { sendDataBundleViaPorted } from "@/lib/providers/data-ported"
import { payBillViaSubAndGain } from "@/lib/providers/bills-subandgain"
import { sendAirtimeViaSubAndGain } from "@/lib/providers/airtime-subandgain"
import { sendDataBundleViaSubAndGain } from "@/lib/providers/data-subandgain"
import { payEducationViaSubAndGain } from "@/lib/providers/education-subandgain"
import { isManualService } from "@/lib/service-utils"
import { ensureKyc } from "@/lib/kyc-check"

// Dispatch implementation selecting appropriate adapter based on service category
async function dispatchService(
  provider: Awaited<ReturnType<typeof getActiveProvider>>["provider"],
  category: string,
  subServiceId: string | undefined,
  amount: number,
  params: Record<string, unknown>,
) {
  if (!provider) {
    return { ok: false, code: "NO_PROVIDER", message: "No active provider configured" }
  }

  const adapterName = String((provider.configJson as any)?.adapter || provider.name || "")
    .toLowerCase()

  try {
    if (category === "airtime") {
      const usePorted = adapterName.includes("ported") || adapterName.includes("portedsim")
      const useSAG = adapterName.includes("subandgain")
      const res = usePorted
        ? await sendAirtimeViaPorted({ amount, params: params as any, providerId: provider.id, subServiceId }, provider)
        : useSAG
          ? await sendAirtimeViaSubAndGain({ amount, params: params as any, providerId: provider.id, subServiceId }, provider)
          : { ok: false, code: "UNSUPPORTED_ADAPTER", message: `Unsupported airtime adapter: ${adapterName}` }
      return res
    }

    if (category === "data") {
      const usePorted = adapterName.includes("ported") || adapterName.includes("portedsim")
      const useSAG = adapterName.includes("subandgain")
      const res = usePorted
        ? await sendDataBundleViaPorted({ amount, params: params as any, providerId: provider.id, subServiceId }, provider)
        : useSAG
          ? await sendDataBundleViaSubAndGain({ amount, params: params as any, providerId: provider.id, subServiceId }, provider)
          : { ok: false, code: "UNSUPPORTED_ADAPTER", message: `Unsupported data adapter: ${adapterName}` }
      return res
    }

    if (category === "bills") {
      const useReal = adapterName.includes("subandgain")
      const res = useReal
        ? await payBillViaSubAndGain({ amount, params: params as any, providerId: provider.id, subServiceId }, provider)
        : { ok: false, code: "UNSUPPORTED_ADAPTER", message: `Unsupported bills adapter: ${adapterName}` }
      return res
    }

    if (category === "education") {
      const useReal = adapterName.includes("subandgain")
      const res = useReal
        ? await payEducationViaSubAndGain({ amount, params: params as any, providerId: provider.id, subServiceId }, provider)
        : { ok: false, code: "UNSUPPORTED_ADAPTER", message: `Unsupported education adapter: ${adapterName}` }
      return res
    }

    // Automated verification services (BVN, NIN, CAC)
    if (category === "bvn" || category === "nin" || category === "cac" || category === "tin" || category === "voters-card" || category === "driver-license" || category === "passport" || category === "phone" || category === "plate-number") {
      const premblyConfig = {
        apiKey: (provider.apiKeys || []).find((k) => k.keyName.toLowerCase() === "api_key")?.keyValue || process.env.PREMBLY_API_KEY || "",
        appId: (provider.apiKeys || []).find((k) => k.keyName.toLowerCase() === "app_id")?.keyValue || process.env.PREMBLY_APP_ID || "",
      }

      if (!premblyConfig.apiKey || !premblyConfig.appId) {
        return { ok: false, code: "MISSING_CONFIG", message: "Prembly API keys not configured" }
      }

      const { PremblyClient } = await import("@/lib/prembly")
      const client = new PremblyClient(premblyConfig)

      let res: any
      if (category === "nin") {
        res = subServiceId === "slip" ? await client.getNINSlip(params as any) : await client.getNINAdvanced(params as any)
      } else if (category === "bvn") {
        res = subServiceId === "printout" ? await client.getBVNPrintout(params as any) : await client.getBVNAdvanced(params as any)
      } else if (category === "cac") {
        res = (subServiceId === "status" || subServiceId === "status-report") ? await client.getCACStatusReport(params as any) : await client.getCACInfo(params as any)
      } else if (category === "tin") {
        res = await client.verifyTIN(params as any)
      } else if (category === "voters-card") {
        res = await client.verifyVotersCard(params as any)
      } else if (category === "driver-license") {
        res = await client.verifyDriversLicenseAdvanced(params as any)
      } else if (category === "passport") {
        res = await client.verifyInternationalPassportV2(params as any)
      } else if (category === "phone") {
        res = await client.verifyPhoneAdvanced(params as any)
      } else if (category === "plate-number") {
        res = await client.verifyPlateNumber(params as any)
      }

      if (res) {
        return {
          ok: res.status,
          message: res.detail || (res.status ? "Verification processed" : "Verification failed"),
          data: res.data,
          error: res.error,
          providerReference: res.reference || res.transactionId
        }
      }
    }

    return { ok: false, code: "UNSUPPORTED_CATEGORY", message: `Unsupported service category: ${category}` }
  } catch (err) {
    return { ok: false, code: "ADAPTER_ERROR", message: String(err) }
  }
}


export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const ServiceSchema = z.object({
      serviceId: z.string().min(1), // category id from UFRIENDS_SERVICES
      subServiceId: z.string().optional(),
      amount: z.number().positive(),
      idempotencyKey: z.string().min(8).optional(),
      params: z.record(z.any()).default({}),
      pin: z.string().length(4, "PIN must be 4 digits").optional(),
    })

    const parsed = ServiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }
    const { serviceId, subServiceId, amount, idempotencyKey, params, pin } = parsed.data

    // Verify transaction PIN
    const userWithPin = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { transactionPin: true },
    })

    if (!userWithPin?.transactionPin) {
      return NextResponse.json({ error: "Transaction PIN not set" }, { status: 403 })
    }

    const { compare } = await import("bcryptjs")
    const isPinValid = await compare(pin || "", userWithPin.transactionPin)
    if (!isPinValid) {
      return NextResponse.json({ error: "Invalid transaction PIN" }, { status: 401 })
    }

    // KYC Check: Exempt airtime, data, bills, education. Enforce for others (NIN, BVN, CAC, etc.)
    const exemptCategories = ["airtime", "data", "bills", "education"]
    if (!exemptCategories.includes(serviceId.toLowerCase())) {
      const kycError = await ensureKyc(auth.user.id)
      if (kycError) return kycError
    }

    // Idempotency via unique transaction reference
    const reference = idempotencyKey || `SRV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const existing = await prisma.transaction.findUnique({ where: { reference } }).catch(() => null)
    if (existing) {
      return NextResponse.json({ ok: true, idempotent: true, reference, transaction: existing })
    }

    const manual = isManualService(serviceId, subServiceId)

    // Wallet balance check (outline only; deduction occurs on success or submission)
    const wallet = await prisma.wallet.findUnique({ where: { userId: auth.user.id } })
    if (!wallet || Number(wallet.balance) < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 })
    }

    if (manual) {
      // HANDLE MANUAL SERVICE
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: auth.user.id,
            type: "SERVICE_REQUEST", // distinct from SERVICE_PURCHASE if desired, or keep generic
            amount,
            status: "SUBMITTED" as any, // New status
            reference,
            category: serviceId,
            subservice: subServiceId,
            meta: { serviceId, subServiceId, params, manual: true },
          },
        }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "MANUAL_SERVICE_REQUEST",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { amount, serviceId, subServiceId, params, status: "SUBMITTED" },
          },
        }),
      ])

      const { sendAdminNotification } = await import("@/lib/notifications")
      await sendAdminNotification({
        type: "NEW_MANUAL_SERVICE_REQUEST",
        title: "New Service Request",
        body: `A user (${auth.user.email}) has submitted a manual request for ${serviceId}${subServiceId ? ` / ${subServiceId}` : ""}.`,
        email: {
          subject: "New Manual Service Request - UFriends",
          html: `<h3>New Service Request</h3><p>A user with email <strong>${auth.user.email}</strong> has submitted a manual request for <strong>${serviceId}${subServiceId ? ` / ${subServiceId}` : ""}</strong>.</p><p>Please check the admin dashboard to process this request.</p>`
        }
      })

      return NextResponse.json({
        ok: true,
        reference,
        status: "SUBMITTED",
        message: "Service request submitted. Admin will review shortly.",
      })

    }

    // Provider selection for AUTOMATED services
    const providerInfo = await getActiveProvider(serviceId)
    if (!providerInfo.provider) {
      // IF automated but no provider, maybe fallback to manual? 
      // For now, fail as before or return error. 
      return NextResponse.json(
        {
          error: "No active provider for service",
          serviceId,
          fallbackProviders: providerInfo.fallbackProviders,
        },
        { status: 503 },
      )
    }

    // Record pending transaction and audit trail
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: auth.user.id,
          type: "SERVICE_PURCHASE",
          amount,
          status: "PENDING",
          reference,
          category: serviceId,
          subservice: subServiceId,
          meta: { serviceId, subServiceId, providerId: providerInfo.provider.id, params },
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "SERVICE_REQUEST_INIT",
          resourceType: "Transaction",
          resourceId: reference,
          diffJson: { amount, serviceId, subServiceId, providerId: providerInfo.provider.id, params },
        },
      }),
    ])

    // Provider dispatch call
    const result = await dispatchService(providerInfo.provider, serviceId, subServiceId, amount, params)

    if ((result as any).ok) {
      const providerRef = (result as any).providerReference

      await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            meta: { serviceId, subServiceId, providerId: providerInfo.provider.id, params, providerRef },
          },
        }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { amount, serviceId, subServiceId, providerId: providerInfo.provider.id, providerRef, params },
          },
        }),
      ])

      const { sendNotification } = await import("@/lib/notifications")
      await sendNotification({
        userId: auth.user.id,
        type: "SERVICE_SUCCESS",
        title: `Service Success: ${serviceId}`,
        body: `Your order for ${serviceId}${subServiceId ? ` (${subServiceId})` : ""} was successful. Reference: ${reference}`,
        // Email optional for automated low-value items, but user asked for "comprehensive", so let's include basic check
        // Or keep it in-app only to avoid spamming for every tiny data purchase. 
        // User said: "inform the user... notify the user when an admin approves or rejects a job".
        // Automated successes might not need emails if they are instantaneous. I'll stick to in-app for these unless asked.
      })

      return NextResponse.json({
        ok: true,
        reference,
        status: "SUCCESS",
        providerRef,
        provider: providerInfo.provider,
        message: (result as any).message || "Service executed successfully",
      })
    }

    const errorMsg = (result as any).message || (result as any).error || "Service execution failed"
    const errorCode = (result as any).code || "PROVIDER_ERROR"

    await prisma.$transaction([
      prisma.transaction.update({
        where: { reference },
        data: { status: "FAILED", meta: { serviceId, subServiceId, providerId: providerInfo.provider.id, params, error: errorMsg, code: errorCode } },
      }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "SERVICE_REQUEST_FAILED",
          resourceType: "Transaction",
          resourceId: reference,
          diffJson: { amount, serviceId, subServiceId, providerId: providerInfo.provider.id, error: errorMsg, code: errorCode, params },
        },
      }),
    ])

    const { sendNotification } = await import("@/lib/notifications")
    await sendNotification({
      userId: auth.user.id,
      type: "SERVICE_FAILED",
      title: `Service Failed: ${serviceId}`,
      body: `Your order for ${serviceId} failed. Reason: ${errorMsg}. Your balance has not been deducted or was refunded.`,
      email: {
        subject: "Service Purchase Failed - UFriends",
        html: `<h3>Service Order Failed</h3><p>Your order for <strong>${serviceId}</strong> failed.</p><p><strong>Reason:</strong> ${errorMsg}</p><p>Reference: ${reference}</p>`
      }
    })

    return NextResponse.json({ ok: false, reference, status: "FAILED", error: errorMsg, code: errorCode }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: "Service request failed", detail: String(err) }, { status: 500 })
  }
}