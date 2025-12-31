"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  LayoutDashboard,
  Smartphone,
  Wifi,
  Receipt,
  CreditCard,
  FileText,
  Building2,
  GraduationCap,
  ShieldCheck,
  Banknote,
  BookOpen,
  Code,
  Wallet,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ClipboardList,
  AlertCircle,
} from "lucide-react"

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Airtime",
    icon: Smartphone,
    subItems: [
      { label: "VTU", href: "/services/airtime/vtu" },
      { label: "Share 'n Sell", href: "/services/airtime/share-n-sell" },
      { label: "Airtime 2 Cash", href: "/services/airtime/airtime-2-cash" },
    ],
  },
  {
    label: "Data",
    icon: Wifi,
    subItems: [
      { label: "SME Data", href: "/services/data/sme" },
      { label: "Corporate Data", href: "/services/data/cooperate" },
      { label: "Gift Data", href: "/services/data/gift" },
    ],
  },
  {
    label: "Bills",
    icon: Receipt,
    subItems: [
      { label: "Cable TV", href: "/services/bills/cable" },
      { label: "Electricity", href: "/services/bills/electricity" },
    ],
  },
  {
    label: "BVN Services",
    icon: CreditCard,
    subItems: [
      { label: "Android License", href: "/services/bvn/android-license" },
      { label: "BVN Modification", href: "/services/bvn/modification" },
      { label: "BVN Retrieval", href: "/services/bvn/retrieval" },
      { label: "Central Risk Management", href: "/services/bvn/central-risk" },
      { label: "BVN Print Out", href: "/services/bvn/printout" },
    ],
  },
  {
    label: "NIN Services",
    icon: FileText,
    subItems: [
      { label: "NIN Slip", href: "/services/nin/slip" },
      { label: "NIN Modification", href: "/services/nin/modification" },
      { label: "NIN Validation", href: "/services/nin/validation" },
      { label: "IPE Clearance", href: "/services/nin/ipe-clearance" },
      { label: "NIN Printout", href: "/services/nin/printout" },
    ],
  },
  {
    label: "CAC",
    icon: Building2,
    subItems: [
      { label: "Registration", href: "/services/cac/registration" },
      { label: "JTB TIN Registration", href: "/services/cac/jtb-tin" },
      { label: "Retrieval Status Report", href: "/services/cac/status-report" },
      { label: "Retrieval of Certification", href: "/services/cac/certification" },
      { label: "Post-Incorporation", href: "/services/cac/post-incorporation" },
    ],
  },
  {
    label: "Education",
    icon: GraduationCap,
    subItems: [
      { label: "WAEC", href: "/services/education/waec" },
      { label: "NECO", href: "/services/education/neco" },
      { label: "NABTEB", href: "/services/education/nabteb" },
      { label: "NBAIS", href: "/services/education/nbais" },
      { label: "JAMB", href: "/services/education/jamb" },
      { label: "NYSC", href: "/services/education/nysc" },
    ],
  },
  {
    label: "Verification",
    icon: ShieldCheck,
    subItems: [
      { label: "Voters Card", href: "/services/verification/voters-card" },
      { label: "Driver License", href: "/services/verification/driver-license" },
      { label: "International Passport", href: "/services/verification/passport" },
      { label: "NIN", href: "/services/verification/nin" },
      { label: "BVN", href: "/services/verification/bvn" },
      { label: "Plate Number", href: "/services/verification/plate-number" },
      { label: "TIN", href: "/services/verification/tin" },
      { label: "CAC", href: "/services/verification/cac" },
      { label: "Phone Number", href: "/services/verification/phone" },
    ],
  },
  {
    label: "Agency Banking",
    icon: Banknote,
    subItems: [
      { label: "POS Request", href: "/services/agency-banking/pos-request" },
      { label: "Become UFriends Marketer", href: "/services/agency-banking/marketer" },
    ],
  },
  {
    label: "Training",
    icon: BookOpen,
    subItems: [
      { label: "Free User Training", href: "/services/training/free-user" },
      { label: "Premium User Training", href: "/services/training/premium-user" },
      { label: "CAC Registration Training", href: "/services/training/cac-registration" },
      { label: "NIN Modification Training", href: "/services/training/nin-modification" },
      { label: "BVN Modification Training", href: "/services/training/bvn-modification" },
      { label: "Agency Updates Training", href: "/services/training/agency-updates" },
    ],
  },
  {
    label: "Software Development",
    icon: Code,
    subItems: [
      { label: "Web Applications", href: "/services/software-development/web" },
      { label: "Mobile Applications", href: "/services/software-development/mobile" },
      { label: "Custom Solutions", href: "/services/software-development/custom" },
    ],
  },
  {
    label: "Wallet",
    icon: Wallet,
    href: "/dashboard/wallet",
  },
  {
    label: "My Requests",
    icon: ClipboardList,
    href: "/dashboard/requests",
  },
  {
    label: "Disputes",
    icon: AlertCircle,
    href: "/dashboard/disputes",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("ufriends_sidebar_collapsed")
    if (saved) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    setShowTopFade(scrollTop > 10)
    setShowBottomFade(scrollTop < scrollHeight - clientHeight - 10)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      handleScroll() // Initial check
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("ufriends_sidebar_collapsed", String(newState))
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))
  }

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem("ufriends_user")
    window.location.href = "/login"
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-screen bg-[#3457D5] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155] text-white">
      <div className="flex-shrink-0 p-4 sticky top-0 z-20 bg-[#3457D5] dark:bg-[#0f172a] border-b border-white/10">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Image src="/ufriend-logo.png" alt="UFriends IT" width={40} height={40} className="rounded-lg" />
            {!isCollapsed && <span className="font-bold text-lg text-white">UFriends IT</span>}
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="text-white hover:bg-white/10 hidden md:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="text-white hover:bg-white/10 md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative custom-scrollbar px-3" ref={scrollContainerRef}>
        <motion.div
          className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#3457D5] dark:from-[#0f172a] to-transparent pointer-events-none z-10"
          animate={{ opacity: showTopFade ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <nav className="pt-3 pb-6 space-y-1 relative z-0">
          {menuItems.map((item) => {
            const Icon = item.icon
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedItems.includes(item.label)
            const isActive = item.href ? pathname === item.href : false
            const hasActiveChild = hasSubItems && item.subItems.some((sub) => pathname.startsWith(sub.href))

            return (
              <div key={item.label}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-white text-[#3457D5] shadow-lg font-semibold"
                          : "text-white/90 hover:text-white hover:bg-white/15",
                      )}
                      onClick={onMobileClose}
                    >
                      <motion.div whileHover={{ scale: 1.1 }} className={isActive ? "text-[#3457D5]" : "text-[#CCCCFF]"}>
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  ) : (
                    <button
                      onClick={() => hasSubItems && toggleExpanded(item.label)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                        hasActiveChild
                          ? "bg-white text-[#3457D5] shadow-lg font-semibold"
                          : "text-white/90 hover:text-white hover:bg-white/15",
                      )}
                    >
                      <motion.div whileHover={{ scale: 1.1 }} className={hasActiveChild ? "text-[#3457D5]" : "text-[#CCCCFF]"}>
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                          {hasSubItems && (
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="h-4 w-4" />
                            </motion.div>
                          )}
                        </>
                      )}
                    </button>
                  )}
                </motion.div>

                {hasSubItems && !isCollapsed && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 mt-1 space-y-1 overflow-hidden"
                      >
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname.startsWith(subItem.href)
                          return (
                            <motion.div key={subItem.href} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                                  isSubActive
                                    ? "bg-white/20 text-white font-medium border-l-2 border-white"
                                    : "text-white/70 hover:text-white hover:bg-white/10",
                                )}
                                onClick={onMobileClose}
                              >
                                <ChevronRight className="h-3 w-3" />
                                {subItem.label}
                              </Link>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            )
          })}
        </nav>

        <motion.div
          className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#3457D5] dark:from-[#0f172a] to-transparent pointer-events-none z-10"
          animate={{ opacity: showBottomFade ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-shrink-0 p-3 sticky bottom-0 z-20 bg-[#3457D5] dark:bg-[#0f172a] border-t border-white/10 space-y-3">
        {mounted && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 dark:bg-slate-800/40"
          >
            <span className="text-sm text-white/80">{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
            <Switch checked={theme === "dark"} onCheckedChange={() => setTheme(theme === "light" ? "dark" : "light")} />
          </motion.div>
        )}

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
          onClick={onMobileClose}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src="/user-avatar.png" />
            <AvatarFallback className="bg-[#3457D5] text-white">UF</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">UFriends Admin</p>
              <p className="text-xs text-white/70">View Profile →</p>
            </div>
          )}
        </Link>

        {!isCollapsed && (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-white/80 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={cn(
          "hidden md:flex md:flex-col sticky top-0 h-screen flex-shrink-0 z-40",
          "bg-gradient-to-b from-[#3457D5] via-[#2a4bc2] to-[#1e3a8a]",
          "dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]",
          "border-r border-white/10 shadow-2xl",
        )}
      >
        <SidebarContent />
      </motion.aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn(
                "fixed left-0 top-0 h-screen w-64 z-50 md:hidden",
                "bg-gradient-to-b from-[#3457D5] via-[#2a4bc2] to-[#1e3a8a]",
                "dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]",
                "shadow-2xl",
              )}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
