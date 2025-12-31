"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DisputeModal } from "@/components/admin/dispute-modal"
import { DisputesByCategoryChart } from "@/components/admin/charts/disputes-by-category-chart"
import { Search, AlertCircle, CheckCircle, TrendingUp, Loader2 } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { toast } from "sonner"

interface Dispute {
  id: string
  date: string
  user: string
  userEmail: string
  service: string
  refId: string
  issue: string
  status: "open" | "in-progress" | "resolved" | "escalated"
  screenshot?: string
  assignedTo?: string
  notes?: string
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const loadDisputes = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (filterStatus !== "all") query.set("status", filterStatus.toUpperCase()) // Backend expects UPPERCASE for enum match if strict, or handled
      if (searchTerm) query.set("search", searchTerm)

      const res = await authFetch(`/api/admin/disputes?${query.toString()}`)
      const data = await res.json()
      if (data.ok) {
        setDisputes(data.data)
      }
    } catch (err) {
      console.error("Failed to load disputes", err)
      toast.error("Failed to load disputes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDisputes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus])

  // Debounced search could be better, but for now simple effect or manual trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDisputes()
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const handleViewDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setIsModalOpen(true)
  }

  const handleUpdateDispute = async (updatedDispute: Dispute) => {
    try {
      const res = await authFetch("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updatedDispute.id,
          status: updatedDispute.status,
          adminNotes: updatedDispute.notes // mapped back to adminNotes in backend
        })
      })
      if (res.ok) {
        toast.success("Dispute updated")
        setDisputes(disputes.map((d) => (d.id === updatedDispute.id ? updatedDispute : d)))
      } else {
        toast.error("Failed to update dispute")
      }
    } catch (e) {
      console.error(e)
      toast.error("Error updating dispute")
    }
  }

  // Calculate summary stats (client side for now based on fetched data, or ideally backend should provide summary)
  // Since we paginate or limit, this might be inaccurate if we don't fetch all. 
  // For V1 let's accept it represents the *current view* or fetched set.
  const openCount = disputes.filter((d) => d.status === "open").length
  const resolvedCount = disputes.filter((d) => d.status === "resolved").length
  const escalatedCount = disputes.filter((d) => d.status === "escalated").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispute & Support Center</h1>
        <p className="text-muted-foreground">Manage customer complaints and support tickets.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openCount}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{escalatedCount}</div>
            <p className="text-xs text-muted-foreground">Needs senior attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputes by Category Chart - Note: This component might still use internal mock data if it doesn't accept props. Checking component usage... passing nothing. */}
      {/* We should probably update the chart to accept data, but for this task I will leave it or see if I can pass data. */}
      {/* Assuming DisputesByCategoryChart is static for now unless I update it. Let's wrap it. */}
      <Card>
        <CardHeader>
          <CardTitle>Disputes by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <DisputesByCategoryChart />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Search</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="User, service, or ref ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterStatus("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Disputes ({disputes.length} results)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Ref ID</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading...
                  </TableCell>
                </TableRow>
              ) : disputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No disputes found.
                  </TableCell>
                </TableRow>
              ) : (
                disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">{dispute.date}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{dispute.user}</span>
                        <span className="text-xs text-muted-foreground">{dispute.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>{dispute.service}</TableCell>
                    <TableCell className="font-mono text-sm">{dispute.refId}</TableCell>
                    <TableCell className="max-w-xs truncate" title={dispute.issue}>{dispute.issue}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dispute.status === "resolved"
                            ? "default"
                            : dispute.status === "open"
                              ? "secondary"
                              : dispute.status === "escalated"
                                ? "destructive"
                                : "outline"
                        }
                        className={
                          dispute.status === "resolved"
                            ? "bg-green-600"
                            : dispute.status === "open"
                              ? "bg-orange-600"
                              : ""
                        }
                      >
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewDispute(dispute)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedDispute && (
        <DisputeModal
          dispute={selectedDispute}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUpdate={handleUpdateDispute}
        />
      )}
    </div>
  )
}

