import { type AirtimeRequest, type AirtimeResponse } from "@/lib/providers/airtime"
import { type ProviderConfig } from "@/lib/provider-manager"
import { fetchJsonWithRetry } from "@/lib/http-client"

// Normalize common Nigerian network names to SubAndGain-expected values
function normalizeNetwork(input: string): string {
  const n = input.trim().toUpperCase()
  if (!n) return n
  if (n === "ETISALAT") return "9MOBILE"
  if (n === "9 MOBILE" || n === "9-MOBILE") return "9MOBILE"
  if (n === "AIRTEL NG") return "AIRTEL"
  return n
}

/**
 * Real Airtime VTU adapter for SubAndGain providers.
 * Uses provider configuration (base URL + API keys) or environment fallbacks.
 *
 * SubAndGain docs: https://subandgain.com/APIAirtime.php (pattern similar to data/bills)
 * Endpoint (typical): GET https://subandgain.com/api/airtime.php?username=...&apiKey=...&network=...&amount=...&phoneNumber=...
 */
export async function sendAirtimeViaSubAndGain(
  req: AirtimeRequest,
  provider?: ProviderConfig,
): Promise<AirtimeResponse> {
  const apiBase = provider?.apiBaseUrl || process.env.SUBANDGAIN_BASE_URL || "https://subandgain.com"

  const apiKey = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "apikey")?.keyValue ||
    process.env.SUBANDGAIN_API_KEY || ""
  const username = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "username")?.keyValue ||
    process.env.SUBANDGAIN_USERNAME || ""

  if (!apiBase || !apiKey || !username) {
    return { ok: false, code: "MISSING_CONFIG", message: "Missing provider base URL, username, or API key" }
  }

  const phoneNumber = String((req.params as any)?.phone || (req.params as any)?.phoneNumber || "").trim()
  const rawNetwork = String(req.params?.network || "")
  const normalizedNetwork = normalizeNetwork(rawNetwork)

  if (!phoneNumber || !normalizedNetwork || !(req.amount > 0)) {
    return { ok: false, code: "BAD_INPUT", message: "Missing phone, network, or amount" }
  }

  const validNetworks = ["MTN", "GLO", "AIRTEL", "9MOBILE"]
  if (!validNetworks.includes(normalizedNetwork)) {
    return { ok: false, code: "INVALID_NETWORK", message: `Unsupported network: ${rawNetwork}` }
  }

  try {
    const network = normalizedNetwork
    
    // Ensure amount is an integer Naira value
    const amount = Math.round(Number(req.amount))

    const airtimePath = "/api/airtime.php"
    const url = `${apiBase}${airtimePath}?username=${encodeURIComponent(username)}&apiKey=${encodeURIComponent(apiKey)}&network=${encodeURIComponent(network)}&amount=${encodeURIComponent(String(amount))}&phoneNumber=${encodeURIComponent(phoneNumber)}`

    const { res, data } = await fetchJsonWithRetry(url, { method: "GET" }, { retries: 3, baseDelayMs: 400, timeoutMs: 10000 })

    // Robust provider error detection: treat "0" or 0 as success
    const rawErr = (data as any)?.error
    const errStr = typeof rawErr === "string" ? rawErr.trim().toLowerCase() : rawErr
    const looksSuccessText = String((data as any)?.api_response || (data as any)?.message || "").toLowerCase()
    const isProviderError = !res.ok || (
      rawErr != null &&
      errStr !== 0 && errStr !== "0" && errStr !== "" && errStr !== "ok" && errStr !== "success" && !/success/.test(looksSuccessText)
    )

    if (isProviderError) {
      const errorCode = (data as any)?.error || "PROVIDER_ERROR"
      const message = (data as any)?.description || (data as any)?.message || (data as any)?.api_response || `Provider error (${res.status})`
      switch (errorCode) {
        case "ERR200":
          return { ok: false, code: "INVALID_USERNAME", message: "Username field is empty" }
        case "ERR201":
          return { ok: false, code: "INVALID_CREDENTIALS", message: "Invalid username or API key" }
        case "ERR202":
          return { ok: false, code: "INVALID_PHONE", message: "Invalid recipient phone number" }
        case "ERR203":
          return { ok: false, code: "INSUFFICIENT_BALANCE", message: "Insufficient balance to complete transaction" }
        case "ERR204":
          return { ok: false, code: "INVALID_NETWORK", message: "Invalid network provider specified" }
        case "ERR206":
          return { ok: false, code: "TRANSACTION_FAILED", message: "Order could not be processed. Please try again later" }
        default:
          return { ok: false, code: String(errorCode), message }
      }
    }

    const providerReference = (data as any)?.trans_id || (data as any)?.reference || (data as any)?.transactionId || (data as any)?.transaction_id
    if (!providerReference) {
      return { ok: false, code: "NO_REFERENCE", message: "Missing provider reference" }
    }

    return {
      ok: true,
      providerReference,
      message: (data as any)?.api_response || (data as any)?.message || "Airtime delivered",
    }
  } catch (err) {
    return { ok: false, code: "NETWORK_ERROR", message: String(err) }
  }
}