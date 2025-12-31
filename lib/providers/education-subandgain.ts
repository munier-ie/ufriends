import { type ProviderConfig } from "@/lib/provider-manager"
import { fetchJsonWithRetry } from "@/lib/http-client"

export type EducationParams = {
  eduType: string // e.g. NEONE, WAEONE, etc (see docs)
}

export type EducationRequest = {
  amount: number
  params: EducationParams
  providerId: string
  subServiceId?: string
}

export type EducationResponse = {
  ok: boolean
  providerReference?: string
  token?: string
  code?: string
  message?: string
}

/**
 * Real Education Bills adapter for SubAndGain providers.
 * Uses provider configuration (base URL + API keys) or environment fallbacks.
 *
 * Docs: https://subandgain.com/APIEducation.php
 * Endpoint: GET https://subandgain.com/api/education.php?username=...&apiKey=...&eduType=...
 */
export async function payEducationViaSubAndGain(
  req: EducationRequest,
  provider?: ProviderConfig,
): Promise<EducationResponse> {
  const apiBase = provider?.apiBaseUrl || process.env.SUBANDGAIN_BASE_URL || "https://subandgain.com"

  const apiKey = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "apikey")?.keyValue ||
    process.env.SUBANDGAIN_API_KEY || ""
  const username = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "username")?.keyValue ||
    process.env.SUBANDGAIN_USERNAME || ""

  if (!apiBase || !apiKey || !username) {
    return { ok: false, code: "MISSING_CONFIG", message: "Missing provider base URL, username, or API key" }
  }

  if (!req.params?.eduType) {
    return { ok: false, code: "BAD_INPUT", message: "Missing eduType" }
  }

  try {
    const eduType = String(req.params.eduType).toUpperCase()

    const eduPath = "/api/education.php"
    const url = `${apiBase}${eduPath}?username=${encodeURIComponent(username)}&apiKey=${encodeURIComponent(apiKey)}&eduType=${encodeURIComponent(eduType)}`

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
        case "ERR203":
          return { ok: false, code: "INSUFFICIENT_BALANCE", message: "Insufficient balance to complete transaction" };
        case "ERR206":
          return { ok: false, code: "TRANSACTION_FAILED", message: "Order could not be processed. Please try again later" };
        case "ERR207":
          return { ok: false, code: "INVALID_EDU_TYPE", message: "Invalid education type specified" };
        default:
          return { ok: false, code: errorCode, message };
      }
    }

    const providerReference = data?.trans_id || data?.reference || data?.transactionId
    const token = data?.token
    if (!providerReference) {
      return { ok: false, code: "NO_REFERENCE", message: "Missing provider reference" }
    }

    return {
      ok: true,
      providerReference,
      token,
      message: data?.message || "Education token purchase successful",
    }
  } catch (err) {
    return { ok: false, code: "NETWORK_ERROR", message: String(err) }
  }
}