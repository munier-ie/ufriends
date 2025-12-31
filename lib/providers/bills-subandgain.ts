import { type BillsRequest, type BillsResponse } from "@/lib/providers/bills"
import { type ProviderConfig } from "@/lib/provider-manager"
import { fetchJsonWithRetry, buildAuthHeaders } from "@/lib/http-client"

/**
 * Real Bills/Electricity adapter for SubAndGain provider.
 * Uses provider configuration (base URL + API keys) or environment fallbacks.
 *
 * Expected provider config:
 * - apiBaseUrl: string (e.g., https://subandgain.com)
 * - apiKeys: [{ keyName: "apiKey", keyValue: "..." }]
 * - configJson may include { adapter: "subandgain", endpoints: { purchase: "/electricity/purchase" } }
 */
export async function payBillViaSubAndGain(
  req: BillsRequest,
  provider?: ProviderConfig,
): Promise<BillsResponse> {
  const apiBase = provider?.apiBaseUrl || process.env.SUBANDGAIN_BASE_URL || "https://subandgain.com"
  const apiKey = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "apikey")?.keyValue ||
    process.env.SUBANDGAIN_API_KEY || ""

  const purchasePath = (provider?.configJson as any)?.endpoints?.purchase || "/electricity/purchase"
  const url = `${apiBase}${purchasePath}`

  if (!apiBase || !apiKey) {
    return { ok: false, code: "MISSING_CONFIG", message: "Missing provider base URL or API key" }
  }

  // Basic validation mirroring the mock adapter
  if (!req.params?.meterNumber || !req.params?.serviceProvider) {
    return { ok: false, code: "BAD_INPUT", message: "Missing meter number or service provider" }
  }

  try {
    const payload = {
      meterNumber: req.params.meterNumber,
      disco: req.params.serviceProvider, // provider code/name per upstream API
      amount: req.amount,
      // Additional optional fields
      customerName: req.params.customerName,
      customerAddress: req.params.customerAddress,
      // Pass through subServiceId if upstream supports variants
      subServiceId: req.subServiceId,
    }

    const { res, data } = await fetchJsonWithRetry(url, {
      method: "POST",
      headers: buildAuthHeaders(apiKey),
      body: JSON.stringify(payload),
    }, { retries: 3, baseDelayMs: 400, timeoutMs: 10000 })

    if (!res.ok) {
      const errorCode = data?.error || "PROVIDER_ERROR";
      let message = data?.message || data?.error || `Provider error (${res.status})`;
      
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
        case "ERR208":
          return { ok: false, code: "INVALID_METER", message: "Invalid meter number provided" };
        case "ERR209":
          return { ok: false, code: "INVALID_DISCO", message: "Invalid electricity provider specified" };
        case "ERR210":
          return { ok: false, code: "INVALID_AMOUNT", message: "Invalid amount specified" };
        default:
          return { ok: false, code: errorCode || data?.code || "PROVIDER_ERROR", message };
      }
    }

    // Map common fields from provider response
    const providerReference = data?.reference || data?.providerRef || data?.transactionId
    const token = data?.token || data?.tokenUnits || data?.unitsToken
    const units = data?.units || (data?.energyUnits ? `${data.energyUnits} kWh` : undefined)

    if (!providerReference) {
      return { ok: false, code: "NO_REFERENCE", message: "Missing provider reference" }
    }

    return {
      ok: true,
      providerReference,
      token,
      units,
      message: data?.message || "Electricity purchase successful",
    }
  } catch (err) {
    return { ok: false, code: "NETWORK_ERROR", message: String(err) }
  }
}