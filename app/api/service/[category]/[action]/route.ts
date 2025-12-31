import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { protect } from "@/lib/security"
import { z } from "zod"
import { getActiveProvider } from "@/lib/provider-manager"
import { sendAirtimeViaPorted } from "@/lib/providers/airtime-ported"
import { sendAirtimeViaSubAndGain } from "@/lib/providers/airtime-subandgain"
import { sendDataBundleViaPorted } from "@/lib/providers/data-ported"
import { sendDataBundleViaSubAndGain } from "@/lib/providers/data-subandgain"
import { payBillViaSubAndGain } from "@/lib/providers/bills-subandgain"
import { payEducationViaSubAndGain } from "@/lib/providers/education-subandgain"
import { payCableViaSubAndGain } from "@/lib/providers/cable-subandgain"
import { verifyNINViaPrembly } from "@/lib/providers/verification-prembly"
import getPrembly from "@/lib/prembly-sdk-adapter"
import { isManualService } from "@/lib/service-utils"

// POST /api/service/[category]/[action]
export async function POST(req: NextRequest, ctx: { params: Promise<{ category: string; action: string }> }) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { category, action } = await ctx.params
    const serviceId = decodeURIComponent(category)
    const actionId = decodeURIComponent(action)

    const body = await req.json()
    const Schema = z.object({
      amount: z.number().positive(),
      idempotencyKey: z.string().min(8).optional(),
      params: z.record(z.any()).default({}),
      subServiceId: z.string().optional(),
      pin: z.string().length(4).regex(/^\d+$/),
    })
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", detail: parsed.error.flatten() }, { status: 400 })
    }

    const { amount, idempotencyKey, params, subServiceId, pin } = parsed.data
    const reference = idempotencyKey || `SRV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Transaction PIN Verification
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

    // KYC Check: Exempt airtime, data, bills, education. Enforce for others (NIN, BVN, CAC, verification, etc.)
    const exemptCategories = ["airtime", "data", "bills", "education"]
    if (!exemptCategories.includes(serviceId.toLowerCase())) {
      const { ensureKyc } = await import("@/lib/kyc-check")
      const kycError = await ensureKyc(auth.user.id)
      if (kycError) return kycError
    }

    // Manual Service Check
    if (isManualService(serviceId, actionId)) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: auth.user.id } })
      if (!wallet || Number(wallet.balance) < amount) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 })
      }

      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: auth.user.id,
            type: "SERVICE_REQUEST",
            amount,
            status: "SUBMITTED" as any,
            reference,
            category: serviceId,
            subservice: actionId,
            meta: { serviceId, action: actionId, subServiceId, params, manual: true },
          },
        }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "MANUAL_SERVICE_REQUEST",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { amount, serviceId, action: actionId, subServiceId, params, status: "SUBMITTED" as any },
          },
        }),
      ])

      return NextResponse.json({
        ok: true,
        reference,
        status: "SUBMITTED" as any,
        message: "Service request submitted. Admin will review shortly.",
      })
    }

    // Idempotency: short-circuit on existing transaction
    const existing = await prisma.transaction.findUnique({ where: { reference } }).catch(() => null)
    if (existing) {
      return NextResponse.json({ ok: true, idempotent: true, reference, transaction: existing })
    }

    // Lightweight service: NIN flows (no external provider required) - slip/printout/advanced
    if (serviceId.toLowerCase() === "nin" && ["slip", "printout", "advanced"].includes(actionId.toLowerCase())) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: auth.user.id } })
      if (!wallet || Number(wallet.balance) < amount) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 })
      }

      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: auth.user.id,
            type: "SERVICE_PURCHASE",
            amount,
            status: "PENDING",
            reference,
            category: serviceId,
            subservice: actionId,
            meta: { serviceId, subServiceId, action: actionId, params },
          },
        }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_INIT",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { amount, serviceId, action: actionId, subServiceId, params },
          },
        }),
      ])

      await prisma.$transaction([
        prisma.transaction.update({ where: { reference }, data: { status: "SUCCESS", meta: { slip: "nin", variant: subServiceId } } }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { amount, serviceId, action: actionId, subServiceId, params },
          },
        }),
      ])

      return NextResponse.json({ ok: true, reference })
    }

    // BVN services (printout, advanced, retrieval_phone) via Prembly; debit wallet on success
    if (serviceId.toLowerCase() === "bvn") {
      const wallet = await prisma.wallet.findUnique({ where: { userId: auth.user.id } })
      if (!wallet || Number(wallet.balance) < amount) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 })
      }

      const premblyClient = getPrembly()
      let res: any = null
      try {
        if (actionId.toLowerCase() === "printout") {
          res = await premblyClient.getBVNPrintout({ bvn: String((params as any)?.bvn || "") })
        } else if (actionId.toLowerCase() === "advanced") {
          res = await premblyClient.getBVNAdvanced({ bvn: String((params as any)?.bvn || "") })
        } else if (actionId.toLowerCase() === "retrieval_phone") {
          res = await premblyClient.getBVNByPhone({ phoneNumber: String((params as any)?.phoneNumber || "") })
        } else {
          return NextResponse.json({ error: `Unsupported BVN action: ${actionId}` }, { status: 400 })
        }
      } catch (e: any) {
        res = { status: false, error: e?.message || String(e), detail: e?.message || String(e) }
      }

      if (!res?.status) {
        await prisma.$transaction([
          prisma.transaction.create({
            data: {
              userId: auth.user.id,
              type: "SERVICE_PURCHASE",
              amount,
              status: "FAILED",
              reference,
              category: serviceId,
              subservice: actionId,
              meta: { serviceId, action: actionId, params, error: res?.error || res?.detail },
            },
          }),
          prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_REQUEST_FAILED",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { amount, serviceId, action: actionId, reason: res?.error || res?.detail, params },
            },
          }),
        ])
        return NextResponse.json({ ok: false, reference, error: res?.error || res?.detail || "BVN request failed" }, { status: 400 })
      }

      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: auth.user.id,
            type: "SERVICE_PURCHASE",
            amount,
            status: "SUCCESS",
            reference,
            category: serviceId,
            subservice: actionId,
            meta: { serviceId, action: actionId, params },
          },
        }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { amount, serviceId, action: actionId, params },
          },
        }),
      ])

      return NextResponse.json({ ok: true, reference, data: res?.data })
    }

    // Provider selection (for services that require an external provider)
    const providerInfo = await getActiveProvider(serviceId)
    if (!providerInfo.provider) {
      return NextResponse.json(
        { error: "No active provider for service", serviceId, fallbackProviders: providerInfo.fallbackProviders },
        { status: 503 },
      )
    }

    // Wallet check (outline)
    const wallet = await prisma.wallet.findUnique({ where: { userId: auth.user.id } })
    if (!wallet || Number(wallet.balance) < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 })
    }

    // Create initial transaction and audit
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: auth.user.id,
          type: "SERVICE_PURCHASE",
          amount,
          status: "PENDING",
          reference,
          category: serviceId,
          subservice: subServiceId || actionId,
          meta: { serviceId, subServiceId, action: actionId, providerId: providerInfo.provider.id, params },
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "SERVICE_REQUEST_INIT",
          resourceType: "Transaction",
          resourceId: reference,
          diffJson: { amount, serviceId, action: actionId, subServiceId, providerId: providerInfo.provider.id, params },
        },
      }),
    ])

    // For airtime/vtu, use live adapters (SubAndGain or Ported SIM); add failover to fallback providers
    if (serviceId === "airtime" && actionId === "vtu") {
      const adapterName = String((providerInfo.provider.configJson as any)?.adapter || "")
        .toLowerCase()
      const providerName = providerInfo.provider.name.toLowerCase()
      const isSubAndGain = adapterName.includes("subandgain") || providerName.includes("subandgain")
      const isPorted = adapterName.includes("ported") || providerName.includes("ported")
      const isMock = adapterName.includes("mock") || providerName.includes("mock")

      let res = isSubAndGain
        ? await sendAirtimeViaSubAndGain(
          {
            amount,
            params: { phone: String(params?.phone || ""), network: String(params?.network || "") },
            providerId: providerInfo.provider.id,
            subServiceId,
          },
          providerInfo.provider,
        )
        : isPorted
          ? await sendAirtimeViaPorted(
            {
              amount,
              params: { phone: String(params?.phone || ""), network: String(params?.network || "") },
              providerId: providerInfo.provider.id,
              subServiceId,
            },
            providerInfo.provider,
          )
          : isMock
            ? {
              ok: true,
              providerReference: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              message: "Mock airtime purchase successful",
            }
            : { ok: false, code: "UNSUPPORTED_ADAPTER", message: "Unsupported airtime adapter (expected subandgain, ported, or mock)" }

      // Failover: if primary fails and we have fallback providers, try them sequentially
      let usedProvider = providerInfo.provider
      if (!res.ok && providerInfo.fallbackProviders.length > 0) {
        for (const fb of providerInfo.fallbackProviders) {
          const fbAdapter = String((fb.configJson as any)?.adapter || fb.name || "").toLowerCase()
          const fbIsPorted = fbAdapter.includes("ported") || fbAdapter.includes("portedsim")
          const fbIsSAG = fbAdapter.includes("subandgain")
          const supportsAirtime = fb.category === "airtime"
          if (!supportsAirtime || (!fbIsPorted && !fbIsSAG)) continue

          await prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_FAILOVER_ATTEMPT",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { fromProviderId: usedProvider?.id, toProviderId: fb.id, category: serviceId },
            },
          })

          const attempt = fbIsPorted
            ? await sendAirtimeViaPorted({ amount, params: { phone: String(params?.phone || ""), network: String(params?.network || "") }, providerId: fb.id, subServiceId }, fb)
            : await sendAirtimeViaSubAndGain({ amount, params: { phone: String(params?.phone || ""), network: String(params?.network || "") }, providerId: fb.id, subServiceId }, fb)

          if (attempt.ok) {
            res = attempt
            usedProvider = fb
            break
          }
        }
      }

      if (!res.ok) {
        await prisma.$transaction([
          prisma.transaction.update({ where: { reference }, data: { status: "FAILED", meta: { error: res.message, code: res.code } } }),
          prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_REQUEST_FAILED",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { amount, serviceId, action: actionId, subServiceId, reason: res.message, code: res.code, params },
            },
          }),
        ])
        return NextResponse.json({ ok: false, reference, error: res.message, code: res.code }, { status: 400 })
      }

      // Success: mark transaction and debit wallet atomically
      await prisma.$transaction([
        prisma.transaction.update({ where: { reference }, data: { status: "SUCCESS", meta: { providerRef: res.providerReference, providerId: usedProvider?.id } } }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { amount, serviceId, action: actionId, subServiceId, providerRef: res.providerReference, providerId: usedProvider?.id },
          },
        }),
      ])

      return NextResponse.json({ ok: true, reference, provider: usedProvider, providerRef: res.providerReference })
    }

    // For data/bundle, use live adapters (SubAndGain or Ported SIM); add failover to fallback providers
    if (serviceId === "data" && actionId === "bundle") {
      const adapterName = String((providerInfo.provider.configJson as any)?.adapter || "")
        .toLowerCase()
      const providerName = providerInfo.provider.name.toLowerCase()
      const isSubAndGain = adapterName.includes("subandgain") || providerName.includes("subandgain")
      const isPorted = adapterName.includes("ported") || providerName.includes("ported")

      let res = isSubAndGain
        ? await sendDataBundleViaSubAndGain(
          {
            amount,
            params: {
              phone: String(params?.phone || ""),
              network: String(params?.network || ""),
              planCode: String(params?.planCode || ""),
            },
            providerId: providerInfo.provider.id,
            subServiceId,
          },
          providerInfo.provider,
        )
        : isPorted
          ? await sendDataBundleViaPorted(
            {
              amount,
              params: {
                phone: String(params?.phone || ""),
                network: String(params?.network || ""),
                planCode: String(params?.planCode || ""),
              },
              providerId: providerInfo.provider.id,
              subServiceId,
            },
            providerInfo.provider,
          )
          : { ok: false, code: "UNSUPPORTED_ADAPTER", message: "Unsupported data adapter (expected subandgain or ported)" }

      // Failover: if primary fails and we have fallback providers, try them sequentially
      let usedProvider = providerInfo.provider
      if (!res.ok && providerInfo.fallbackProviders.length > 0) {
        for (const fb of providerInfo.fallbackProviders) {
          const fbAdapter = String((fb.configJson as any)?.adapter || fb.name || "").toLowerCase()
          const fbIsPorted = fbAdapter.includes("ported") || fbAdapter.includes("portedsim")
          const fbIsSAG = fbAdapter.includes("subandgain")
          const supportsData = fb.category === "data"
          if (!supportsData || (!fbIsPorted && !fbIsSAG)) continue

          await prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_FAILOVER_ATTEMPT",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { fromProviderId: usedProvider?.id, toProviderId: fb.id, category: serviceId },
            },
          })

          const attempt = fbIsPorted
            ? await sendDataBundleViaPorted({ amount, params: { phone: String(params?.phone || ""), network: String(params?.network || ""), planCode: String(params?.planCode || "") }, providerId: fb.id, subServiceId }, fb)
            : await sendDataBundleViaSubAndGain({ amount, params: { phone: String(params?.phone || ""), network: String(params?.network || ""), planCode: String(params?.planCode || "") }, providerId: fb.id, subServiceId }, fb)

          if (attempt.ok) {
            res = attempt
            usedProvider = fb
            break
          }
        }
      }

      if (!res.ok) {
        await prisma.$transaction([
          prisma.transaction.update({ where: { reference }, data: { status: "FAILED", meta: { error: res.message, code: res.code } } }),
          prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_REQUEST_FAILED",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { amount, serviceId, action: actionId, subServiceId, reason: res.message, code: res.code, params },
            },
          }),
        ])
        return NextResponse.json({ ok: false, reference, error: res.message, code: res.code }, { status: 400 })
      }

      // Success: mark transaction and debit wallet atomically
      await prisma.$transaction([
        prisma.transaction.update({ where: { reference }, data: { status: "SUCCESS", meta: { providerRef: res.providerReference, providerId: usedProvider?.id } } }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: { amount, serviceId, action: actionId, subServiceId, providerRef: res.providerReference, providerId: usedProvider?.id },
          },
        }),
      ])

      return NextResponse.json({ ok: true, reference, provider: usedProvider, providerRef: res.providerReference })
    }

    // For bills/electricity, use SubAndGain live adapter only; remove mock
    if (serviceId === "bills" && actionId === "electricity") {
      const adapterName = String((providerInfo.provider.configJson as any)?.adapter || "").toLowerCase()
      const providerName = providerInfo.provider.name.toLowerCase()
      const isSubAndGain = adapterName.includes("subandgain") || providerName.includes("subandgain")

      const res = isSubAndGain
        ? await payBillViaSubAndGain(
          {
            amount,
            params: {
              meterNumber: String(params?.meterNumber || ""),
              serviceProvider: String(params?.serviceProvider || ""),
              customerName: String(params?.customerName || ""),
              customerAddress: String(params?.customerAddress || ""),
            },
            providerId: providerInfo.provider.id,
            subServiceId,
          },
          providerInfo.provider,
        )
        : { ok: false, code: "UNSUPPORTED_ADAPTER", message: "Unsupported bills adapter (expected subandgain)" }

      if (!res.ok) {
        await prisma.$transaction([
          prisma.transaction.update({ where: { reference }, data: { status: "FAILED", meta: { error: res.message, code: res.code } } }),
          prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_REQUEST_FAILED",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { amount, serviceId, action: actionId, subServiceId, reason: res.message, code: res.code, params },
            },
          }),
        ])
        return NextResponse.json({ ok: false, reference, error: res.message, code: res.code }, { status: 400 })
      }

      // Success: mark transaction and debit wallet atomically
      await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            meta: {
              providerRef: res.providerReference,
              token: res.token,
              units: res.units
            }
          }
        }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: {
              amount,
              serviceId,
              action: actionId,
              subServiceId,
              providerRef: res.providerReference,
              token: res.token,
              units: res.units,
              params
            },
          },
        }),
      ])

      return NextResponse.json({
        ok: true,
        reference,
        provider: providerInfo.provider,
        providerRef: res.providerReference,
        token: res.token,
        units: res.units
      })
    }

    // For bills/cable, use SubAndGain live adapter
    if (serviceId === "bills" && actionId === "cable") {
      const adapterName = String((providerInfo.provider.configJson as any)?.adapter || "").toLowerCase()
      const providerName = providerInfo.provider.name.toLowerCase()
      const isSubAndGain = adapterName.includes("subandgain") || providerName.includes("subandgain")

      const res = isSubAndGain
        ? await payCableViaSubAndGain(
          {
            amount,
            params: {
              smartcardNumber: String(params?.smartcardNumber || ""),
              provider: String(params?.provider || ""),
              planId: String(params?.planId || ""),
              customerName: String(params?.customerName || ""),
            },
            providerId: providerInfo.provider.id,
            subServiceId,
          },
          providerInfo.provider,
        )
        : { ok: false, code: "UNSUPPORTED_ADAPTER", message: "Unsupported cable adapter (expected subandgain)" }

      if (!res.ok) {
        await prisma.$transaction([
          prisma.transaction.update({ where: { reference }, data: { status: "FAILED", meta: { error: res.message, code: res.code } } }),
          prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_REQUEST_FAILED",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { amount, serviceId, action: actionId, subServiceId, reason: res.message, code: res.code, params },
            },
          }),
        ])
        return NextResponse.json({ ok: false, reference, error: res.message, code: res.code }, { status: 400 })
      }

      // Success: mark transaction and debit wallet atomically
      await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            meta: {
              providerRef: res.providerReference,
            }
          }
        }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: {
              amount,
              serviceId,
              action: actionId,
              subServiceId,
              providerRef: res.providerReference,
              params
            },
          },
        }),
      ])

      return NextResponse.json({
        ok: true,
        reference,
        provider: providerInfo.provider,
        providerRef: res.providerReference,
      })
    }

    // For education tokens/pins, use SubAndGain live adapter. Support sub-endpoints for exams
    if (serviceId === "education") {
      const adapterName = String((providerInfo.provider.configJson as any)?.adapter || "").toLowerCase()
      const providerName = providerInfo.provider.name.toLowerCase()
      const isSubAndGain = adapterName.includes("subandgain") || providerName.includes("subandgain")
      const isMock = adapterName.includes("mock") || providerName.includes("mock")

      // Map action to eduType if action represents a specific exam
      const actionToEduType: Record<string, string> = {
        neco: "NECO",
        waec: "WAEC",
        nabteb: "NABTEB",
        nbais: "NBAIS",
        token: String((params as any)?.eduType || ""),
      }
      // Normalize UI labels like "WAEC Pin" -> "WAEC"; prioritize params.eduType
      const incomingEduTypeRaw = String((params as any)?.eduType || "")
      const normalizedLabel = incomingEduTypeRaw.trim().toUpperCase()
      let mappedEduType = ""
      if (normalizedLabel) {
        if (normalizedLabel.includes("WAEC") || normalizedLabel.includes("GCE")) mappedEduType = "WAEC"
        else if (normalizedLabel.includes("NECO")) mappedEduType = "NECO"
        else if (normalizedLabel.includes("NABTEB")) mappedEduType = "NABTEB"
        else if (normalizedLabel.includes("NBAIS")) mappedEduType = "NBAIS"
        else mappedEduType = normalizedLabel
      } else {
        mappedEduType = actionToEduType[actionId] || ""
      }

      let res = isSubAndGain
        ? await payEducationViaSubAndGain(
          {
            amount,
            params: { eduType: mappedEduType },
            providerId: providerInfo.provider.id,
            subServiceId,
          },
          providerInfo.provider,
        )
        : isMock
          ? {
            ok: true,
            providerReference: `mock_edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            token: `EDU-${mappedEduType || 'TOKEN'}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            message: `Mock education token purchase successful for ${mappedEduType || 'education service'}`,
          }
          : { ok: false, code: "UNSUPPORTED_ADAPTER", message: "Unsupported education adapter (expected subandgain or mock)" }

      if (!res.ok) {
        await prisma.$transaction([
          prisma.transaction.update({ where: { reference }, data: { status: "FAILED", meta: { error: res.message, code: res.code } } }),
          prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_REQUEST_FAILED",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { amount, serviceId, action: actionId, subServiceId, reason: res.message, code: res.code, params },
            },
          }),
        ])
        return NextResponse.json({ ok: false, reference, error: res.message, message: res.message, code: res.code }, { status: 400 })
      }

      // Success
      await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            meta: {
              providerRef: res.providerReference,
              token: res.token
            }
          }
        }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: {
              amount,
              serviceId,
              action: actionId,
              subServiceId,
              providerRef: res.providerReference,
              token: res.token,
              params
            },
          },
        }),
      ])

      return NextResponse.json({
        ok: true,
        reference,
        provider: providerInfo.provider,
        providerRef: res.providerReference,
        token: res.token
      })
    }

    // For verification/nin, call Prembly API when configured; no mock fallback
    if (serviceId === "verification" && actionId === "nin") {
      const useReal = String((providerInfo.provider.configJson as any)?.adapter || "")
        .toLowerCase()
        .includes("prembly") || providerInfo.provider.name.toLowerCase().includes("prembly")

      if (!useReal) {
        return NextResponse.json({ error: "Unsupported verification provider. Prembly required." }, { status: 503 })
      }

      const res = await verifyNINViaPrembly(
        {
          nin: String(params?.nin || ""),
          phone: String(params?.phone || ""),
          firstName: String(params?.firstName || ""),
          lastName: String(params?.lastName || ""),
          dateOfBirth: String(params?.dateOfBirth || ""),
          gender: String(params?.gender || ""),
        },
        providerInfo.provider,
      )

      if (!res.ok) {
        await prisma.$transaction([
          prisma.transaction.update({ where: { reference }, data: { status: "FAILED", meta: { error: res.message, code: res.code } } }),
          prisma.auditLog.create({
            data: {
              actorId: auth.user.id,
              action: "SERVICE_REQUEST_FAILED",
              resourceType: "Transaction",
              resourceId: reference,
              diffJson: { amount, serviceId, action: actionId, subServiceId, reason: res.message, code: res.code, params },
            },
          }),
        ])
        return NextResponse.json({ ok: false, reference, error: res.message, code: res.code }, { status: 400 })
      }

      // Success: mark transaction and debit wallet atomically
      await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            meta: {
              providerRef: res.reference,
              transactionId: res.transactionId,
              verificationData: res.data
            }
          }
        }),
        prisma.wallet.update({ where: { userId: auth.user.id }, data: { balance: { decrement: amount } } }),
        prisma.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: "SERVICE_REQUEST_SUCCESS",
            resourceType: "Transaction",
            resourceId: reference,
            diffJson: {
              amount,
              serviceId,
              action: actionId,
              subServiceId,
              providerRef: res.reference,
              transactionId: res.transactionId,
              nin: params?.nin,
              params
            },
          },
        }),
      ])

      return NextResponse.json({
        ok: true,
        reference,
        provider: providerInfo.provider,
        providerRef: res.reference,
        transactionId: res.transactionId,
        data: res.data
      })
    }

    // Default: queued (awaiting provider processing)
    return NextResponse.json({ ok: true, reference, provider: providerInfo.provider, message: "Queued" })
  } catch (err) {
    return NextResponse.json({ error: "Service request failed", detail: String(err) }, { status: 500 })
  }
}
