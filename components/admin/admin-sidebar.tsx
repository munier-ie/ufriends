"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Settings,
  DollarSign,
  Users,
  FileText,
  AlertCircle,
  Key,
  BarChart3,
  LogOut,
  Menu,
  X,
  Wrench,
  ShieldCheck,
  Smartphone,
  Code2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearTokens, authFetch } from "@/lib/client-auth"
import { signOut } from "next-auth/react"

const navigation = [
  { name: "Dashboard Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Service Management", href: "/admin/services", icon: Wrench },
  { name: "API Providers", href: "/admin/providers", icon: Key },
  { name: "API Integration Settings", href: "/admin/api-settings", icon: Key },
  { name: "Payments", href: "/admin/payments", icon: DollarSign },
  { name: "Agents / Users", href: "/admin/users", icon: Users },
  { name: "Manual Service Requests", href: "/admin/requests", icon: Activity },
  { name: "KYC Requests", href: "/admin/kyc-requests", icon: ShieldCheck },
  { name: "BVN Android Requests", href: "/admin/bvn/android-requests", icon: Smartphone },
  { name: "Pricing & Profit Manager", href: "/admin/pricing", icon: DollarSign },
  { name: "Service Activity Logs", href: "/admin/logs", icon: FileText },
  { name: "Dispute & Support Center", href: "/admin/disputes", icon: AlertCircle },
  { name: "NIN Templates", href: "/admin/nin/templates", icon: FileText },
  { name: "Reports & Analytics", href: "/admin/reports", icon: BarChart3 },
  { name: "UI Metrics", href: "/admin/ui-metrics", icon: Activity },
  { name: "Training Manager", href: "/admin/training-manager", icon: GraduationCap },
  { name: "POS Requests", href: "/admin/pos-requests", icon: Smartphone },
  { name: "Marketers", href: "/admin/marketers", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

const softwareDevNavigation = [
  { name: "All Requests", href: "/admin/software-development/all" },
  { name: "In Progress", href: "/admin/software-development/in-progress" },
  { name: "Completed", href: "/admin/software-development/completed" },
  { name: "Assigned Projects", href: "/admin/software-development/assigned" },
  { name: "Profit & Cost Overview", href: "/admin/software-development/finance" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isSoftwareDevOpen, setIsSoftwareDevOpen] = useState(pathname.startsWith("/admin/software-development"))
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" })
    } catch { }
    try {
      clearTokens()
    } catch { }
    try {
      localStorage.removeItem("ufriends_user")
    } catch { }
    try {
      await signOut({ redirect: false })
    } catch { }
    router.push("/login")
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-bold text-primary-foreground">U</span>
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">UFriends Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Software Development Section */}
            <div className="mt-6">
              <button
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-hover"
                onClick={() => setIsSoftwareDevOpen((prev) => !prev)}
              >
                <span className="flex items-center gap-3">
                  <Code2 className="h-4 w-4" />
                  Software Development
                </span>
                {isSoftwareDevOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {isSoftwareDevOpen && (
                <div className="mt-2 space-y-1 pl-8">
                  {softwareDevNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm",
                          isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-hover",
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="border-t border-sidebar-border p-4">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
