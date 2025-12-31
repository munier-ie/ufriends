export interface AutomatedServiceRequest {
  id: string
  userId: string
  serviceType: string
  subType: string
  formData: Record<string, any>
  totalPrice: number
  status: "Completed" | "Processing" | "Failed"
  submittedAt: string
  referenceId?: string
}

const STORAGE_KEY = "ufriends_automated_services"

export function getAutomatedServices(): AutomatedServiceRequest[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  return JSON.parse(stored)
}

export function addAutomatedService(
  request: Omit<AutomatedServiceRequest, "id" | "submittedAt" | "referenceId">,
): AutomatedServiceRequest {
  const newRequest: AutomatedServiceRequest = {
    ...request,
    id: crypto.randomUUID(),
    referenceId: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
  }

  const services = getAutomatedServices()
  services.push(newRequest)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services))

  return newRequest
}

export function getUserAutomatedServices(userId: string): AutomatedServiceRequest[] {
  return getAutomatedServices().filter((s) => s.userId === userId)
}
