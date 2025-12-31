"use client"

import { useState, useEffect } from "react"

export function useKYCCheck() {
  const [kycStatus, setKycStatus] = useState<"Approved" | "Pending" | "Rejected" | null>(null)
  const [showKYCModal, setShowKYCModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkKYCStatus()
  }, [])

  const checkKYCStatus = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/kyc/status")
      if (!res.ok) throw new Error("Failed to fetch KYC status")
      const data = await res.json()

      if (data?.status && data.status !== "NONE") {
        const mapped = data.status === "APPROVED" ? "Approved" : data.status === "PENDING" ? "Pending" : data.status === "REJECTED" ? "Rejected" : null
        setKycStatus(mapped)
      } else {
        setKycStatus(null)
      }
    } catch (error) {
      console.error("[v0] Error checking KYC status:", error)
      setKycStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  const requireKYC = () => {
    if (kycStatus !== "Approved") {
      setShowKYCModal(true)
      return false
    }
    return true
  }

  return {
    kycStatus,
    isKYCApproved: kycStatus === "Approved",
    showKYCModal,
    setShowKYCModal,
    requireKYC,
    isLoading,
  }
}
