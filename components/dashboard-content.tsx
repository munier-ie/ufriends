"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Suspense, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Smartphone,
  Wifi,
  Receipt,
  CreditCard,
  FileText,
  GraduationCap,
  ShieldCheck,
  Building2,
  BookOpen,
  Code,
  ArrowRight,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  Plus,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  StatCardSkeleton,
  ChartSkeleton,
  TransactionListSkeleton,
  ServiceCategorySkeleton,
} from "@/components/skeleton-loaders"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { authFetch } from "@/lib/client-auth"

type MonthlySpendPoint = { month: string; amount: number }
type CategorySpendPoint = { category: string; amount: number }

type RecentTx = { id: string; description: string; amount: number; date: string; status: string; icon: any }

const fallbackRecentTransactions: RecentTx[] = []

const serviceCategories = [
  {
    title: "Financial Services",
    services: [
      {
        icon: Smartphone,
        title: "Airtime",
        description: "VTU, Share 'n Sell, Airtime 2 Cash",
        color: "bg-blue-500",
        popular: true,
        subServices: ["VTU", "Share 'n Sell", "Airtime 2 Cash"],
        href: "/services/airtime",
      },
      {
        icon: Wifi,
        title: "Data",
        description: "SME, Corporate, Gift data bundles",
        color: "bg-green-500",
        popular: true,
        subServices: ["SME", "Corporate", "Gift"],
        href: "/services/data",
      },
      {
        icon: Receipt,
        title: "Bills",
        description: "Cable, Electricity bill payments",
        color: "bg-orange-500",
        popular: false,
        subServices: ["Cable", "Electricity"],
        href: "/services/bills",
      },
      {
        icon: Building2,
        title: "Bank",
        description: "Become Banks Agent",
        color: "bg-purple-500",
        popular: false,
        subServices: ["Become Banks Agent"],
        href: "/services/agency-banking",
      },
    ],
  },
  {
    title: "Verification Services",
    services: [
      {
        icon: CreditCard,
        title: "BVN Services",
        description: "Android License, BVN Modification, Retrieval, Risk Management",
        color: "bg-red-500",
        popular: false,
        subServices: [
          "Android License",
          "BVN Modification",
          "BVN Retrieval",
          "Central Risk Management",
          "BVN Print Out",
        ],
        href: "/services/bvn",
      },
      {
        icon: FileText,
        title: "NIN Services",
        description: "NIN Slip, Modification, Validation, IPE Clearance",
        color: "bg-indigo-500",
        popular: false,
        subServices: ["NIN Slip", "NIN Modification", "NIN Validation", "IPE Clearance", "NIN Printout"],
        href: "/services/nin",
      },
      {
        icon: Building2,
        title: "CAC",
        description: "Registration, Status Report, Certification Retrieval",
        color: "bg-teal-500",
        popular: false,
        subServices: ["Registration", "Retrieval Status Report", "Retrieval of Certification", "Post-in Cooperation"],
        href: "/services/cac",
      },
      {
        icon: ShieldCheck,
        title: "Verification",
        description: "Voters card, Driver License, Passport, Phone Number",
        color: "bg-pink-500",
        popular: false,
        subServices: [
          "Voters card",
          "Driver License",
          "International Passport",
          "NIN",
          "BVN",
          "PLATE Number",
          "TIN",
          "CAC",
          "Phone Number",
        ],
        href: "/services/verification",
      },
    ],
  },
  {
    title: "Education & Professional Services",
    services: [
      {
        icon: GraduationCap,
        title: "Education",
        description: "WAEC, NECO, NABTEB, NBAIS, JAMB services",
        color: "bg-yellow-500",
        popular: false,
        subServices: [
          "WAEC Pin/Scratch Card",
          "GCE Registration Pin",
          "NECO Pin/Scratch Card",
          "NABTEB Pin/Scratch Card",
          "NBIAS Pin/Scratch Card",
          "Profile code Retrieval",
          "Print Admission Letter",
          "Original Jamb Result",
          "OLevel Upload",
          "Check Admission Status",
          "Acceptance Of Admission",
        ],
        href: "/services/education",
      },
      {
        icon: FileText,
        title: "NYSC",
        description: "National Youth Service Corps services",
        color: "bg-emerald-500",
        popular: false,
        subServices: ["NYSC Services"],
        href: "/services/education/nysc",
      },
      {
        icon: Building2,
        title: "Agency Banking",
        description: "POS Request, Become UFriends Marketer",
        color: "bg-violet-500",
        popular: false,
        subServices: ["POS Request", "Become UFriends Marketer"],
        href: "/services/agency-banking",
      },
      {
        icon: BookOpen,
        title: "Training",
        description: "Free tutorials, Premium training, CAC & BVN tutoring",
        color: "bg-cyan-500",
        popular: false,
        subServices: [
          "How to signup and login",
          "Dashboard management",
          "Package service management",
          "CAC Registration Tutorial",
          "NIN Modification Tutorial",
          "BVN Modification Tutorial",
          "Agency Updates",
        ],
        href: "/services/training",
      },
      {
        icon: Code,
        title: "Software Development",
        description: "Custom software solutions and development services",
        color: "bg-slate-500",
        popular: false,
        subServices: ["Custom Software Development"],
        href: "/services/software-development",
      },
    ],
  },
]

import { ActiveRequests } from "@/components/active-requests"

export function DashboardContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [walletBalance, setWalletBalance] = useState(0)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("monnify")
  const [kycStatus, setKycStatus] = useState<{
    status: "Approved" | "Pending" | "Rejected" | null
    submittedAt?: string
    rejectionReason?: string
  }>({ status: null })
  const [monnifyVA, setMonnifyVA] = useState<any | null>(null)
  const [paymentpointVA, setPaymentpointVA] = useState<any | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTx[]>(fallbackRecentTransactions)
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpendPoint[]>([])
  const [categorySpending, setCategorySpending] = useState<CategorySpendPoint[]>([])

  const { data: session } = useSession()
  const [me, setMe] = useState<{ name?: string; email?: string; phone?: string; role?: string; isKycVerified?: boolean } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)


    const servicesTimer = setTimeout(() => {
      setServicesLoading(false)
    }, 2000)

    const loadKYCStatus = async () => {
      try {
        const res = await authFetch("/api/kyc/status")
        if (!res.ok) return
        const data = await res.json()
        if (data && data.status && data.status !== "NONE") {
          const map: Record<string, "Approved" | "Pending" | "Rejected"> = {
            APPROVED: "Approved",
            PENDING: "Pending",
            REJECTED: "Rejected",
          }
          setKycStatus({
            status: map[data.status] || undefined,
            submittedAt: data.submittedAt,
            rejectionReason: undefined,
          })
        }
      } catch (e) {
        // ignore
      }
    }

    // Replace local storage wallet balance/virtual account loaders with API calls
    const loadWalletBalance = async () => {
      try {
        const res = await authFetch("/api/wallet/balance")
        if (res.ok) {
          const data = await res.json()
          const bal = Number(data?.balance ?? 0)
          setWalletBalance(Number.isFinite(bal) ? bal : 0)
        }
      } catch (err) {
        console.error("Failed to load wallet balance", err)
        toast.error("Unable to fetch wallet balance")
      }
    }

    // Fetch virtual bank details from API (dual providers)
    const loadBankDetails = async () => {
      try {
        const res = await authFetch("/api/wallet/virtual-account")
        if (res.ok) {
          const data = await res.json()
          if (data?.monnify?.accountNumber && data?.monnify?.bankName) {
            setMonnifyVA({
              accountName: data?.monnify?.accountName || "UFriends User",
              accountNumber: data.monnify.accountNumber,
              bankName: data.monnify.bankName,
              feesDisplay: data?.monnify?.feesDisplay || "Provider fees apply; BVN/NIN required.",
            })
          }
          if (data?.paymentpoint?.accountNumber && data?.paymentpoint?.bankName) {
            setPaymentpointVA({
              accountName: data?.paymentpoint?.accountName || "UFriends User",
              accountNumber: data.paymentpoint.accountNumber,
              bankName: data.paymentpoint.bankName,
              feesDisplay: data?.paymentpoint?.feesDisplay || "Provider fees apply; see docs.",
            })
          }
        } else {
          const bankDetails = localStorage.getItem("ufriends_virtual_bank")
          if (bankDetails) setMonnifyVA(JSON.parse(bankDetails))
        }
      } catch (err) {
        const bankDetails = localStorage.getItem("ufriends_virtual_bank")
        if (bankDetails) setMonnifyVA(JSON.parse(bankDetails))
        console.error("Failed to load virtual accounts", err)
        toast.error("Unable to fetch virtual account details")
      }
    }

    const loadRecentTransactions = async () => {
      try {
        const res = await authFetch("/api/wallet/transactions?pageSize=5")
        const data = await res.json()
        if (res.ok && Array.isArray(data?.transactions)) {
          const mapped: RecentTx[] = data.transactions.map((t: any) => {
            const typeStr: string = String(t?.type || "")
            const isCredit = typeStr.endsWith("CREDIT") || typeStr.endsWith("REFUND")
            const status = String(t?.status || "").toLowerCase()
            const meta = (t?.meta || {}) as any
            const serviceId = String(meta?.serviceId || "")
            const action = String(meta?.action || "")
            const desc = isCredit
              ? typeStr.endsWith("REFUND")
                ? "Wallet Refund"
                : "Wallet Top-up"
              : serviceId
                ? `${serviceId[0].toUpperCase()}${serviceId.slice(1)}${action ? ` - ${action}` : ""}`
                : "Wallet Debit"
            let icon = Receipt
            if (isCredit) icon = DollarSign
            else if (serviceId === "airtime") icon = Smartphone
            else if (serviceId === "data") icon = Wifi
            else if (serviceId === "bills") icon = Receipt
            else if (serviceId === "verification") icon = ShieldCheck
            return {
              id: String(t.id || t.reference),
              description: desc,
              amount: isCredit ? Number(t.amount || 0) : -Math.abs(Number(t.amount || 0)),
              date: new Date(t.createdAt).toISOString().split("T")[0],
              status: status === "success" ? "completed" : status,
              icon,
            }
          })
          setRecentTransactions(mapped)
        }
      } catch (e) {
        // silent fallback
      }
    }

    const loadSpendMetrics = async () => {
      try {
        const res = await authFetch(`/api/wallet/spend-metrics?months=6`)
        const json = await res.json()
        if (res.ok) {
          setMonthlySpending(Array.isArray(json?.monthly) ? json.monthly : [])
          setCategorySpending(Array.isArray(json?.byCategory) ? json.byCategory : [])
        } else {
          throw new Error(json?.error || "Failed to load charts")
        }
      } catch (e) {
        toast.error("Could not load spending charts")
      } finally {
        setChartsLoading(false)
      }
    }

    // Call loaders on mount
    loadKYCStatus()
    loadWalletBalance()
    loadBankDetails()
    loadRecentTransactions()
    loadSpendMetrics()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ufriends_wallet_balance" && e.newValue) {
        setWalletBalance(Number.parseFloat(e.newValue))
      }
      if (e.key === "ufriends_virtual_bank" && e.newValue) {
        setMonnifyVA(JSON.parse(e.newValue))
      }
    }

    const handleWalletUpdate = (e: CustomEvent) => {
      setWalletBalance(e.detail.balance)
    }

    const handleBankDetailsUpdate = (e: CustomEvent) => {
      const detail: any = (e as any).detail || {}
      if (detail.bankDetails) {
        setMonnifyVA(detail.bankDetails)
      } else {
        setMonnifyVA((prev: any) => ({
          ...(prev || {}),
          accountNumber: detail.accountNumber ?? prev?.accountNumber,
          bankName: detail.bankName ?? prev?.bankName,
        }))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("walletBalanceUpdate" as any, handleWalletUpdate)
    window.addEventListener("bankDetailsUpdate" as any, handleBankDetailsUpdate)

    return () => {
      clearTimeout(timer)
      clearTimeout(servicesTimer)
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("walletBalanceUpdate" as any, handleWalletUpdate)
      window.removeEventListener("bankDetailsUpdate" as any, handleBankDetailsUpdate)
    }
  }, [])

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await authFetch("/api/me")
        if (res.ok) {
          const data = await res.json()
          setMe({
            name: data.profile?.name || data.user?.profile?.name,
            email: data.user?.email,
            phone: data.profile?.phone || data.user?.profile?.phone,
            role: data.user?.role,
            isKycVerified: data.user?.isKycVerified,
          })
        }
      } catch (e) {
        // ignore
      }
    }
    loadMe()
  }, [])

  const handleFundWallet = async () => {
    const amount = Number.parseFloat(fundAmount)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    try {
      toast.info(`Initiating payment of ₦${amount.toLocaleString()} via ${paymentMethod}...`)
      const res = await authFetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, provider: paymentMethod }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Funding failed")
      }

      if (data?.provider === "Monnify" && data?.paymentUrl) {
        toast.success("Redirecting to Monnify checkout...")
        window.location.href = data.paymentUrl
        return
      }

      const info = data?.instructions
        ? `${data.instructions}`
        : `Reference: ${data?.reference}. Complete payment to receive credits.`
      toast.success(`Funding initiated: ${info}`)

      if (data?.virtualAccount) {
        setMonnifyVA({
          accountName: monnifyVA?.accountName || "UFriends User",
          accountNumber: data.virtualAccount.accountNumber,
          bankName: data.virtualAccount.bankName,
        })
        window.dispatchEvent(
          new CustomEvent("bankDetailsUpdate", {
            detail: { accountNumber: data.virtualAccount.accountNumber, bankName: data.virtualAccount.bankName },
          }) as any,
        )
      }

      setFundDialogOpen(false)
      setFundAmount("")
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleResubmitKYC = () => {
    router.push("/dashboard/kyc")
  }

  const handleCopyBankDetails = (provider: "monnify" | "paymentpoint") => {
    const va = provider === "monnify" ? monnifyVA : paymentpointVA
    if (!va) {
      toast.error("Virtual account not available yet")
      return
    }
    const details = `Account Name: ${va.accountName || "UFriends User"}\nAccount Number: ${va.accountNumber}\nBank: ${va.bankName}`
    navigator.clipboard.writeText(details)
    toast.success("Bank details copied to clipboard!")
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">Welcome back{me?.name ? `, ${me.name}!` : "!"}</h1>
          {me?.role === "MARKETER" && (
            <Badge className="bg-[#3457D5] text-white hover:bg-[#3457D5]/90">
              Marketer
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-2">Here's what's happening with your UFriends account today.</p>
      </div>

      <ActiveRequests />

      {/* KYC Alert Banner */}
      {!me?.isKycVerified && kycStatus.status !== "Pending" && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">KYC Verification Required</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <span>
              {kycStatus.status === "Rejected"
                ? `Your KYC was rejected: ${kycStatus.rejectionReason || "Please check your details"}. Please resubmit to access all services.`
                : "Complete your identity verification to access NIN, BVN, CAC, and POS services."}
            </span>
            <Button size="sm" onClick={() => router.push("/dashboard/kyc")} className="whitespace-nowrap">
              {kycStatus.status === "Rejected" ? "Resubmit KYC" : "Start Verification"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {kycStatus.status === "Pending" && !me?.isKycVerified && (
        <Alert className="border-primary/20 bg-primary/5 text-primary">
          <Clock className="h-4 w-4 text-primary" />
          <AlertTitle className="font-bold">KYC Verification In Progress</AlertTitle>
          <AlertDescription>
            Your identity verification is being reviewed by our team. You'll have full access once approved.
          </AlertDescription>
        </Alert>
      )}

      {/* User Info Header */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back{me?.name ? `, ${me.name}` : ""}</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{me?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{me?.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{me?.phone || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet and Bank Details Cards in Same Line on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowBalance(!showBalance)} className="h-8 w-8">
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-4">
              {showBalance ? `₦${walletBalance.toLocaleString()}` : "₦••••••"}
            </div>
            <div className="flex gap-2">
              <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Fund Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Fund Wallet</DialogTitle>
                    <DialogDescription>Choose your preferred payment method and enter the amount</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₦)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monnify">Monnify</SelectItem>
                          <SelectItem value="paymentpoint">PaymentPoint</SelectItem>
                          <SelectItem value="bank-transfer">Manual Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleFundWallet} className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90">
                      Proceed to Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Virtual Account
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleCopyBankDetails("monnify")}>
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              {monnifyVA ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account Number:</span>
                    <span className="text-sm font-medium">{monnifyVA.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bank:</span>
                    <span className="text-sm font-medium">{monnifyVA.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fees:</span>
                    <span className="text-sm font-medium">{monnifyVA.feesDisplay || "Provider fees apply"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">BVN/NIN required to generate this account.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Not available yet</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Virtual Account
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => handleCopyBankDetails("paymentpoint")}>
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              {paymentpointVA ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account Number:</span>
                    <span className="text-sm font-medium">{paymentpointVA.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bank:</span>
                    <span className="text-sm font-medium">{paymentpointVA.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fees:</span>
                    <span className="text-sm font-medium">{paymentpointVA.feesDisplay || "Provider fees apply"}</span>
                  </div>
                  <a href="https://paymentpoint.gitbook.io/paymentpoint.co" target="_blank" rel="noreferrer" className="text-xs text-blue-600">View PaymentPoint fees</a>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Not available yet</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KYC Verification Section */}
      {kycStatus.status && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">KYC Verification</CardTitle>
                  <CardDescription>Identity verification status</CardDescription>
                </div>
              </div>
              {kycStatus.status === "Approved" && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {kycStatus.status === "Pending" && (
                <Badge className="bg-yellow-500 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
              {kycStatus.status === "Rejected" && (
                <Badge className="bg-red-500 text-white">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {kycStatus.status === "Approved" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Your identity has been verified</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Verified on {new Date(kycStatus.submittedAt || "").toLocaleDateString()}
                </p>
              </div>
            )}

            {kycStatus.status === "Pending" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-5 w-5" />
                  <p className="font-medium">Your verification is being reviewed</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Submitted on {new Date(kycStatus.submittedAt || "").toLocaleDateString()}. This typically takes 24-48
                  hours.
                </p>
              </div>
            )}

            {kycStatus.status === "Rejected" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">Your verification was rejected</p>
                </div>
                {kycStatus.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Reason:</strong> {kycStatus.rejectionReason}
                    </p>
                  </div>
                )}
                <Button onClick={handleResubmitKYC} variant="outline" className="w-full sm:w-auto bg-transparent">
                  Resubmit KYC Verification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">+12 from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Out of 12 available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₦2,340</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {chartsLoading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              {/* Monthly Spending Trend */}
              <Card>
                <CardHeader className="pl-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Monthly Spending Trend
                  </CardTitle>
                  <CardDescription>Your spending pattern over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded" />}>
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Amount (₦)",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[200px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlySpending}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-primary)" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </Suspense>
                </CardContent>
              </Card>

              {/* Category Spending */}
              <Card>
                <CardHeader className="pl-2">
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>Breakdown of your expenses by service type</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <Suspense fallback={<div className="h-[200px] bg-muted animate-pulse rounded" />}>
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Amount (₦)",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[200px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categorySpending}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </Suspense>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Transactions */}
        {chartsLoading ? (
          <TransactionListSkeleton />
        ) : (
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Recent Transactions
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
              <CardDescription>Your latest account activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.map((transaction) => {
                const Icon = transaction.icon
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.amount > 0 ? "+" : ""}₦{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Cards */}
      <div className="space-y-8">
        {servicesLoading
          ? Array.from({ length: 3 }).map((_, i) => <ServiceCategorySkeleton key={i} />)
          : serviceCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-foreground">{category.title}</h2>
                {categoryIndex === 0 && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Used
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.services.map((service, serviceIndex) => {
                  const Icon = service.icon
                  const isRestricted = !me?.isKycVerified && !["Airtime", "Data", "Bills", "Education"].includes(service.title)

                  return (
                    <Card
                      key={serviceIndex}
                      className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20 ${isRestricted ? "opacity-75 relative overflow-hidden" : ""}`}
                      onClick={() => {
                        if (isRestricted) {
                          toast.error("KYC Required", {
                            description: "Please complete your identity verification to access this service."
                          })
                          return
                        }
                        router.push(service.href)
                      }}
                    >
                      {isRestricted && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-destructive/50 text-destructive">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            KYC Required
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-3 rounded-lg ${service.color} bg-opacity-10`}>
                            <Icon className={`h-6 w-6 text-${service.color.split("-")[1]}-600`} />
                          </div>
                          {service.popular && !isRestricted && (
                            <Badge variant="secondary" className="bg-primary text-primary-foreground">
                              <Zap className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {service.title}
                        </CardTitle>
                        <CardDescription className="text-sm">{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all bg-transparent"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(service.href)
                          }}
                        >
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Quick Actions Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Access your most frequently used services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2 bg-transparent"
              onClick={() => router.push("/services/airtime")}
            >
              <Smartphone className="h-5 w-5" />
              <span className="text-xs">Buy Airtime</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2 bg-transparent"
              onClick={() => router.push("/services/data")}
            >
              <Wifi className="h-5 w-5" />
              <span className="text-xs">Buy Data</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2 bg-transparent"
              onClick={() => router.push("/services/bills")}
            >
              <Receipt className="h-5 w-5" />
              <span className="text-xs">Pay Bills</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2 bg-transparent"
              onClick={() => router.push("/services/verification")}
            >
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs">Verify ID</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
