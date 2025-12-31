"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
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
  ClipboardList,
  AlertCircle,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
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
  { label: "Wallet", icon: Wallet, href: "/dashboard/wallet" },
  { label: "My Requests", icon: ClipboardList, href: "/dashboard/requests" },
  { label: "Disputes", icon: AlertCircle, href: "/dashboard/disputes" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState("User")

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem("ufriends_user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserName(user.fullName || user.name || "User")
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("ufriends_user")
    router.push("/login")
  }

  return (
    <Sidebar
      className="bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white border-r border-white/5"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="border-b border-white/5 bg-transparent p-4">
        <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 bg-blue-500 rounded-xl blur opacity-20 animate-pulse"></div>
            <Image src="/ufriend-logo.png" alt="UFriends IT" width={40} height={40} className="relative rounded-xl shadow-lg" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="font-bold text-lg text-white tracking-wide truncate">
              UFriends IT
            </span>
            <span className="text-[10px] uppercase tracking-wider text-blue-300/70 truncate">
              Enterprise Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 gap-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const hasSubItems = item.subItems?.length > 0
                const isActive = item.href && pathname === item.href
                const hasActiveChild = hasSubItems && item.subItems.some((sub) => pathname.startsWith(sub.href))

                if (item.href && !hasSubItems) {
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        isActive={isActive}
                        className={`
                            h-10 transition-all duration-200 rounded-lg group
                            ${isActive
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                          }
                        `}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <Icon className={`h-[18px] w-[18px] ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                if (hasSubItems) {
                  return (
                    <Collapsible key={item.label} defaultOpen={hasActiveChild} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.label}
                            className={`
                                h-10 transition-all duration-200 rounded-lg group w-full justify-between
                                ${hasActiveChild
                                ? "bg-white/5 text-blue-100"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`h-[18px] w-[18px] ${hasActiveChild ? "text-blue-400" : "text-slate-400 group-hover:text-blue-400"}`} />
                              <span className="font-medium text-sm">{item.label}</span>
                            </div>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 text-slate-500 group-data-[state=open]/collapsible:rotate-180 group-data-[state=open]/collapsible:text-white" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="border-l border-white/10 ml-5 pl-1 my-1 space-y-1">
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname.startsWith(subItem.href)
                              return (
                                <SidebarMenuSubItem key={subItem.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubActive}
                                    className={`
                                        h-9 rounded-md transition-all duration-200
                                        ${isSubActive
                                        ? "text-blue-400 bg-blue-400/10 font-medium"
                                        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                                      }
                                    `}
                                  >
                                    <Link href={subItem.href}>
                                      <span className="text-sm">{subItem.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 bg-black/20 backdrop-blur-lg p-4 space-y-4">
        {mounted && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5 group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium text-slate-400">
              {theme === "light" ? "Light Mode" : "Dark Mode"}
            </span>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={() => setTheme(theme === "light" ? "dark" : "light")}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-white/5 data-[state=open]:text-white hover:bg-white/5 hover:text-white text-slate-300 transition-colors"
                >
                  <Avatar className="h-9 w-9 border-2 border-white/10">
                    <AvatarImage src="/user-avatar.png" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold">UF</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-white">{userName}</span>
                    <span className="truncate text-xs text-slate-400">View Profile</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-slate-500" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56 bg-[#1e293b] border-white/10 text-slate-200" align="end" sideOffset={4}>
                <DropdownMenuItem asChild className="focus:bg-blue-600 focus:text-white cursor-pointer">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:bg-red-900/20 focus:text-red-300 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
