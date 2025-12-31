import crypto from "crypto"

export function verifyMonnifySignature(rawBody: string, signatureHeader: string | null | undefined, secret: string): boolean {
  if (!secret) return false
  if (!rawBody) return false
  if (!signatureHeader) return false

  // Monnify signatures are typically HMAC-SHA256 over raw body with your secret
  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  const base64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64")

  // Accept either hex or base64 depending on provider config
  return signatureHeader === hmac || signatureHeader === base64
}

export type MonnifyWebhookPayload = {
  transactionReference?: string
  paymentReference?: string
  reference?: string
  status?: string
  paymentStatus?: string
  amount?: number | string
  paidAmount?: number | string
  customer?: { email?: string; name?: string; userId?: string }
  meta?: Record<string, unknown>
  [k: string]: unknown
}

export function getWebhookReference(body: MonnifyWebhookPayload): string | undefined {
  return body?.transactionReference || body?.paymentReference || body?.reference
}

export function getWebhookStatus(body: MonnifyWebhookPayload): string | undefined {
  return body?.status || body?.paymentStatus
}

export function getWebhookAmount(body: MonnifyWebhookPayload): number {
  const val = body?.amount ?? body?.paidAmount ?? 0
  const n = typeof val === "string" ? Number(val) : (val as number)
  return Number.isFinite(n) ? n : 0
}

export async function monnifyLogin(): Promise<string> {
  const base = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com/api/v1"
  const apiKey = process.env.MONNIFY_API_KEY || ""
  const secretKey = process.env.MONNIFY_SECRET_KEY || ""
  if (!apiKey || !secretKey) {
    throw new Error("Missing MONNIFY_API_KEY or MONNIFY_SECRET_KEY")
  }
  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64")
  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
  })
  const json: any = await res.json().catch(() => ({}))
  const token = json?.accessToken || json?.responseBody?.accessToken
  if (!res.ok || !token) {
    throw new Error(`Monnify login failed: ${res.status} ${JSON.stringify(json)}`)
  }
  return token
}

// Create or fetch a reserved account for a user
export async function monnifyCreateReservedAccount(input: {
  accountReference: string
  accountName: string
  customerName: string
  customerEmail: string
  bvn?: string
  currencyCode?: string
}): Promise<{ accountNumber: string; bankName: string }> {
  const base = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com/api/v1"
  const contractCode = process.env.MONNIFY_CONTRACT_CODE || ""
  if (!contractCode) {
    throw new Error("Missing MONNIFY_CONTRACT_CODE")
  }
  const token = await monnifyLogin()
  const body = {
    accountReference: input.accountReference,
    accountName: input.accountName,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    bvn: input.bvn,
    currencyCode: input.currencyCode || "NGN",
    contractCode,
  }
  const res = await fetch(`${base}/reserved-accounts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json: any = await res.json().catch(() => ({}))
  const payload = json?.responseBody || json
  const accountNumber = String(payload?.accountNumber || payload?.account?.number || "")
  const bankName = String(payload?.bankName || payload?.bank?.name || "Monnify Partner Bank")
  if (!res.ok || !accountNumber) {
    throw new Error(`Monnify reserved account failed: ${res.status} ${JSON.stringify(json)}`)
  }
  return { accountNumber, bankName }
}

export async function monnifyInitTransaction(input: {
  amount: number
  customerName: string
  customerEmail: string
  paymentDescription?: string
  currencyCode?: string
  contractCode?: string
  redirectUrl: string
  paymentReference: string
}): Promise<{ paymentUrl: string; checkoutUrl?: string }> {
  const base = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com/api/v1"
  const contractCode = input.contractCode || process.env.MONNIFY_CONTRACT_CODE || ""
  if (!contractCode) {
    throw new Error("Missing MONNIFY_CONTRACT_CODE")
  }
  const token = await monnifyLogin()
  const body = {
    amount: input.amount,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    paymentDescription: input.paymentDescription || `Wallet funding - ${input.paymentReference}`,
    currencyCode: input.currencyCode || "NGN",
    contractCode,
    redirectUrl: input.redirectUrl,
    paymentReference: input.paymentReference,
  }
  const res = await fetch(`${base}/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json: any = await res.json().catch(() => ({}))
  const payload = json?.responseBody || json
  const paymentUrl = String(payload?.paymentUrl || payload?.checkoutUrl || "")
  const checkoutUrl = String(payload?.checkoutUrl || "")
  if (!res.ok || !paymentUrl) {
    throw new Error(`Monnify init transaction failed: ${res.status} ${JSON.stringify(json)}`)
  }
  return { paymentUrl, checkoutUrl: checkoutUrl || undefined }
}