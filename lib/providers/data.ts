export type DataParams = {
  phone: string
  network: string
  planCode: string
}

export type DataRequest = {
  amount: number
  params: DataParams
  providerId: string
  subServiceId?: string
}

export type DataResponse = {
  ok: boolean
  providerReference?: string
  code?: string
  message?: string
}

// Mock provider adapter to simulate data bundle dispatch
export async function sendDataBundle(req: DataRequest): Promise<DataResponse> {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 150))

  // Basic validation
  if (!req.params?.phone || !req.params?.network || !req.params?.planCode) {
    return { ok: false, code: "BAD_INPUT", message: "Missing phone, network, or planCode" }
  }

  // Validate network format
  const validNetworks = ["MTN", "GLO", "AIRTEL", "9MOBILE"]
  if (!validNetworks.includes(req.params.network.toUpperCase())) {
    return { ok: false, code: "INVALID_NETWORK", message: "Unsupported network" }
  }

  // Simulate occasional failures for testing
  if (Math.random() < 0.1) {
    return { ok: false, code: "PROVIDER_ERROR", message: "Temporary provider issue" }
  }

  // Simulate success with a provider reference
  const providerReference = `DATA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return { 
    ok: true, 
    providerReference, 
    message: `Data bundle activated for ${req.params.network} - ${req.params.planCode}` 
  }
}