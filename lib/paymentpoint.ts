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
  const data = (body?.data || body) as any
  return data?.reference || data?.payment_reference || data?.txn_ref || data?.transaction_reference || data?.transaction_id
}

export function getPPStatus(body: PaymentPointWebhookPayload): string | undefined {
  const data = (body?.data || body) as any
  return data?.status || data?.payment_status || data?.transaction_status || data?.notification_status
}

export function getPPAmount(body: PaymentPointWebhookPayload): number {
  const data = (body?.data || body) as any
  const val = data?.amount ?? data?.total_amount ?? data?.amount_paid ?? 0
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
  const apiSecret = process.env.PAYMENTPOINT_SECRET_KEY || process.env.PAYMENTPOINT_API_SECRET || ""
  const businessId = input.businessId || process.env.PAYMENTPOINT_BUSINESS_ID || ""

  if (!apiKey || !apiSecret) {
    throw new Error("Missing PAYMENTPOINT_API_KEY or PAYMENTPOINT_SECRET_KEY")
  }

  // Ensure base ends with /api/v1 if it's the root domain
  const apiUrl = base.endsWith("/api/v1") ? base : `${base.replace(/\/$/, "")}/api/v1`

  const headers = {
    Authorization: `Bearer ${apiSecret}`,
    "api-key": apiKey,
    "Content-Type": "application/json",
  }
  // Normalize phone number to 11 digits (e.g., 080...)
  let normalizedPhone = (input.phoneNumber || "").replace(/\D/g, "")
  if (normalizedPhone.startsWith("234") && normalizedPhone.length > 10) {
    normalizedPhone = "0" + normalizedPhone.slice(3)
  }
  if (normalizedPhone.length === 10 && !normalizedPhone.startsWith("0")) {
    normalizedPhone = "0" + normalizedPhone
  }
  // Ultimate check: if it's still not 11 digits, PaymentPoint might reject it
  // We'll pass it as is but truncate/pad if absolutely necessary to avoid 403
  // However, most providers just want the local 11-digit format.

  const body = {
    email: input.email,
    name: input.name,
    phoneNumber: normalizedPhone,
    bankCode: [input.bankCode || "20946"],
    businessId: businessId,
  }
  const res = await fetch(`${apiUrl}/createVirtualAccount`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  const json: any = await res.json().catch(() => ({}))

  // PaymentPoint often returns success in 'status' field even if res.ok is false or 201
  const isSuccess = res.ok || json?.status === "success" || json?.status === "true" || !!json?.data

  const payload = json?.data || json?.responseBody || json
  const bankAccount = Array.isArray(json?.bankAccounts) ? json.bankAccounts[0] : null

  const accountNumber = String(
    bankAccount?.accountNumber ||
    payload?.accountNumber ||
    payload?.account?.number ||
    payload?.virtualAccountNumber ||
    ""
  )

  const bankName = String(
    bankAccount?.bankName ||
    payload?.bankName ||
    payload?.bank?.name ||
    "PaymentPoint Partner Bank"
  )

  const accountName = String(
    bankAccount?.accountName ||
    payload?.accountName ||
    input.name
  )

  const accountReference =
    bankAccount?.Reserved_Account_Id ||
    payload?.accountReference ||
    payload?.reference

  if (!isSuccess || !accountNumber || accountNumber === "undefined") {
    throw new Error(`PaymentPoint create virtual account failed: ${res.status} ${JSON.stringify(json)}`)
  }

  return { accountNumber, bankName, accountName, accountReference }
}