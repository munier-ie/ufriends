"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Bell, Wallet, ChevronDown, Menu, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar"
import { authFetch } from "@/lib/client-auth"

interface TopNavbarProps {
  onMenuClick?: () => void
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const router = useRouter()
  const [walletBalance, setWalletBalance] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; createdAt: string; readAt: string | null }[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const { state, isMobile } = useSidebar()

  const loadNotifications = async () => {
    try {
      const res = await authFetch("/api/notifications?limit=10")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setNotificationCount(data.unreadCount || 0)
      }
    } catch { }
  }

  const markAllRead = async () => {
    try {
      await authFetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotificationCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
    } catch { }
  }

  useEffect(() => {
    // Hydrate balance from localStorage for instant display
    const balance = localStorage.getItem("ufriends_wallet_balance")
    if (balance) {
      const next = Number.parseFloat(balance)
      if (Number.isFinite(next)) setWalletBalance(next)
    }

    // Load wallet balance from API
    const loadWalletBalance = async () => {
      try {
        const res = await authFetch("/api/wallet/balance")
        if (res.ok) {
          const data = await res.json()
          const bal = Number(data?.balance ?? 0)
          if (Number.isFinite(bal)) setWalletBalance(bal)
        }
      } catch { }
    }
    loadWalletBalance()

    // Load notifications
    loadNotifications()

    // Fetch user profile
    authFetch("/api/me")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const name = data?.profile?.name || "User"
        const email = data?.user?.email || ""
        setUserName(name)
        setUserEmail(email)
        setUserRole(data?.user?.role || "")
      })
      .catch(() => { })

    // Listen for balance updates and storage changes
    const handleWalletUpdate = (e: CustomEvent) => {
      const next = Number((e as any)?.detail?.balance)
      if (Number.isFinite(next)) setWalletBalance(next)
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ufriends_wallet_balance" && e.newValue) {
        const next = Number.parseFloat(e.newValue)
        if (Number.isFinite(next)) setWalletBalance(next)
      }
    }
    window.addEventListener("walletBalanceUpdate" as any, handleWalletUpdate as any)
    window.addEventListener("storage", handleStorageChange)

    // Handle scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("walletBalanceUpdate" as any, handleWalletUpdate as any)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("ufriends_user")
    router.push("/login")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Search query:", searchQuery)
    // Implement search functionality
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed top-0 right-0 left-0 z-40 transition-all duration-300",
        !isMobile ? (state === "collapsed" ? "md:left-[80px]" : "md:left-[256px]") : "",
        "backdrop-blur-md bg-white/80 dark:bg-slate-900/80",
        isScrolled && "shadow-lg border-b border-primary/10",
      )}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* Left: Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden text-foreground hover:bg-primary/10"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop: Sidebar Toggle */}
        <div className="hidden md:block">
          <SidebarTrigger className="text-foreground hover:bg-primary/10" />
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search services, users, or transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border-primary/20 focus:border-primary"
            />
          </div>
        </form>

        {/* Right: Wallet, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Marketer Badge */}
          {userRole === "MARKETER" && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Marketer</Badge>
          )}
          {/* Wallet Summary */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/dashboard/wallet")}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer backdrop-blur-md bg-gradient-to-r from-[#3457D5]/10 to-[#CCCCFF]/10 border border-primary/20 hover:border-primary/40 transition-all"
          >
            <Wallet className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <p className="font-semibold text-primary">₦{walletBalance.toLocaleString()}</p>
            </div>
          </motion.div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-primary/10">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {notificationCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={markAllRead}>
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem key={n.id} className={cn("flex flex-col items-start gap-1 p-3", !n.readAt && "bg-primary/5")}>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(n.createdAt)}</p>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/notifications")} className="justify-center text-primary">View All Notifications</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-primary/10">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/user-avatar.png" />
                  <AvatarFallback className="bg-primary text-white">{(userName || "UF").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <p className="font-semibold">{userName || "UFriends User"}</p>
                  <p className="text-xs text-muted-foreground">{userEmail || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/wallet")}>
                <Wallet className="mr-2 h-4 w-4" />
                Wallet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border-primary/20"
            />
          </div>
        </form>
      </div>
    </motion.header>
  )
}
