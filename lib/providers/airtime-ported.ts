import { type AirtimeRequest, type AirtimeResponse } from "@/lib/providers/airtime"
import { type ProviderConfig } from "@/lib/provider-manager"
import { fetchJsonWithRetry, buildAuthHeaders } from "@/lib/http-client"

/**
 * Real Airtime VTU adapter for PortedSIM-like providers.
 * Uses provider configuration (base URL + API keys) or environment fallbacks.
 *
 * Expected provider config:
 * - apiBaseUrl: string (e.g., https://api.portedsim.com)
 * - apiKeys: [{ keyName: "apiKey", keyValue: "..." }]
 * - configJson may include { adapter: "ported", endpoints: { vtu: "/airtime/vtu" } }
 */
export async function sendAirtimeViaPorted(
  req: AirtimeRequest,
  provider?: ProviderConfig,
): Promise<AirtimeResponse> {
  const apiBase = provider?.apiBaseUrl || process.env.PORTEDSIM_BASE_URL || ""
  const apiKey = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "apikey")?.keyValue ||
    process.env.PORTEDSIM_API_KEY || ""

  const vtuPath = (provider?.configJson as any)?.endpoints?.vtu || "/airtime/vtu"
  const url = `${apiBase}${vtuPath}`

  if (!apiBase || !apiKey) {
    return { ok: false, code: "MISSING_CONFIG", message: "Missing provider base URL or API key" }
  }

  if (!req.params?.phone || !req.params?.network) {
    return { ok: false, code: "BAD_INPUT", message: "Missing phone or network" }
  }

  try {
    const payload = {
      phone: req.params.phone,
      network: req.params.network,
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
      message: data?.message || "Airtime delivered",
    }
  } catch (err) {
    return { ok: false, code: "NETWORK_ERROR", message: String(err) }
  }
}