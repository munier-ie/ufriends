"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { authFetch } from "@/lib/client-auth"

export default function KYCPendingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [kycData, setKycData] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await authFetch("/api/kyc/status")
        if (!res.ok) throw new Error("Failed to load status")
        const data = await res.json()
        if (data && data.status !== "NONE") {
          setKycData({
            verificationType: data.type,
            idNumber: (data as any)?.documents?.find?.((d: any) => d.type === "ID")?.fileUrl || "",
            submittedAt: data.submittedAt,
            reviewedAt: data.reviewedAt || null,
            status: data.status,
            documents: Array.isArray(data.documents) ? data.documents : [],
          })
        } else {
          setKycData(null)
        }
      } catch {
        setKycData(null)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-4"
        >
          <Clock className="h-10 w-10 text-yellow-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-foreground mb-2">KYC Under Review</h1>
        <p className="text-muted-foreground">Your verification is being processed</p>
      </div>

      {/* Status Card */}
      <Card className="border-2 border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100">
              <ShieldCheck className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Verification Status</CardTitle>
              <CardDescription>Your KYC is under review</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-yellow-200">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Your KYC is under review. You'll be notified once verified.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This process typically takes 24-48 hours. We'll send you an email once your verification is
                    complete.
                  </p>
                </div>
              </div>

              {kycData && (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-muted-foreground">Submission Details</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${kycData.status === "APPROVED" ? "bg-green-100 text-green-700" : kycData.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {kycData.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verification Type:</span>
                    <span className="font-medium">{kycData.verificationType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium">{new Date(kycData.submittedAt).toLocaleString()}</span>
                  </div>
                  {kycData.reviewedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reviewed:</span>
                      <span className="font-medium">{new Date(kycData.reviewedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {Array.isArray(kycData.documents) && kycData.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Submitted Documents</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {kycData.documents.map((doc: any) => (
                          <div key={doc.id} className="flex items-center gap-3 p-2 border rounded">
                            <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                              <img src={doc.fileUrl} alt={`${doc.type} preview`} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{doc.type}</div>
                              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary">Open file</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* What's Next Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What happens next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Verification Review</p>
                <p className="text-sm text-muted-foreground">Our team will verify your submitted information</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Identity Confirmation</p>
                <p className="text-sm text-muted-foreground">We'll match your photo with your ID details</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Notification</p>
                <p className="text-sm text-muted-foreground">You'll receive an email and dashboard notification</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Access Granted</p>
                <p className="text-sm text-muted-foreground">Once approved, you can access all verification services</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Button */}
      <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
    </div>
  )
}
