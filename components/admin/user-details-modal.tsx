"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserCheck, UserX, DollarSign, KeyRound, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

type UserDetailsModalProps = {
  user: User
  isOpen: boolean
  onClose: () => void
  onUserUpdate?: (update: Partial<User> & { id: string }) => void
}

export function UserDetailsModal({ user, isOpen, onClose, onUserUpdate }: UserDetailsModalProps) {
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [balanceAdjustment, setBalanceAdjustment] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentBalance, setCurrentBalance] = useState<number>(user.balance)
  const { toast } = useToast()

  const handleSuspend = () => {
    authFetch(`/api/admin/users/${user.id}/actions?action=SUSPEND`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-action": "SUSPEND" },
      body: JSON.stringify({ action: "SUSPEND", note: adminNotes || undefined }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (!data?.ok) {
          toast({ title: "Suspend failed", description: data?.error || "Server error", variant: "destructive" })
          return
        }
        onUserUpdate?.({ id: user.id, status: "suspended" })
        toast({ title: "User suspended", description: `${user.name} has been suspended.` })
        onClose()
      })
      .catch((err) => toast({ title: "Network error", description: String(err), variant: "destructive" }))
  }

  const handleVerify = () => {
    authFetch(`/api/admin/users/${user.id}/actions?action=VERIFY`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-action": "VERIFY" },
      body: JSON.stringify({ action: "VERIFY", note: adminNotes || undefined }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (!data?.ok) {
          toast({ title: "Verify failed", description: data?.error || "Server error", variant: "destructive" })
          return
        }
        onUserUpdate?.({ id: user.id, status: "active" })
        toast({ title: "User verified", description: `${user.name} has been verified.` })
        onClose()
      })
      .catch((err) => toast({ title: "Network error", description: String(err), variant: "destructive" }))
  }

  const handleAdjustBalance = async () => {
    const amount = Number(balanceAdjustment)
    if (!Number.isFinite(amount) || balanceAdjustment.trim() === "") {
      toast({ title: "Invalid amount", description: "Enter a valid number (use negative for debit).", variant: "destructive" })
      return
    }

    try {
      const res = await authFetch("/api/admin/wallet/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount, reason: adminNotes || undefined }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: "Adjustment failed", description: data?.error || "Server error", variant: "destructive" })
        return
      }

      const newBalance = Number(data?.wallet?.balance ?? currentBalance + amount)
      setCurrentBalance(newBalance)
      onUserUpdate?.({ id: user.id, balance: newBalance })
      setBalanceAdjustment("")
      toast({ title: "Balance adjusted", description: `New balance: ₦${newBalance.toLocaleString()}` })
    } catch (err) {
      toast({ title: "Network error", description: String(err), variant: "destructive" })
    }
  }

  const handleUpdateRole = async () => {
    try {
      const res = await authFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        toast({ title: "Role update failed", description: data?.error || "Server error", variant: "destructive" })
        return
      }
      onUserUpdate?.({ id: user.id, role: selectedRole })
      toast({ title: "Role updated", description: `Role changed to ${selectedRole}.` })
      onClose()
    } catch (err) {
      toast({ title: "Network error", description: String(err), variant: "destructive" })
    }
  }

  const handleActivate = () => {
    authFetch(`/api/admin/users/${user.id}/actions?action=ACTIVATE`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-action": "ACTIVATE" },
      body: JSON.stringify({ action: "ACTIVATE", note: adminNotes || undefined }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (!data?.ok) {
          toast({ title: "Activate failed", description: data?.error || "Server error", variant: "destructive" })
          return
        }
        onUserUpdate?.({ id: user.id, status: "active" })
        toast({ title: "User activated", description: `${user.name} has been activated.` })
        onClose()
      })
      .catch((err) => toast({ title: "Network error", description: String(err), variant: "destructive" }))
  }

  const handleResetPassword = () => {
    console.log("[v0] Resetting password for:", user.id)
    alert(`Password reset link sent to ${user.email}`)
  }

  const handleResetPin = () => {
    console.log("[v0] Resetting PIN for:", user.id)
    alert(`PIN has been reset for ${user.name}`)
  }

  const handleDeleteUser = () => {
    console.log("[v0] Deleting user:", user.id)
    alert(`User ${user.name} has been deleted`)
    setShowDeleteDialog(false)
    onClose()
  }

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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View and manage user account</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="text-sm">{user.phone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">User ID</Label>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <div className="mt-1">{getRoleBadge(user.role)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(user.status)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Join Date</Label>
                <p className="text-sm">{user.joinDate}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Requests</Label>
                <p className="text-sm font-semibold">{user.totalRequests}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Balance</Label>
                <p className="text-lg font-bold text-primary">₦{currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Spent</Label>
                <p className="text-sm font-semibold">₦{user.totalSpent.toLocaleString()}</p>
              </div>
            </div>

            {/* Update Role */}
            <div className="space-y-2">
              <Label htmlFor="role-select">Update Role</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as "user" | "agent" | "admin")}
                >
                  <SelectTrigger id="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateRole}>Update</Button>
              </div>
            </div>

            {/* Adjust Balance */}
            <div className="space-y-2">
              <Label htmlFor="balance-adjustment">Adjust Balance</Label>
              <div className="flex gap-2">
                <Input
                  id="balance-adjustment"
                  type="number"
                  placeholder="Enter amount (+ or -)"
                  value={balanceAdjustment}
                  onChange={(e) => setBalanceAdjustment(e.target.value)}
                />
                <Button onClick={handleAdjustBalance} className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Adjust
                </Button>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add notes about this user..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Label>User Actions</Label>
              <div className="flex flex-wrap gap-2">
                {user.status === "suspended" && (
                  <Button onClick={handleActivate} className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Activate User
                  </Button>
                )}
                {user.status === "pending" && (
                  <Button onClick={handleVerify} className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Verify User
                  </Button>
                )}
                {user.status === "active" && (
                  <Button onClick={handleSuspend} variant="destructive" className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    Suspend User
                  </Button>
                )}
                <Button
                  onClick={handleResetPassword}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <KeyRound className="h-4 w-4" />
                  Reset Password
                </Button>
                <Button onClick={handleResetPin} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <KeyRound className="h-4 w-4" />
                  Reset Pin
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete User
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for <strong>{user.name}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
