"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck, AlertCircle } from "lucide-react"

interface KYCRequiredModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KYCRequiredModal({ open, onOpenChange }: KYCRequiredModalProps) {
  const router = useRouter()

  const handleStartKYC = () => {
    onOpenChange(false)
    router.push("/dashboard/kyc")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">KYC Verification Required</DialogTitle>
          <DialogDescription className="text-center">
            You need to complete your identity verification before accessing this service.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Why is KYC required?</p>
              <p>
                Identity verification helps us ensure the security of your account and comply with regulatory
                requirements.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStartKYC} className="flex-1">
              Start KYC Verification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
