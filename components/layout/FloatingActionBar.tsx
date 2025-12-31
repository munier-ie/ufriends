"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Wallet, MessageCircle, Phone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authFetch } from "@/lib/client-auth"

const FALLBACK_SUPPORT_PHONE = "2348012345678"
const FALLBACK_ADMIN_CONTACTS = [
  {
    id: 1,
    name: "Admin Support",
    role: "General Support",
    phone: "2348012345678",
    initials: "AS",
  },
  {
    id: 2,
    name: "Technical Team",
    role: "Technical Issues",
    phone: "2348087654321",
    initials: "TT",
  },
  {
    id: 3,
    name: "Finance Admin",
    role: "Payment & Wallet",
    phone: "2348098765432",
    initials: "FA",
  },
]

export function FloatingActionBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showFundWalletModal, setShowFundWalletModal] = useState(false)
  const [showAdminContactModal, setShowAdminContactModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("monnify")

  const [supportPhone, setSupportPhone] = useState(FALLBACK_SUPPORT_PHONE)
  const [adminContacts, setAdminContacts] = useState(FALLBACK_ADMIN_CONTACTS)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/system/contact-settings")
        if (res.ok) {
          const data = await res.json()
          if (data.supportPhone) setSupportPhone(data.supportPhone)
          if (data.adminContacts) setAdminContacts(data.adminContacts)
        }
      } catch (err) {
        console.error("Failed to fetch contact settings", err)
      }
    }
    fetchSettings()
  }, [])

  const actions = [
    {
      icon: Wallet,
      label: "Fund Wallet",
      color: "from-green-500 to-emerald-500",
      onClick: () => {
        setShowFundWalletModal(true)
        setIsOpen(false)
      },
    },
    {
      icon: MessageCircle,
      label: "Support Chat",
      color: "from-blue-500 to-cyan-500",
      onClick: () => {
        window.open(`https://wa.me/${supportPhone}?text=Hello%20UFriends%20Support`, "_blank")
        setIsOpen(false)
      },
    },
    {
      icon: Phone,
      label: "Contact Admin",
      color: "from-purple-500 to-pink-500",
      onClick: () => {
        setShowAdminContactModal(true)
        setIsOpen(false)
      },
    },
  ]

  const handleFundWallet = async () => {
    const amount = Number.parseFloat(fundAmount)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    try {
      toast.info(`Initiating payment of ₦${amount.toLocaleString()} via ${paymentMethod}...`)
      const providerKey = paymentMethod === "monnify" ? "bank-transfer" : paymentMethod
      const res = await authFetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, provider: providerKey }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Funding failed")
      }

      const paymentUrl = data?.paymentUrl || data?.payment?.paymentUrl || data?.payment?.checkoutUrl
      if (data?.provider === "Monnify" && paymentUrl) {
        toast.success("Redirecting to Monnify checkout...")
        window.location.href = paymentUrl
        return
      }

      const info = data?.instructions
        ? `${data.instructions}`
        : `Reference: ${data?.reference}. Complete payment to receive credits.`
      toast.success(`Funding initiated: ${info}`)

      if (data?.virtualAccount) {
        window.dispatchEvent(
          new CustomEvent("bankDetailsUpdate", {
            detail: { accountNumber: data.virtualAccount.accountNumber, bankName: data.virtualAccount.bankName },
          }) as any,
        )
      }

      setShowFundWalletModal(false)
      setFundAmount("")
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleContactAdmin = (admin: (typeof adminContacts)[0]) => {
    window.open(`https://wa.me/${admin.phone}`, "_blank")
    setShowAdminContactModal(false)
    toast.success(`Opening WhatsApp to contact ${admin.name}`)
  }

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 right-0 space-y-3"
            >
              {actions.map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-sm font-medium text-foreground bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      {action.label}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={action.onClick}
                      className={cn("p-4 rounded-full shadow-lg text-white", `bg-gradient-to-r ${action.color}`)}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            rotate: isOpen ? 45 : 0,
            boxShadow: isOpen ? "0 0 30px rgba(52, 87, 213, 0.6)" : "0 0 20px rgba(52, 87, 213, 0.4)",
          }}
          className={cn(
            "p-5 rounded-full shadow-2xl text-white relative",
            "bg-gradient-to-r from-[#3457D5] to-[#CCCCFF]",
            !isOpen && "animate-pulse",
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.button>
      </motion.div>

      {/* Fund Wallet Modal */}
      <Dialog open={showFundWalletModal} onOpenChange={setShowFundWalletModal}>
        <DialogContent className="backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Fund Wallet
            </DialogTitle>
            <DialogDescription>Enter the amount you want to add to your wallet</DialogDescription>
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
                min="100"
                step="100"
              />
            </div>
            <div className="flex gap-2">
              {[1000, 5000, 10000, 20000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setFundAmount(amount.toString())}
                  className="flex-1"
                >
                  ₦{amount.toLocaleString()}
                </Button>
              ))}
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
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowFundWalletModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleFundWallet} className="flex-1 bg-primary">
              Continue to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminContactModal} onOpenChange={setShowAdminContactModal}>
        <DialogContent className="backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Contact Admin
            </DialogTitle>
            <DialogDescription>Select an admin to contact via WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {adminContacts.map((admin) => (
              <Card
                key={admin.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-[#3457D5]"
                onClick={() => handleContactAdmin(admin)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[#3457D5] text-white">{admin.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{admin.name}</h4>
                    <p className="text-sm text-muted-foreground">{admin.role}</p>
                  </div>
                  <Phone className="h-5 w-5 text-[#3457D5]" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" onClick={() => setShowAdminContactModal(false)} className="w-full">
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
