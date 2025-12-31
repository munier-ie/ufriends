export type BillsParams = {
  meterNumber: string
  serviceProvider: string
  customerName?: string
  customerAddress?: string
}

export type BillsRequest = {
  amount: number
  params: BillsParams
  providerId: string
  subServiceId?: string
}

export type BillsResponse = {
  ok: boolean
  providerReference?: string
  code?: string
  message?: string
  token?: string
  units?: string
}

// Mock provider adapter to simulate bills/electricity payment
export async function payBill(req: BillsRequest): Promise<BillsResponse> {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 200))

  // Basic validation
  if (!req.params?.meterNumber || !req.params?.serviceProvider) {
    return { ok: false, code: "BAD_INPUT", message: "Missing meter number or service provider" }
  }

  // Validate service provider
  const validProviders = ["EKEDC", "IKEDC", "AEDC", "PHEDC", "KEDCO", "JEDC", "BEDC", "YEDC"]
  if (!validProviders.includes(req.params.serviceProvider.toUpperCase())) {
    return { ok: false, code: "INVALID_PROVIDER", message: "Unsupported electricity provider" }
  }

  // Validate meter number format (basic check)
  if (req.params.meterNumber.length < 10 || req.params.meterNumber.length > 13) {
    return { ok: false, code: "INVALID_METER", message: "Invalid meter number format" }
  }

  // Simulate occasional failures for testing
  if (Math.random() < 0.08) {
    return { ok: false, code: "PROVIDER_ERROR", message: "Electricity provider temporarily unavailable" }
  }

  // Simulate success with provider reference and token
  const providerReference = `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const token = Math.random().toString().slice(2, 22).padStart(20, '0')
  const units = (req.amount / 85).toFixed(2) // Mock units calculation at ₦85/kWh
  
  return { 
    ok: true, 
    providerReference,
    token,
    units: `${units} kWh`,
    message: `Electricity payment successful for ${req.params.serviceProvider} - ${req.params.meterNumber}` 
  }
}