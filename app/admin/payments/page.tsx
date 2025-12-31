"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CreditCard, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { PaymentDetailsModal } from "@/components/admin/payment-details-modal"

type Payment = {
  id: string
  user: string
  email: string
  amount: number
  method: string
  status: "completed" | "pending" | "failed"
  reference: string
  date: string
  service: string
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [summaryStats, setSummaryStats] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
  })
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (searchTerm) params.set("q", searchTerm)
        if (statusFilter !== "all") params.set("status", statusFilter)
        if (methodFilter !== "all") params.set("method", methodFilter)
        const res = await fetch(`/api/admin/payments?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load payments")
        setPayments(data.payments || [])
        setSummaryStats(data.summary || { totalPayments: 0, pendingPayments: 0, completedPayments: 0, failedPayments: 0 })
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message || String(e))
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
    return () => controller.abort()
  }, [searchTerm, statusFilter, methodFilter])

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter
    return matchesSearch && matchesStatus && matchesMethod
  })

  const getStatusBadge = (status: Payment["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
    }
  }

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">Track and manage all payment transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summaryStats.totalPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₦{summaryStats.pendingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{summaryStats.completedPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₦{summaryStats.failedPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Input
                placeholder="Search by user, email, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            {loading ? "Loading payments..." : `Showing ${filteredPayments.length} transactions`}
            {error ? ` • Error: ${error}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Reference</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">User</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Service</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Method</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="py-3 text-sm font-mono">{payment.reference}</td>
                    <td className="py-3">
                      <div className="text-sm font-medium">{payment.user}</div>
                      <div className="text-xs text-muted-foreground">{payment.email}</div>
                    </td>
                    <td className="py-3 text-sm">{payment.service}</td>
                    <td className="py-3 text-sm font-semibold">₦{payment.amount.toLocaleString()}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="flex w-fit items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {payment.method}
                      </Badge>
                    </td>
                    <td className="py-3">{getStatusBadge(payment.status)}</td>
                    <td className="py-3 text-sm text-muted-foreground">{payment.date}</td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(payment)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentDetailsModal payment={selectedPayment} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
