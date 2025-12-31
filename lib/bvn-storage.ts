export interface BVNRequest {
  id: string
  userId: string
  agentLocation: string
  bvn: string
  kegowAccountNo: string
  accountName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  stateOfResidence: string
  address: string
  dob: string
  lga: string
  city: string
  addressState: string
  status: "Pending" | "Approved" | "Rejected"
  submittedAt: string
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
}

export interface AuditLog {
  action: string
  admin: string
  target: string
  timestamp: string
}

const STORAGE_KEYS = {
  REQUESTS: "ufriends_bvn_android_requests",
  APP_LINK: "ufriends_android_app_link",
  AUDIT_LOGS: "ufriends_admin_audit_logs",
}

export const BVNStorage = {
  // Requests
  getRequests(): BVNRequest[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS)
    return data ? JSON.parse(data) : []
  },

  saveRequests(requests: BVNRequest[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests))
  },

  addRequest(request: Omit<BVNRequest, "id" | "status" | "submittedAt">): BVNRequest {
    const requests = this.getRequests()
    const newRequest: BVNRequest = {
      ...request,
      id: crypto.randomUUID(),
      status: "Pending",
      submittedAt: new Date().toISOString(),
    }
    requests.push(newRequest)
    this.saveRequests(requests)
    return newRequest
  },

  updateRequest(id: string, updates: Partial<BVNRequest>): void {
    const requests = this.getRequests()
    const index = requests.findIndex((r) => r.id === id)
    if (index !== -1) {
      requests[index] = { ...requests[index], ...updates }
      this.saveRequests(requests)
    }
  },

  getUserRequests(userId: string): BVNRequest[] {
    return this.getRequests().filter((r) => r.userId === userId)
  },

  // App Link
  getAppLink(): string {
    if (typeof window === "undefined") return ""
    return localStorage.getItem(STORAGE_KEYS.APP_LINK) || ""
  },

  saveAppLink(link: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.APP_LINK, link)
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)
    return data ? JSON.parse(data) : []
  },

  addAuditLog(log: AuditLog): void {
    if (typeof window === "undefined") return
    const logs = this.getAuditLogs()
    logs.push(log)
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs))
  },
}
