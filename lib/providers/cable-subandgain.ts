import { type ProviderConfig } from "@/lib/provider-manager"
import { fetchJsonWithRetry, buildAuthHeaders } from "@/lib/http-client"

export type CableRequest = {
    amount: number
    params: {
        smartcardNumber: string
        provider: string
        planId: string
        customerName?: string
    }
    providerId: string
    subServiceId?: string
}

export type CableResponse = {
    ok: boolean
    providerReference?: string
    code?: string
    message?: string
}

/**
 * Real Cable TV adapter for SubAndGain provider.
 */
export async function payCableViaSubAndGain(
    req: CableRequest,
    provider?: ProviderConfig,
): Promise<CableResponse> {
    const apiBase = provider?.apiBaseUrl || process.env.SUBANDGAIN_BASE_URL || "https://subandgain.com"
    const apiKey = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "apikey")?.keyValue ||
        process.env.SUBANDGAIN_API_KEY || ""

    const purchasePath = (provider?.configJson as any)?.endpoints?.cable || "/cable/purchase"
    const url = `${apiBase}${purchasePath}`

    if (!apiBase || !apiKey) {
        return { ok: false, code: "MISSING_CONFIG", message: "Missing provider base URL or API key" }
    }

    if (!req.params?.smartcardNumber || !req.params?.provider || !req.params?.planId) {
        return { ok: false, code: "BAD_INPUT", message: "Missing smartcard number, provider, or plan ID" }
    }

    try {
        const payload = {
            smartcardNumber: req.params.smartcardNumber,
            provider: req.params.provider,
            plan: req.params.planId,
            amount: req.amount,
            customerName: req.params.customerName,
        }

        const { res, data } = await fetchJsonWithRetry(url, {
            method: "POST",
            headers: buildAuthHeaders(apiKey),
            body: JSON.stringify(payload),
        }, { retries: 3, baseDelayMs: 400, timeoutMs: 10000 })

        if (!res.ok) {
            const errorCode = data?.error || "PROVIDER_ERROR";
            const message = data?.message || data?.error || `Provider error (${res.status})`;
            return { ok: false, code: errorCode || data?.code || "PROVIDER_ERROR", message };
        }

        const providerReference = data?.reference || data?.providerRef || data?.transactionId
        if (!providerReference) {
            return { ok: false, code: "NO_REFERENCE", message: "Missing provider reference" }
        }

        return {
            ok: true,
            providerReference,
            message: data?.message || "Cable subscription successful",
        }
    } catch (err) {
        return { ok: false, code: "NETWORK_ERROR", message: String(err) }
    }
}
