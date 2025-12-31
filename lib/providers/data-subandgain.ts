import { type DataRequest, type DataResponse } from "@/lib/providers/data"
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
 * Real Data Bundle adapter for SubAndGain providers.
 * Uses provider configuration (base URL + API keys) or environment fallbacks.
 *
 * Docs: https://subandgain.com/APIBuyData.php
 * Endpoint: GET https://subandgain.com/api/data.php?username=...&apiKey=...&network=...&dataPlan=...&phoneNumber=...
 */
export async function sendDataBundleViaSubAndGain(
  req: DataRequest,
  provider?: ProviderConfig,
): Promise<DataResponse> {
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
  const planCode = String((req.params as any)?.planCode || (req.params as any)?.plan || (req.params as any)?.dataPlan || "").trim()

  if (!phoneNumber || !normalizedNetwork || !planCode) {
    return { ok: false, code: "BAD_INPUT", message: "Missing phone, network, or planCode" }
  }

  const validNetworks = ["MTN", "GLO", "AIRTEL", "9MOBILE"]
  if (!validNetworks.includes(normalizedNetwork)) {
    return { ok: false, code: "INVALID_NETWORK", message: `Unsupported network: ${rawNetwork}` }
  }

  try {
    const network = normalizedNetwork
    const dataPlan = planCode

    const dataPath = "/api/data.php"
    const url = `${apiBase}${dataPath}?username=${encodeURIComponent(username)}&apiKey=${encodeURIComponent(apiKey)}&network=${encodeURIComponent(network)}&dataPlan=${encodeURIComponent(dataPlan)}&phoneNumber=${encodeURIComponent(phoneNumber)}`

    const { res, data } = await fetchJsonWithRetry(url, { method: "GET" }, { retries: 3, baseDelayMs: 400, timeoutMs: 10000 })

    if (!res.ok || data?.error) {
      const errorCode = data?.error || "PROVIDER_ERROR";
      let message = data?.description || data?.message || data?.error || `Provider error (${res.status})`;
      
      // Map SubAndGain specific error codes to user-friendly messages
      switch (errorCode) {
        case "ERR200":
          return { ok: false, code: "INVALID_USERNAME", message: "Username field is empty" };
        case "ERR201":
          return { ok: false, code: "INVALID_CREDENTIALS", message: "Invalid username or API key" };
        case "ERR202":
          return { ok: false, code: "INVALID_PHONE", message: "Invalid recipient phone number" };
        case "ERR203":
          return { ok: false, code: "INSUFFICIENT_BALANCE", message: "Insufficient balance to complete transaction" };
        case "ERR204":
          return { ok: false, code: "INVALID_NETWORK", message: "Invalid network provider specified" };
        case "ERR206":
          return { ok: false, code: "TRANSACTION_FAILED", message: "Order could not be processed. Please try again later" };
        case "ERR207":
          return { ok: false, code: "INVALID_PLAN", message: "Invalid data plan selected" };
        default:
          return { ok: false, code: errorCode, message };
      }
    }

    const providerReference = data?.trans_id || data?.reference || data?.transactionId
    if (!providerReference) {
      return { ok: false, code: "NO_REFERENCE", message: "Missing provider reference" }
    }

    return {
      ok: true,
      providerReference,
      message: data?.api_response || data?.message || "Data bundle activated",
    }
  } catch (err) {
    return { ok: false, code: "NETWORK_ERROR", message: String(err) }
  }
}