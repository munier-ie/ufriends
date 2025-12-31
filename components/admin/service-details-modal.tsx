"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface SubService {
  id: string
  name: string
  type: "automated" | "manual"
  status: "up" | "down" | "manual"
  requests: number
  successRate?: number
  avgResponse?: string
}

interface ServiceDetailsModalProps {
  service: SubService
  open: boolean
  onOpenChange: (open: boolean) => void
  providerName?: string
  providerBaseUrl?: string | null
}

export function ServiceDetailsModal({ service, open, onOpenChange, providerName, providerBaseUrl }: ServiceDetailsModalProps) {
  const [status, setStatus] = useState(service.status)
  const [assignedAgent, setAssignedAgent] = useState("")
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Service Updated",
      description: `${service.name} has been updated successfully.`,
    })
    onOpenChange(false)
  }

  const handlePause = () => {
    toast({
      title: "Service Paused",
      description: `${service.name} has been paused.`,
      variant: "destructive",
    })
  }

  const handleRetry = () => {
    toast({
      title: "Retry Initiated",
      description: `Retrying ${service.name}...`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Service Type</Label>
              <div className="mt-2">
                <Badge variant={service.type === "automated" ? "default" : "secondary"}>
                  {service.type === "automated" ? "Automated" : "Manual"}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Current Status</Label>
              <div className="mt-2">
                {status === "up" && (
                  <Badge variant="default" className="bg-green-600">
                    Up
                  </Badge>
                )}
                {status === "down" && <Badge variant="destructive">Down</Badge>}
                {status === "manual" && <Badge variant="secondary">Manual</Badge>}
              </div>
            </div>

            <div>
              <Label>Total Requests</Label>
              <p className="mt-2 text-2xl font-bold">{service.requests}</p>
            </div>

            {service.successRate && (
              <div>
                <Label>Success Rate</Label>
                <p className="mt-2 text-2xl font-bold text-green-600">{service.successRate}%</p>
              </div>
            )}

            {service.avgResponse && (
              <div>
                <Label>Average Response Time</Label>
                <p className="mt-2 text-2xl font-bold">{service.avgResponse}</p>
              </div>
            )}
          </div>

          {/* Provider & API Endpoint (for automated services) */}
          {service.type === "automated" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Active Provider</Label>
                <Input value={providerName || "—"} readOnly className="mt-2" />
              </div>
              <div>
                <Label>API Base URL</Label>
                <Input value={providerBaseUrl || "—"} readOnly className="mt-2" />
              </div>
            </div>
          )}

          {/* Cost Information */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Cost Price</Label>
              <Input value="₦1,500" readOnly className="mt-2" />
            </div>
            <div>
              <Label>User Price</Label>
              <Input value="₦2,000" readOnly className="mt-2" />
            </div>
            <div>
              <Label>Profit</Label>
              <Input value="₦500" readOnly className="mt-2 text-green-600" />
            </div>
          </div>

          {/* Agent Assignment (for manual services) */}
          {service.type === "manual" && (
            <div>
              <Label>Assign Agent</Label>
              <Select value={assignedAgent} onValueChange={setAssignedAgent}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent1">Ahmed Musa</SelectItem>
                  <SelectItem value="agent2">Fatima Bello</SelectItem>
                  <SelectItem value="agent3">Chidi Okafor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <Label>Admin Notes</Label>
            <Textarea placeholder="Add notes about this service..." className="mt-2" />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>Save Changes</Button>
            {service.type === "automated" && (
              <>
                <Button variant="outline" onClick={handleRetry}>
                  Retry
                </Button>
                <Button variant="destructive" onClick={handlePause}>
                  Pause Service
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
