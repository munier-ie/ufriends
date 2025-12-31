"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, Copy, CheckCircle2, TrendingUp, TrendingDown, Plus, ArrowDownToLine } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { authFetch } from "@/lib/client-auth"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "credit" | "debit"
  status: "success" | "pending" | "failed"
}

export default function WalletPage() {
  const [walletBalance, setWalletBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("monnify")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")

  // Live transactions
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [monnifyVA, setMonnifyVA] = useState<{
    accountNumber: string
    bankName: string
    accountName?: string
    feesDisplay?: string
  } | null>(null)
  const [paymentpointVA, setPaymentpointVA] = useState<{
    accountNumber: string
    bankName: string
    accountName?: string
    feesDisplay?: string
  } | null>(null)

  useEffect(() => {
    // Simulate loading
    setTimeout(async () => {
      // Load real wallet balance from API instead of localStorage mock
      try {
        const balRes = await authFetch("/api/wallet/balance")
        if (balRes.ok) {
          const balData = await balRes.json()
          setWalletBalance(Number(balData?.balance ?? 0))
        } else {
          setWalletBalance(0)
        }
      } catch {
        setWalletBalance(0)
      }

      // Load both virtual account details
      try {
        const res = await authFetch("/api/wallet/virtual-account")
        const data = await res.json()
        if (res.ok) {
          if (data?.monnify?.accountNumber) {
            setMonnifyVA({
              accountNumber: data.monnify.accountNumber,
              bankName: data.monnify.bankName,
              accountName: accountName || "UFriends User",
              feesDisplay: data?.monnify?.feesDisplay || "Provider fees apply; BVN/NIN required.",
            })
          }
          if (data?.paymentpoint?.accountNumber) {
            setPaymentpointVA({
              accountNumber: data.paymentpoint.accountNumber,
              bankName: data.paymentpoint.bankName,
              accountName: accountName || "UFriends User",
              feesDisplay: data?.paymentpoint?.feesDisplay || "Provider fees apply; see docs.",
            })
          }
        }
      } catch {
        const bankDetails = localStorage.getItem("ufriends_virtual_bank")
        if (bankDetails) {
          const parsed = JSON.parse(bankDetails)
          setMonnifyVA(parsed)
        }
      }

      // Load transactions
      try {
        const txRes = await authFetch("/api/wallet/transactions?pageSize=50")
        const txData = await txRes.json()
        if (txRes.ok && Array.isArray(txData?.transactions)) {
          const mapped: Transaction[] = txData.transactions.map((t: any) => {
            const typeStr: string = String(t?.type || "")
            const isCredit = typeStr.endsWith("CREDIT") || typeStr.endsWith("REFUND")
            const statusLower = String(t?.status || "").toLowerCase()
            const meta = (t?.meta || {}) as any
            const serviceId = String(meta?.serviceId || "")
            const desc = isCredit
              ? typeStr.endsWith("REFUND")
                ? "Wallet Refund"
                : "Wallet Top-up"
              : serviceId
                ? `${serviceId[0].toUpperCase()}${serviceId.slice(1)} Purchase`
                : "Wallet Debit"
            return {
              id: String(t.id || t.reference),
              date: new Date(t.createdAt).toISOString().split("T")[0],
              description: desc,
              amount: Number(t.amount || 0),
              type: isCredit ? "credit" : "debit",
              status: (statusLower === "success" || statusLower === "failed" || statusLower === "pending")
                ? (statusLower as Transaction["status"]) 
                : "pending",
            }
          })
          setTransactions(mapped)
        }
      } catch {}

      setIsLoading(false)
    }, 1000)
  }, [])

  const handleCopyDetails = (provider: "monnify" | "paymentpoint") => {
    const va = provider === "monnify" ? monnifyVA : paymentpointVA
    if (!va) {
      toast.error("Virtual account not available yet")
      return
    }
    const details = `Account Name: ${va.accountName || "UFriends User"}\nAccount Number: ${va.accountNumber}\nBank: ${va.bankName}`
    navigator.clipboard.writeText(details)
    toast.success("Bank details copied to clipboard!")
  }

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

      if (paymentMethod === "bank-transfer" && data?.virtualAccount) {
        setMonnifyVA({
          accountName: monnifyVA?.accountName || "UFriends User",
          accountNumber: data.virtualAccount.accountNumber,
          bankName: data.virtualAccount.bankName,
          feesDisplay: monnifyVA?.feesDisplay || "Provider fees apply; BVN/NIN required.",
        })
      }

      setFundDialogOpen(false)
      setFundAmount("")
    } catch (err) {
      toast.error(String(err))
    }
  }

  const handleWithdraw = () => {
    const amount = Number.parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amount > walletBalance) {
      toast.error("Insufficient balance")
      return
    }

    if (!bankName || !accountNumber || !accountName) {
      toast.error("Please fill in all bank details")
      return
    }

    // Simulate withdrawal processing
    toast.success(`Processing withdrawal of ₦${amount.toLocaleString()}...`)

    setTimeout(() => {
      const newBalance = walletBalance - amount
      setWalletBalance(newBalance)
      localStorage.setItem("ufriends_wallet_balance", newBalance.toString())

      window.dispatchEvent(
        new CustomEvent("walletBalanceUpdate", {
          detail: { balance: newBalance },
        }),
      )

      // Add transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date: new Date().toISOString().split("T")[0],
        description: `Withdrawal to ${bankName}`,
        amount: amount,
        type: "debit",
        status: "success",
      }
      setTransactions([newTransaction, ...transactions])

      toast.success("Withdrawal successful!")
      setWithdrawDialogOpen(false)
      setWithdrawAmount("")
      setBankName("")
      setAccountNumber("")
      setAccountName("")
    }, 2000)
  }

  const filterTransactions = (type?: "credit" | "debit") => {
    if (!type) return transactions
    return transactions.filter((t) => t.type === type)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Wallet</h1>
        <p className="text-muted-foreground">Manage your wallet balance and transactions</p>
      </div>

      {/* Balance Card */}
      <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className="p-6 bg-gradient-to-r from-[#3457D5] to-[#CCCCFF] text-white border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Wallet Balance</h2>
          </div>
          <p className="text-4xl font-bold mt-2">₦{walletBalance.toLocaleString()}</p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-[#3457D5] hover:bg-white/90 gap-2">
                  <Plus className="h-4 w-4" />
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
                  
                  {/* Show Monnify reserved account details when bank transfer is selected */}
                  {paymentMethod === "bank-transfer" && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Transfer to this account:</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyDetails("monnify")}
                          className="h-8 px-3 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Details
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Account Name:</span>
                          <p className="font-medium">{(monnifyVA?.accountName) || "UFriends User"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Account Number:</span>
                          <p className="font-medium font-mono">{monnifyVA?.accountNumber || ""}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bank:</span>
                          <p className="font-medium">{monnifyVA?.bankName || "Moniepoint Microfinance Bank"}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Transfer the exact amount above and your wallet will be credited automatically.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleFundWallet} className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90">
                    Proceed to Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-white border-white hover:bg-white/10 gap-2 bg-transparent">
                  <ArrowDownToLine className="h-4 w-4" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Withdraw to Bank</DialogTitle>
                  <DialogDescription>Enter your bank details and withdrawal amount</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Amount (₦)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Available: ₦{walletBalance.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      placeholder="Enter bank name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      placeholder="Enter account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Account Name</Label>
                    <Input
                      id="account-name"
                      placeholder="Enter account name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdraw} className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90">
                    Confirm Withdrawal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </motion.div>

      {/* Virtual Bank Details: Monnify and PaymentPoint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#3457D5]">Virtual Account</CardTitle>
              <CardDescription>Fund via reserved account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {monnifyVA ? (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-semibold text-lg">{monnifyVA.accountNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Bank</p>
                    <p className="font-semibold">{monnifyVA.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fees</p>
                    <p className="font-semibold text-sm">{monnifyVA.feesDisplay || "Provider fees apply"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">BVN/NIN required to generate this account.</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not available yet</p>
              )}
              <Button
                variant="link"
                className="text-sm text-[#3457D5] p-0 h-auto gap-2"
                onClick={() => handleCopyDetails("monnify")}
              >
                <Copy className="h-4 w-4" />
                Copy Details
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#3457D5]">Virtual Account</CardTitle>
              <CardDescription>Alternative funding via reserved account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentpointVA ? (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-semibold text-lg">{paymentpointVA.accountNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Bank</p>
                    <p className="font-semibold">{paymentpointVA.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fees</p>
                    <p className="font-semibold text-sm">{paymentpointVA.feesDisplay || "Provider fees apply"}</p>
                  </div>
                  <a
                    href="https://paymentpoint.gitbook.io/paymentpoint.co"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600"
                  >
                    View PaymentPoint fees
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not available yet</p>
              )}
              <Button
                variant="link"
                className="text-sm text-[#3457D5] p-0 h-auto gap-2"
                onClick={() => handleCopyDetails("paymentpoint")}
              >
                <Copy className="h-4 w-4" />
                Copy Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Transactions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid grid-cols-3 bg-[#F9F7F3] dark:bg-slate-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="credit" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="debit" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Debits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View all your wallet transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterTransactions().map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Badge
                              variant={transaction.type === "credit" ? "default" : "secondary"}
                              className={cn(
                                transaction.type === "credit"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
                              )}
                            >
                              {transaction.type === "credit" ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {transaction.type === "credit" ? "+" : "-"}₦{transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.status === "success"
                                  ? "default"
                                  : transaction.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {transaction.status === "success" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit">
            <Card>
              <CardHeader>
                <CardTitle>Credit Transactions</CardTitle>
                <CardDescription>View all money received in your wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterTransactions("credit").map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            +₦{transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debit">
            <Card>
              <CardHeader>
                <CardTitle>Debit Transactions</CardTitle>
                <CardDescription>View all money spent from your wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterTransactions("debit").map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            -₦{transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
