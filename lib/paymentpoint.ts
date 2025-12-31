import crypto from "crypto"

export function verifyPaymentPointSignature(rawBody: string, signatureHeader: string | null | undefined, secret: string): boolean {
  if (!secret) return false
  if (!rawBody) return false
  if (!signatureHeader) return false

  // Assume HMAC-SHA256 over raw body using PAYMENTPOINT secret
  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  const base64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64")
  return signatureHeader === hmac || signatureHeader === base64
}

export type PaymentPointWebhookPayload = {
  reference?: string
  status?: string
  amount?: number | string
  customer?: { email?: string; name?: string; userId?: string }
  meta?: Record<string, unknown>
  [k: string]: unknown
}

export function getPPReference(body: PaymentPointWebhookPayload): string | undefined {
  return body?.reference
}

export function getPPStatus(body: PaymentPointWebhookPayload): string | undefined {
  return body?.status
}

export function getPPAmount(body: PaymentPointWebhookPayload): number {
  const val = body?.amount ?? 0
  const n = typeof val === "string" ? Number(val) : (val as number)
  return Number.isFinite(n) ? n : 0
}

export async function paymentPointCreateVirtualAccount(input: {
  email: string
  name: string
  phoneNumber?: string
  bankCode?: string
  businessId?: string
}): Promise<{ accountNumber: string; bankName: string; accountName: string; accountReference?: string }> {
  const base = process.env.PAYMENTPOINT_BASE_URL || "https://api.paymentpoint.co/api/v1"
  const apiKey = process.env.PAYMENTPOINT_API_KEY || process.env.PAYMENTPOINT_PUBLIC_KEY || ""
  const apiSecret = process.env.PAYMENTPOINT_API_SECRET || ""
  if (!apiKey || !apiSecret) {
    throw new Error("Missing PAYMENTPOINT_API_KEY or PAYMENTPOINT_API_SECRET")
  }
  const headers = {
    Authorization: `Bearer ${apiSecret}`,
    "api-key": apiKey,
    "Content-Type": "application/json",
  }
  const body = {
    email: input.email,
    name: input.name,
    phoneNumber: input.phoneNumber,
    bankCode: input.bankCode || "29046",
    businessId: input.businessId,
  }
  const res = await fetch(`${base}/createVirtualAccount`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  const json: any = await res.json().catch(() => ({}))
  const payload = json?.data || json?.responseBody || json
  const accountNumber = String(
    payload?.accountNumber || payload?.account?.number || payload?.virtualAccountNumber || "",
  )
  const bankName = String(payload?.bankName || payload?.bank?.name || "PaymentPoint Partner Bank")
  const accountName = String(payload?.accountName || input.name)
  const accountReference = payload?.accountReference || payload?.reference
  if (!res.ok || !accountNumber) {
    throw new Error(`PaymentPoint create virtual account failed: ${res.status} ${JSON.stringify(json)}`)
  }
  return { accountNumber, bankName, accountName, accountReference }
}