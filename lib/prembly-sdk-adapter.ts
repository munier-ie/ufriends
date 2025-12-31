import premblyHttpClient, { PremblyClient as HttpPremblyClient } from "./prembly"

// Optional SDK imports. We keep usage minimal and fallback to HTTP client when unsupported.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { PremblyDataVerification, PremblyGeneralVerification, PremblyDocumentVerification, PremblyGlobalBusinessVerification } from "prembly-pass"

// Shape normalization helper to keep the same response contract our routes expect
function ok<T>(data: T, detail = "OK") {
  return { status: true, detail, data }
}
function fail(message: string) {
  return { status: false, detail: message, error: message }
}

// Singleton SDK instances (created lazily)
let dataVerification: any | null = null
let generalVerification: any | null = null
let documentVerification: any | null = null
let globalBusinessVerification: any | null = null

function ensureSdkInstances() {
  const apiKey = process.env.PREMBLY_API_KEY || ""
  const appId = process.env.PREMBLY_APP_ID || ""
  if (!apiKey || !appId) return false
  try {
    if (!dataVerification) dataVerification = new PremblyDataVerification(apiKey, appId)
    if (!generalVerification) generalVerification = new PremblyGeneralVerification(apiKey, appId)
    if (!documentVerification) documentVerification = new PremblyDocumentVerification(apiKey, appId)
    if (!globalBusinessVerification) globalBusinessVerification = new PremblyGlobalBusinessVerification(apiKey, appId)
    return true
  } catch (e) {
    return false
  }
}

// Adapter exposing the same methods as our HTTP client. Unknowns fall back to HTTP client.
const sdkBackedClient: HttpPremblyClient & Record<string, any> = {
  // Delegate to original HTTP client's private fields through the instance we import
  ...(premblyHttpClient as any),

  // Plate Number via SDK (Data Verification)
  async verifyPlateNumber(params: { plateNumber: string }) {
    try {
      if (ensureSdkInstances()) {
        const res = await dataVerification.verifyPlateNumber(params.plateNumber)
        // Normalize into our standard response
        return ok(res)
      }
    } catch (e: any) {
      return fail(e?.message || String(e))
    }
    // Fallback to HTTP client
    return premblyHttpClient.verifyPlateNumber(params)
  },

  // Everything else falls back to the HTTP client for now
  async getBVNPrintout(params: any) { return premblyHttpClient.getBVNPrintout(params) },
  async getBVNByPhone(params: any) { return premblyHttpClient.getBVNByPhone(params) },
  async getBVNAdvanced(params: any) { return premblyHttpClient.getBVNAdvanced(params) },

  async getNINPrintout(params: any) { return premblyHttpClient.getNINPrintout(params) },
  async getNINSlip(params: any) { return premblyHttpClient.getNINSlip(params) },
  async getNINAdvanced(params: any) { return premblyHttpClient.getNINAdvanced(params) },

  async getCACInfo(params: any) { return premblyHttpClient.getCACInfo(params) },
  async getCACAdvanced(params: any) { return premblyHttpClient.getCACAdvanced(params) },
  async getCACStatusReport(params: any) { return premblyHttpClient.getCACStatusReport(params) },

  async verifyInternationalPassportV2(params: any) { return premblyHttpClient.verifyInternationalPassportV2(params) },
  async verifyTIN(params: any) { return premblyHttpClient.verifyTIN(params) },
  async verifyVotersCard(params: any) { return premblyHttpClient.verifyVotersCard(params) },
  async verifyPhoneAdvanced(params: any) { return premblyHttpClient.verifyPhoneAdvanced(params) },
}

export function getPrembly() {
  const useSdk = String(process.env.USE_PREMBLY_SDK || "").toLowerCase() === "true"
  return useSdk ? (sdkBackedClient as HttpPremblyClient) : premblyHttpClient
}

export default getPrembly