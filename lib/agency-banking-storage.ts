export interface POSRequest {
  id: string
  userId: string
  provider: "Opay" | "Moniepoint" | "FCMB" | "Nomba" | "Other"
  formData: {
    fullName: string
    phone: string
    email: string
    bvn?: string
    businessName: string
    businessAddress: string
    state: string
    lga: string
    posType: string
    [key: string]: any
  }
  documents: {
    validId?: string
    utilityBill?: string
    cacCertificate?: string
    passportPhoto?: string
  }
  status: "Pending" | "Approved" | "Rejected" | "Completed"
  evidenceUrl?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export interface Marketer {
  id: string
  userId: string
  fullName: string
  phone: string
  email: string
  state: string
  lga: string
  marketingType: string[]
  passportUrl: string
  validIdUrl: string
  referralCode?: string
  marketerId: string
  totalSales: number
  commission: number
  balance: number
  status: "Active" | "Suspended" | "Pending"
  createdAt: string
  updatedAt: string
}

export interface MarketerSale {
  id: string
  marketerId: string
  saleType: "POS" | "Airtime" | "Data" | "Verification" | "Other"
  amount: number
  commission: number
  description: string
  createdAt: string
}

const POS_REQUESTS_KEY = "ufriends_pos_requests"
const MARKETERS_KEY = "ufriends_marketers"
const MARKETER_SALES_KEY = "ufriends_marketer_sales"

// POS Request Functions
export function getPOSRequests(): POSRequest[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(POS_REQUESTS_KEY)
  return data ? JSON.parse(data) : []
}

export function savePOSRequest(request: Omit<POSRequest, "id" | "createdAt" | "updatedAt">): POSRequest {
  const requests = getPOSRequests()
  const newRequest: POSRequest = {
    ...request,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  requests.push(newRequest)
  localStorage.setItem(POS_REQUESTS_KEY, JSON.stringify(requests))
  return newRequest
}

export function updatePOSRequest(id: string, updates: Partial<POSRequest>): POSRequest | null {
  const requests = getPOSRequests()
  const index = requests.findIndex((r) => r.id === id)
  if (index === -1) return null

  requests[index] = {
    ...requests[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(POS_REQUESTS_KEY, JSON.stringify(requests))
  return requests[index]
}

export function deletePOSRequest(id: string): boolean {
  const requests = getPOSRequests()
  const filtered = requests.filter((r) => r.id !== id)
  if (filtered.length === requests.length) return false
  localStorage.setItem(POS_REQUESTS_KEY, JSON.stringify(filtered))
  return true
}

export function getPOSRequestsByUser(userId: string): POSRequest[] {
  return getPOSRequests().filter((r) => r.userId === userId)
}

// Marketer Functions
export function getMarketers(): Marketer[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(MARKETERS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveMarketer(marketer: Omit<Marketer, "id" | "marketerId" | "createdAt" | "updatedAt">): Marketer {
  const marketers = getMarketers()
  const marketerCount = marketers.length + 1
  const marketerId = `MKT-UFRIENDS-${String(marketerCount).padStart(5, "0")}`

  const newMarketer: Marketer = {
    ...marketer,
    id: crypto.randomUUID(),
    marketerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  marketers.push(newMarketer)
  localStorage.setItem(MARKETERS_KEY, JSON.stringify(marketers))
  return newMarketer
}

export function updateMarketer(id: string, updates: Partial<Marketer>): Marketer | null {
  const marketers = getMarketers()
  const index = marketers.findIndex((m) => m.id === id)
  if (index === -1) return null

  marketers[index] = {
    ...marketers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(MARKETERS_KEY, JSON.stringify(marketers))
  return marketers[index]
}

export function getMarketerByUserId(userId: string): Marketer | null {
  const marketers = getMarketers()
  return marketers.find((m) => m.userId === userId) || null
}

// Marketer Sales Functions
export function getMarketerSales(marketerId?: string): MarketerSale[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(MARKETER_SALES_KEY)
  const sales: MarketerSale[] = data ? JSON.parse(data) : []
  return marketerId ? sales.filter((s) => s.marketerId === marketerId) : sales
}

export function addMarketerSale(sale: Omit<MarketerSale, "id" | "createdAt">): MarketerSale {
  const sales = getMarketerSales()
  const newSale: MarketerSale = {
    ...sale,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  sales.push(newSale)
  localStorage.setItem(MARKETER_SALES_KEY, JSON.stringify(sales))

  // Update marketer balance and commission
  const marketer = getMarketers().find((m) => m.marketerId === sale.marketerId)
  if (marketer) {
    updateMarketer(marketer.id, {
      totalSales: marketer.totalSales + sale.amount,
      commission: marketer.commission + sale.commission,
      balance: marketer.balance + sale.commission,
    })
  }

  return newSale
}
