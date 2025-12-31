"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Smartphone, Plus, Eye, RefreshCw, Download, Info } from "lucide-react"
import { BVNStorage, type BVNRequest } from "@/lib/bvn-storage"
import { BVNRequestForm } from "@/components/bvn/bvn-request-form"
import { BVNRequestDetails } from "@/components/bvn/bvn-request-details"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import useDynamicPricing from "@/hooks/useDynamicPricing"

const MOCK_USER_ID = "u_001"

export default function AndroidLicensePage() {
  const [requests, setRequests] = useState<BVNRequest[]>([])
  const [androidAppLink, setAndroidAppLink] = useState("")
  const [appDescription, setAppDescription] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<BVNRequest | null>(null)
  const [resubmitData, setResubmitData] = useState<BVNRequest | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showWarning, setShowWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)

  const { price: dynPrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "bvn",
    "android-license",
    "enrollment",
  )
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    setShowWarning(true)
  }, [])

  const loadData = async () => {
    setRequests(BVNStorage.getUserRequests(MOCK_USER_ID))
    try {
      const res = await fetch("/api/admin/system-settings/bvn-android")
      if (res.ok) {
        const data = await res.json()
        setAndroidAppLink(data.link || "")
        setAppDescription(data.description || "")
      }
    } catch (err) {
      console.error("Failed to load settings:", err)
    }
  }

  const handleSubmit = (formData: any) => {
    setPendingPayload({
      ...formData,
      amount: Number(dynPrice || 0),
      category: "bvn",
      action: "android-license"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)
    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, toast, "Submission Failed")
        return
      }

      toast({
        title: "Success",
        description: "Request submitted successfully!",
      })
      setShowForm(false)
      setResubmitData(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Submission Error", description: err.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResubmit = (request: BVNRequest) => {
    setResubmitData(request)
    setSelectedRequest(null)
    setShowForm(true)
  }

  const getStatusBadge = (status: BVNRequest["status"]) => {
    const variants = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
    }
    return <Badge className={variants[status]}>{status}</Badge>
  }

  const filteredRequests = requests.filter((r) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return r.bvn.includes(search) || r.accountName.toLowerCase().includes(search) || r.kegowAccountNo.includes(search)
  })

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    rejected: requests.filter((r) => r.status === "Rejected").length,
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Toaster />

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-md bg-[#F9F7F3]">
          <div className="flex flex-col items-center text-center space-y-4 p-6">
            <div className="w-16 h-16 rounded-full border-2 border-[#3457D5] flex items-center justify-center bg-[#CCCCFF]/20">
              <Info className="h-8 w-8 text-[#3457D5]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Warning</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              By submitting a BVN Android License request, you confirm that you have obtained the necessary legal
              authority to process this personal data, and you assume full liability for unlawful access. The Company
              and its Data Protection Compliance Organization (DPCO) will cooperate fully with regulators in cases of
              misuse.
            </p>
            <Button
              onClick={() => setShowWarning(false)}
              className="bg-[#3457D5] hover:bg-[#3457D5]/90 text-white px-8"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">BVN Android License Enrollment</h1>
          <p className="text-muted-foreground mb-6">Submit and track your BVN enrollment requests</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-blue-50 border border-blue-200 mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2 mb-3">
                <Smartphone className="w-5 h-5" />
                Android BVN Enrollment App
              </h2>
              {androidAppLink ? (
                <>
                  <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                    {appDescription || "Download the official UFriends BVN Enrollment App for Android."}
                  </p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <a href={androidAppLink} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download App
                    </a>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">App download link will be available soon.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {requests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {showForm ? (
          <BVNRequestForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setResubmitData(null)
            }}
            initialData={resubmitData || undefined}
            submitService={submitService}
            isSubmitting={isSubmitting}
          />
        ) : selectedRequest ? (
          <BVNRequestDetails
            request={selectedRequest}
            onResubmit={handleResubmit}
            onClose={() => setSelectedRequest(null)}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Your Requests</CardTitle>
                  <div className="flex gap-2">
                    {requests.length > 0 && (
                      <Input
                        placeholder="Search by BVN, name, or account..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64"
                      />
                    )}
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-primary hover:bg-primary/90 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Smartphone className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {requests.length === 0 ? "No requests yet" : "No requests match your search"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {requests.length === 0
                        ? "You haven't submitted any BVN Android Enrollment requests yet."
                        : "Try adjusting your search terms."}
                    </p>
                    {requests.length === 0 && (
                      <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Submit New Request
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-sm text-muted-foreground">
                                    #{request.id.slice(0, 8)}
                                  </span>
                                  {getStatusBadge(request.status)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">BVN:</span>{" "}
                                    <span className="font-medium">{request.bvn}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Account:</span>{" "}
                                    <span className="font-medium">{request.kegowAccountNo}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">State:</span>{" "}
                                    <span className="font-medium">{request.stateOfResidence}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Submitted: {new Date(request.submittedAt).toLocaleDateString()} at{" "}
                                  {new Date(request.submittedAt).toLocaleTimeString()}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                                {request.status === "Rejected" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-primary bg-transparent"
                                    onClick={() => handleResubmit(request)}
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Resubmit
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isSubmitting}
      />
    </div>
  )
}
