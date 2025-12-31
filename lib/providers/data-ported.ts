import { type DataRequest, type DataResponse } from "@/lib/providers/data"
import { type ProviderConfig } from "@/lib/provider-manager"
import { fetchJsonWithRetry, buildAuthHeaders } from "@/lib/http-client"

/**
 * Real Data Bundle adapter for PortedSIM-like providers.
 * Uses provider configuration (base URL + API keys) or environment fallbacks.
 *
 * Expected provider config:
 * - apiBaseUrl: string (e.g., https://api.portedsim.com)
 * - apiKeys: [{ keyName: "apiKey", keyValue: "..." }]
 * - configJson may include { adapter: "ported", endpoints: { bundle: "/data/bundle" } }
 */
export async function sendDataBundleViaPorted(
  req: DataRequest,
  provider?: ProviderConfig,
): Promise<DataResponse> {
  const apiBase = provider?.apiBaseUrl || process.env.PORTEDSIM_BASE_URL || ""
  const apiKey = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "apikey")?.keyValue ||
    process.env.PORTEDSIM_API_KEY || ""

  const bundlePath = (provider?.configJson as any)?.endpoints?.bundle || "/data/bundle"
  const url = `${apiBase}${bundlePath}`

  if (!apiBase || !apiKey) {
    return { ok: false, code: "MISSING_CONFIG", message: "Missing provider base URL or API key" }
  }

  if (!req.params?.phone || !req.params?.network || !req.params?.planCode) {
    return { ok: false, code: "BAD_INPUT", message: "Missing phone, network, or planCode" }
  }

  try {
    const payload = {
      phone: req.params.phone,
      network: req.params.network,
      planCode: req.params.planCode,
      amount: req.amount,
      subServiceId: req.subServiceId,
    }

    const { res, data } = await fetchJsonWithRetry(url, {
      method: "POST",
      headers: buildAuthHeaders(apiKey),
      body: JSON.stringify(payload),
    }, { retries: 3, baseDelayMs: 400, timeoutMs: 10000 })

    if (!res.ok) {
      const message = data?.message || data?.error || `Provider error (${res.status})`
      const code = data?.code || "PROVIDER_ERROR"
      return { ok: false, code, message }
    }

    const providerReference = data?.reference || data?.providerRef || data?.transactionId

    if (!providerReference) {
      return { ok: false, code: "NO_REFERENCE", message: "Missing provider reference" }
    }

    return {
      ok: true,
      providerReference,
      message: data?.message || "Data bundle activated",
    }
  } catch (err) {
    return { ok: false, code: "NETWORK_ERROR", message: String(err) }
  }
}