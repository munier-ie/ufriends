export interface BVNModificationRequest {
  id: string
  userId: string
  modificationType: string
  currentBVN: string
  currentName: string
  currentDOB?: string
  currentPhone?: string
  currentEmail?: string
  currentAddress?: string
  newName?: string
  newDOB?: string
  newPhone?: string
  newEmail?: string
  newAddress?: string
  verificationType: "NIN" | "Voter's Card" | "Driver's License" | "International Passport"
  nin?: string
  idFile?: string
  comment?: string
  status: "Pending" | "Approved" | "Rejected"
  rejectionReason?: string
  submittedAt: string
  processedAt?: string
}

const STORAGE_KEY = "ufriends_bvn_modification_requests"

export class BVNModificationStorage {
  static getAllRequests(): BVNModificationRequest[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  static getUserRequests(userId: string): BVNModificationRequest[] {
    return this.getAllRequests().filter((req) => req.userId === userId)
  }

  static addRequest(request: Omit<BVNModificationRequest, "id" | "status" | "submittedAt">): BVNModificationRequest {
    const newRequest: BVNModificationRequest = {
      ...request,
      id: crypto.randomUUID(),
      status: "Pending",
      submittedAt: new Date().toISOString(),
    }
    const requests = this.getAllRequests()
    requests.push(newRequest)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
    return newRequest
  }

  static updateRequestStatus(
    id: string,
    status: "Approved" | "Rejected",
    rejectionReason?: string,
  ): BVNModificationRequest | null {
    const requests = this.getAllRequests()
    const index = requests.findIndex((req) => req.id === id)
    if (index === -1) return null

    requests[index].status = status
    requests[index].processedAt = new Date().toISOString()
    if (rejectionReason) {
      requests[index].rejectionReason = rejectionReason
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
    return requests[index]
  }

  static getRequestById(id: string): BVNModificationRequest | null {
    return this.getAllRequests().find((req) => req.id === id) || null
  }
}
