"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Toaster } from "@/components/ui/toaster"
import { authFetch } from "@/lib/client-auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    const checkPin = async () => {
      try {
        const res = await authFetch("/api/me")
        if (res.ok) {
          const data = await res.json()
          if (!data.hasPin) {
            router.replace("/dashboard/settings?tab=pin")
            return
          }
        }
        setIsVerifying(false)
      } catch (err) {
        console.error("PIN verification failed", err)
        setIsVerifying(false)
      }
    }
    checkPin()
  }, [router, pathname])

  if (isVerifying) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Toaster />
      </DashboardLayout>
    )
  }

  return (
    <>
      <DashboardLayout>{children}</DashboardLayout>
      <Toaster />
    </>
  )
}
