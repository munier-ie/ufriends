"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Eye } from "lucide-react"
import { UserDetailsModal } from "@/components/admin/user-details-modal"
import { Toaster } from "@/components/ui/toaster"
import { authFetch } from "@/lib/client-auth"

type User = {
  id: string
  name: string
  email: string
  phone: string
  role: "user" | "agent" | "admin"
  status: "active" | "suspended" | "pending"
  balance: number
  joinDate: string
  totalRequests: number
  totalSpent: number
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await authFetch("/api/admin/users", { method: "GET" })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.users && mounted) {
          setUsers(data.users)
        }
      } catch {}
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const summaryStats = useMemo(() => {
    const totalUsers = users.length
    const activeAgents = users.filter((u) => u.role === "agent").length
    const pendingVerifications = users.filter((u) => u.status === "pending").length
    return { totalUsers, activeAgents, pendingVerifications }
  }, [users])

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Admin</Badge>
      case "agent":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Agent</Badge>
      case "user":
        return <Badge variant="outline">User</Badge>
    }
  }

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspended</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
    }
  }

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleUserUpdate = (update: Partial<User> & { id: string }) => {
    setUsers((prev) => prev.map((u) => (u.id === update.id ? { ...u, ...update } as User : u)))
    setSelectedUser((prev) => (prev && prev.id === update.id ? { ...prev, ...update } as User : prev))
  }

  return (
    <div className="space-y-6">
      <Toaster />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agents & Users</h1>
        <p className="text-muted-foreground">Manage user accounts and agent assignments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Active Agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.activeAgents}</div>
            <p className="text-xs text-muted-foreground">Verified agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Pending Verifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summaryStats.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>
            {loading ? "Loading users..." : `Showing ${filteredUsers.length} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">User</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Balance</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Requests</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Join Date</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="py-3 text-sm">{user.phone}</td>
                    <td className="py-3">{getRoleBadge(user.role)}</td>
                    <td className="py-3">{getStatusBadge(user.status)}</td>
                    <td className="py-3 text-right text-sm font-semibold">₦{user.balance.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm">{user.totalRequests}</td>
                    <td className="py-3 text-sm text-muted-foreground">{user.joinDate}</td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(user)}>
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

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </div>
  )
}
