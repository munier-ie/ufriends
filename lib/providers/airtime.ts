export type AirtimeParams = {
  phone: string
  network: string
}

export type AirtimeRequest = {
  amount: number
  params: AirtimeParams
  providerId: string
  subServiceId?: string
}

export type AirtimeResponse = {
  ok: boolean
  providerReference?: string
  code?: string
  message?: string
}

// Mock provider adapter to simulate airtime VTU dispatch
export async function sendAirtime(req: AirtimeRequest): Promise<AirtimeResponse> {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 100))

  // Basic validation
  if (!req.params?.phone || !req.params?.network) {
    return { ok: false, code: "BAD_INPUT", message: "Missing phone or network" }
  }

  // Simulate success with a provider reference
  const providerReference = `AIR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return { ok: true, providerReference, message: "Airtime delivered" }
}