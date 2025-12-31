"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download, AlertCircle, CheckCircle } from "lucide-react"
import type { BVNRequest } from "@/lib/bvn-storage"

interface BVNRequestDetailsProps {
  request: BVNRequest
  onResubmit: (request: BVNRequest) => void
  onClose: () => void
}

export function BVNRequestDetails({ request, onResubmit, onClose }: BVNRequestDetailsProps) {
  const getStatusBadge = (status: BVNRequest["status"]) => {
    const variants = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
    }
    return <Badge className={variants[status]}>{status}</Badge>
  }

  const fields = [
    { label: "Reference ID", value: request.id },
    { label: "Agent Location", value: request.agentLocation },
    { label: "BVN", value: request.bvn },
    { label: "Kegow Account Number", value: request.kegowAccountNo },
    { label: "Account Name", value: request.accountName },
    { label: "First Name", value: request.firstName },
    { label: "Last Name", value: request.lastName },
    { label: "Email", value: request.email },
    { label: "Phone", value: request.phone },
    { label: "State of Residence", value: request.stateOfResidence },
    { label: "Address", value: request.address },
    { label: "Date of Birth", value: new Date(request.dob).toLocaleDateString() },
    { label: "LGA", value: request.lga },
    { label: "City", value: request.city },
    { label: "Address State", value: request.addressState },
    { label: "Submitted At", value: new Date(request.submittedAt).toLocaleString() },
  ]

  if (request.reviewedAt) {
    fields.push(
      { label: "Reviewed At", value: new Date(request.reviewedAt).toLocaleString() },
      { label: "Reviewed By", value: request.reviewedBy || "N/A" },
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Request Details</CardTitle>
            {getStatusBadge(request.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {request.status === "Rejected" && (
            <Alert className="border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Rejection Reason:</strong> {request.rejectionReason || "No reason provided"}
              </AlertDescription>
            </Alert>
          )}

          {request.status === "Approved" && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Request Approved!</strong> Your BVN Android License enrollment has been approved.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div
                key={field.label}
                className={field.label === "Address" || field.label === "Reference ID" ? "md:col-span-2" : ""}
              >
                <div className="text-sm text-muted-foreground">{field.label}</div>
                <div className="font-medium mt-1">{field.value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            {request.status === "Rejected" && (
              <Button onClick={() => onResubmit(request)} className="bg-primary hover:bg-primary/90">
                <RefreshCw className="w-4 h-4 mr-2" />
                Resubmit Request
              </Button>
            )}
            {request.status === "Approved" && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Approval Slip (PDF)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
