"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "./TopNavbar"
import { FloatingActionBar } from "./FloatingActionBar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardPopupMessage } from "@/components/dashboard-popup-message"
import { cn } from "@/lib/utils"
import { authFetch } from "@/lib/client-auth"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userName, setUserName] = useState("User")

  useEffect(() => {
    // Fetch user info from /api/me instead of localStorage
    authFetch("/api/me")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const name = data?.profile?.name || data?.user?.name || "User"
        setUserName(name)
      })
      .catch(() => {
        // ignore if unauthenticated; keep default name
      })
  }, [])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#F9F7F3] dark:bg-slate-900 text-gray-800 dark:text-gray-100">
        <AppSidebar />

        {/* Main Content Area - takes remaining space */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top Navbar */}
          <TopNavbar />

          {/* Scrollable Content */}
          <main className={cn("flex-1 overflow-y-auto p-6", "pt-24 md:pt-20", "pb-20 md:pb-6")}>{children}</main>

          {/* Floating Action Bar */}
          <FloatingActionBar />
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />

        <DashboardPopupMessage userName={userName} />
      </div>
    </SidebarProvider>
  )
}
