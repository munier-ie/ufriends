"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

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

interface DisputeModalProps {
  dispute: Dispute
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (dispute: Dispute) => void
}

export function DisputeModal({ dispute, open, onOpenChange, onUpdate }: DisputeModalProps) {
  const [status, setStatus] = useState(dispute.status)
  const [assignedTo, setAssignedTo] = useState(dispute.assignedTo || "")
  const [notes, setNotes] = useState(dispute.notes || "")
  const { toast } = useToast()

  const handleSave = () => {
    const updatedDispute = { ...dispute, status, assignedTo, notes }
    onUpdate(updatedDispute)
    toast({
      title: "Dispute Updated",
      description: "Dispute has been updated successfully.",
    })
    onOpenChange(false)
  }

  const handleResolve = () => {
    const updatedDispute = { ...dispute, status: "resolved" as const, notes }
    onUpdate(updatedDispute)
    toast({
      title: "Dispute Resolved",
      description: "Dispute has been marked as resolved.",
    })
    onOpenChange(false)
  }

  const handleEscalate = () => {
    const updatedDispute = { ...dispute, status: "escalated" as const, notes }
    onUpdate(updatedDispute)
    toast({
      title: "Dispute Escalated",
      description: "Dispute has been escalated to senior management.",
      variant: "destructive",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispute Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>User Name</Label>
              <p className="mt-2 font-medium">{dispute.user}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="mt-2 font-medium">{dispute.userEmail}</p>
            </div>
            <div>
              <Label>Reference ID</Label>
              <p className="mt-2 font-mono text-sm">{dispute.refId}</p>
            </div>
            <div>
              <Label>Date & Time</Label>
              <p className="mt-2 font-medium">{dispute.date}</p>
            </div>
          </div>

          {/* Service Info */}
          <div>
            <Label>Service</Label>
            <p className="mt-2 font-medium">{dispute.service}</p>
          </div>

          {/* Issue Description */}
          <div>
            <Label>Issue Description</Label>
            <p className="mt-2 rounded-lg border bg-muted p-3">{dispute.issue}</p>
          </div>

          {/* Screenshot */}
          {dispute.screenshot && (
            <div>
              <Label>Screenshot</Label>
              <div className="mt-2 rounded-lg border p-4">
                <Image
                  src={dispute.screenshot || "/placeholder.svg"}
                  alt="Dispute screenshot"
                  width={300}
                  height={200}
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assign Staff */}
          <div>
            <Label>Assign Staff</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ahmed Musa">Ahmed Musa</SelectItem>
                <SelectItem value="Fatima Bello">Fatima Bello</SelectItem>
                <SelectItem value="Chidi Okafor">Chidi Okafor</SelectItem>
                <SelectItem value="Aisha Ibrahim">Aisha Ibrahim</SelectItem>
                <SelectItem value="Blessing Eze">Blessing Eze</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label>Admin Notes</Label>
            <Textarea
              placeholder="Add notes about this dispute..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleResolve} className="bg-green-600 hover:bg-green-700">
              Mark as Resolved
            </Button>
            <Button variant="destructive" onClick={handleEscalate}>
              Escalate
            </Button>
            <Button variant="secondary" onClick={handleSave}>
              Save Changes
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
