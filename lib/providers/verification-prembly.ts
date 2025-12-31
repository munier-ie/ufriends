import { type ProviderConfig } from "@/lib/provider-manager"
import { fetchJsonWithRetry, buildAuthHeaders } from "@/lib/http-client"

export interface NINVerificationRequest {
  nin: string
  phone?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
}

export interface NINVerificationResponse {
  ok: boolean
  code?: string
  message?: string
  data?: {
    nin: string
    firstName: string
    lastName: string
    middleName?: string
    dateOfBirth: string
    gender: string
    phone: string
    address: string
    photo?: string
    trackingId?: string
    issueDate?: string
    signature?: string
    stateOfOrigin?: string
    lga?: string
    maritalStatus?: string
    profession?: string
    religion?: string
    bloodGroup?: string
    height?: string
    nextOfKin?: string
    nextOfKinPhone?: string
    nextOfKinAddress?: string
  }
  reference?: string
  transactionId?: string
}

/**
 * Real NIN Verification adapter for Prembly API.
 * Uses provider configuration (base URL + API keys) or environment fallbacks.
 *
 * Expected provider config:
 * - apiBaseUrl: string (e.g., https://api.prembly.com)
 * - apiKeys: [{ keyName: "api_key" }, { keyName: "app_id" }]
 * - configJson may include { adapter: "prembly", endpoints: { nin: "/verification/nin/advanced" } }
 */
export async function verifyNINViaPrembly(
  req: NINVerificationRequest,
  provider?: ProviderConfig,
): Promise<NINVerificationResponse> {
  const apiBase = provider?.apiBaseUrl || process.env.PREMBLY_BASE_URL || "https://api.prembly.com"
  const apiKey = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "api_key")?.keyValue ||
    process.env.PREMBLY_API_KEY || ""
  const appId = (provider?.apiKeys || []).find((k) => k.keyName.toLowerCase() === "app_id")?.keyValue ||
    process.env.PREMBLY_APP_ID || ""

  // Primary endpoint from provider config or default (use advanced by default)
  const configuredPath = (provider?.configJson as any)?.endpoints?.nin || "/verification/nin/advanced"

  // Known fallbacks for Prembly API variations. We try these if we get a 404 from the primary.
  const candidatePaths = [
    configuredPath,
    "/verification/nin/advanced",
    "/verification/nin/printout",
    "/verification/nin",
    "/v1/verifications/identity/nin/advanced", // legacy variants we still try
    "/v1/verifications/identity/nin/printout",
    "/v1/verifications/identity/nin",
    "/v1/verifications/identities/nin/printout",
  ]

  if (!apiBase || !apiKey || !appId) {
    return { ok: false, code: "MISSING_CONFIG", message: "Missing provider base URL, API key, or app id" }
  }

  if (!req.nin || req.nin.length !== 11) {
    return { ok: false, code: "BAD_INPUT", message: "Invalid NIN format. NIN must be 11 digits" }
  }

  const payload = {
    nin: req.nin,
    phone: req.phone,
    firstName: req.firstName,
    lastName: req.lastName,
    dateOfBirth: req.dateOfBirth,
    gender: req.gender,
  }

  let lastError: NINVerificationResponse | null = null

  for (const path of candidatePaths) {
    const url = `${apiBase}${path}`
    try {
      const { res, data } = await fetchJsonWithRetry(url, {
        method: "POST",
        headers: buildAuthHeaders(apiKey, { Accept: "application/json", "app-id": appId }),
        body: JSON.stringify(payload),
      }, { retries: 2, baseDelayMs: 400, timeoutMs: 12000 })

      if (!res.ok) {
        const message = data?.message || data?.error || res.statusText || "Unknown error"
        const errResp: NINVerificationResponse = {
          ok: false,
          code: `HTTP_${res.status}`,
          message: `Prembly API error: ${res.status} ${message} (endpoint: ${path})`,
        }

        // For 404, try next candidate endpoint
        if (res.status === 404) {
          lastError = errResp
          continue
        }

        // For auth errors or other non-retryable statuses, return immediately
        return errResp
      }

      // Handle Prembly response format
      if (data?.status === "success" || data?.success === true || data?.status === true) {
        return {
          ok: true,
          data: {
            nin: data.data?.nin || req.nin,
            firstName: data.data?.firstName || data.data?.first_name || "",
            lastName: data.data?.lastName || data.data?.last_name || "",
            middleName: data.data?.middleName || data.data?.middle_name || "",
            dateOfBirth: data.data?.dateOfBirth || data.data?.date_of_birth || "",
            gender: data.data?.gender || "",
            phone: data.data?.phone || data.data?.phoneNumber || "",
            address: data.data?.address || "",
            photo: data.data?.photo || data.data?.image || "",
            trackingId: data.data?.trackingId || data.data?.tracking_id || "",
            issueDate: data.data?.issueDate || data.data?.issue_date || "",
            signature: data.data?.signature || "",
            stateOfOrigin: data.data?.stateOfOrigin || data.data?.state_of_origin || "",
            lga: data.data?.lga || "",
            maritalStatus: data.data?.maritalStatus || data.data?.marital_status || "",
            profession: data.data?.profession || "",
            religion: data.data?.religion || "",
            bloodGroup: data.data?.bloodGroup || data.data?.blood_group || "",
            height: data.data?.height || "",
            nextOfKin: data.data?.nextOfKin || data.data?.next_of_kin || "",
            nextOfKinPhone: data.data?.nextOfKinPhone || data.data?.next_of_kin_phone || "",
            nextOfKinAddress: data.data?.nextOfKinAddress || data.data?.next_of_kin_address || "",
          },
          reference: data.reference || data.transactionId,
          transactionId: data.transactionId || data.reference,
        }
      }

      // Non-successful payload
      return {
        ok: false,
        code: data?.code || "VERIFICATION_FAILED",
        message: data?.message || data?.error || "NIN verification failed",
      }
    } catch (error) {
      // Network error; move to next path if any
      lastError = { ok: false, code: "NETWORK_ERROR", message: `Network error on ${path}: ${String(error)}` }
      continue
    }
  }

  // If we exhausted all candidates, return the last error captured
  return lastError || { ok: false, code: "UNKNOWN_ERROR", message: "NIN verification failed for unknown reasons" }
}

/**
 * Mock NIN verification for local testing
 */
// Mock NIN verification removed; platform now enforces real provider integration