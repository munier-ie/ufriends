export interface ManualServiceRequest {
  id: string
  userId: string
  serviceType: string
  method?: string
  formData: Record<string, any>
  price: number
  status: "Pending" | "Processing" | "Completed" | "Rejected"
  submittedAt: string
  completedAt?: string
  proofUrl?: string
  notes?: string
}

const STORAGE_KEY = "ufriends_manual_services"

export function getManualServices(): ManualServiceRequest[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  return JSON.parse(stored)
}

export function addManualService(request: Omit<ManualServiceRequest, "id" | "submittedAt">): ManualServiceRequest {
  const newRequest: ManualServiceRequest = {
    ...request,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
  }

  const services = getManualServices()
  services.push(newRequest)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services))

  return newRequest
}

export function updateManualService(id: string, updates: Partial<ManualServiceRequest>): void {
  const services = getManualServices()
  const index = services.findIndex((s) => s.id === id)

  if (index !== -1) {
    services[index] = { ...services[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
  }
}

export function getUserManualServices(userId: string): ManualServiceRequest[] {
  return getManualServices().filter((s) => s.userId === userId)
}
