"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Upload, X, FileText } from "lucide-react"

interface ActivityLog {
  id: string
  date: string
  user: string
  userEmail: string
  category: string
  subService: string
  details: string
  status: "completed" | "pending" | "failed" | "processing"
  photo?: string
  refId: string
  type?: "Automated" | "Manual"
  evidence?: {
    url: string
    name: string
    uploadedAt: string
  }
  adminNotes?: string
}

interface ActivityLogModalProps {
  log: ActivityLog
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (log: ActivityLog) => void
}

export function ActivityLogModal({ log, open, onOpenChange, onUpdate }: ActivityLogModalProps) {
  const [status, setStatus] = useState(log.status)
  const [notes, setNotes] = useState(log.adminNotes || "")
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [evidencePreview, setEvidencePreview] = useState<string | null>(log.evidence?.url || null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or PDF file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setEvidenceFile(file)

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setEvidencePreview(previewUrl)
  }

  const handleRemoveEvidence = () => {
    if (evidencePreview && evidencePreview.startsWith("blob:")) {
      URL.revokeObjectURL(evidencePreview)
    }
    setEvidenceFile(null)
    setEvidencePreview(null)
  }

  const handleMarkCompleted = () => {
    // For manual services, require evidence
    if (log.type === "Manual" && !evidencePreview && !log.evidence) {
      toast({
        title: "Evidence Required",
        description: "Please upload evidence before marking as completed.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    // Simulate upload delay
    setTimeout(() => {
      const evidence = evidenceFile
        ? {
          url: evidencePreview!,
          name: evidenceFile.name,
          uploadedAt: new Date().toISOString(),
        }
        : log.evidence

      const updatedLog = {
        ...log,
        status: "completed" as const,
        evidence,
        adminNotes: notes,
      }

      onUpdate(updatedLog)
      setIsUploading(false)

      toast({
        title: "Service Marked as Completed",
        description: log.type === "Manual" ? "Evidence uploaded successfully." : "Service completed.",
      })

      onOpenChange(false)
    }, 1000)
  }

  const handleApprove = () => {
    const updatedLog = { ...log, status: "completed" as const, adminNotes: notes }
    onUpdate(updatedLog)
    toast({
      title: "Request Approved",
      description: `${log.subService} request has been approved.`,
    })
    onOpenChange(false)
  }

  const handleReject = () => {
    const updatedLog = { ...log, status: "failed" as const, adminNotes: notes }
    onUpdate(updatedLog)
    toast({
      title: "Request Rejected",
      description: `${log.subService} request has been rejected.`,
      variant: "destructive",
    })
    onOpenChange(false)
  }

  const handleRetry = () => {
    const updatedLog = { ...log, status: "processing" as const, adminNotes: notes }
    onUpdate(updatedLog)
    toast({
      title: "Retry Initiated",
      description: `Retrying ${log.subService} request...`,
    })
    onOpenChange(false)
  }

  const handleSave = () => {
    const updatedLog = { ...log, status, adminNotes: notes }
    onUpdate(updatedLog)
    toast({
      title: "Log Updated",
      description: "Activity log has been updated successfully.",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Log Details</DialogTitle>
          <DialogDescription>View and update details of a user service activity.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>User Name</Label>
              <p className="mt-2 font-medium">{log.user}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="mt-2 font-medium">{log.userEmail}</p>
            </div>
            <div>
              <Label>Reference ID</Label>
              <p className="mt-2 font-mono text-sm">{log.refId}</p>
            </div>
            <div>
              <Label>Date & Time</Label>
              <p className="mt-2 font-medium">{log.date}</p>
            </div>
          </div>

          {/* Service Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Category</Label>
              <p className="mt-2 font-medium">{log.category}</p>
            </div>
            <div>
              <Label>Sub-Service</Label>
              <p className="mt-2 font-medium">{log.subService}</p>
            </div>
          </div>

          {/* Details */}
          <div>
            <Label>Request Details</Label>
            <p className="mt-2 rounded-lg border bg-muted p-3 whitespace-pre-wrap font-mono text-sm">{log.details}</p>
          </div>

          {/* Uploaded Photo */}
          {log.photo && (
            <div>
              <Label>Uploaded Photo</Label>
              <div className="mt-2 rounded-lg border p-4">
                <Image
                  src={log.photo || "/placeholder.svg"}
                  alt="Uploaded document"
                  width={200}
                  height={200}
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          )}

          {log.type === "Manual" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <Label className="text-base font-semibold">Completion Evidence</Label>
              <p className="mt-1 text-sm text-muted-foreground">Upload proof of completion (image or PDF)</p>

              {!evidencePreview ? (
                <div className="mt-3">
                  <label
                    htmlFor="evidence-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-background p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <Upload className="h-10 w-10 text-primary/60" />
                    <p className="mt-2 text-sm font-medium">Click to upload evidence</p>
                    <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or PDF (max 5MB)</p>
                  </label>
                  <Input
                    id="evidence-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="mt-3 rounded-lg border bg-background p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {evidenceFile?.type.startsWith("image/") ? (
                        <Image
                          src={evidencePreview || "/placeholder.svg"}
                          alt="Evidence preview"
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{evidenceFile?.name || log.evidence?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {evidenceFile ? `${(evidenceFile.size / 1024).toFixed(2)} KB` : "Previously uploaded"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveEvidence}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div>
            <Label>Admin Notes</Label>
            <Textarea
              placeholder="Add notes about this request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {log.type === "Manual" ? (
              <Button onClick={handleMarkCompleted} className="bg-green-600 hover:bg-green-700" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Mark as Completed"}
              </Button>
            ) : (
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                Approve
              </Button>
            )}
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
            <Button variant="outline" onClick={handleRetry}>
              Retry
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
