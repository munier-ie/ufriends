"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Upload, Info } from "lucide-react"
import Link from "next/link"
import { useKYCCheck } from "@/hooks/use-kyc-check"
import { KYCRequiredModal } from "@/components/kyc-required-modal"
import { BVNModificationStorage } from "@/lib/bvn-modification-storage"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"

const MODIFICATION_TYPES = [
  { value: "Name Correction", label: "Name Correction" },
  { value: "Date of Birth Correction", label: "Date of Birth Correction" },
  { value: "Phone Number Update", label: "Phone Number Update" },
  { value: "Address Update", label: "Address Update" },
  { value: "Gender Correction", label: "Gender Correction" },
  { value: "Email Correction", label: "Email Correction" },
  { value: "Others", label: "Others" },
]

const VERIFICATION_TYPES = ["NIN", "Voter's Card", "Driver's License", "International Passport"] as const

const MOCK_USER_ID = "u_001"

export default function BVNModificationPage() {
  const { showKYCModal, setShowKYCModal, requireKYC } = useKYCCheck()
  const { toast } = useToast()

  const [showWarning, setShowWarning] = useState(false)

  const [modificationType, setModificationType] = useState("")
  const [currentBVN, setCurrentBVN] = useState("")

  const [currentFirstName, setCurrentFirstName] = useState("")
  const [currentMiddleName, setCurrentMiddleName] = useState("")
  const [currentSurname, setCurrentSurname] = useState("")

  const [currentDOB, setCurrentDOB] = useState("")
  const [currentPhone, setCurrentPhone] = useState("")
  const [currentEmail, setCurrentEmail] = useState("")
  const [currentAddress, setCurrentAddress] = useState("")

  const [newFirstName, setNewFirstName] = useState("")
  const [newMiddleName, setNewMiddleName] = useState("")
  const [newSurname, setNewSurname] = useState("")

  const [newDOB, setNewDOB] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newAddress, setNewAddress] = useState("")

  const [verificationType, setVerificationType] = useState<(typeof VERIFICATION_TYPES)[number]>("NIN")
  const [nin, setNin] = useState("")
  const [idFile, setIdFile] = useState<File | null>(null)
  const [comment, setComment] = useState("")

  const [consentChecked, setConsentChecked] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)

  const [requests, setRequests] = useState(BVNModificationStorage.getUserRequests(MOCK_USER_ID))

  const normalizedModificationType = useMemo(() => {
    const s = String(modificationType || "").toLowerCase()
    return s.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown"
  }, [modificationType])

  const { price: servicePrice, isLoading: priceLoading, error: priceError, submitService } = useDynamicPricing(
    "bvn",
    "modification",
    "basic",
    { modificationType: normalizedModificationType, verificationType },
  )

  useEffect(() => {
    setShowWarning(true)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!requireKYC()) {
      return
    }

    if (!consentChecked || !termsAccepted) {
      toast({
        title: "Error",
        description: "Please accept consent and terms to continue",
        variant: "destructive",
      })
      return
    }

    const currentName = `${currentFirstName} ${currentMiddleName} ${currentSurname}`.trim()
    const newName = `${newFirstName} ${newMiddleName} ${newSurname}`.trim()

    setPendingPayload({
      amount: Number(servicePrice || 0),
      modificationType,
      currentBVN,
      currentName,
      currentDOB: currentDOB || undefined,
      currentPhone: currentPhone || undefined,
      currentEmail: currentEmail || undefined,
      currentAddress: currentAddress || undefined,
      newName: newName || undefined,
      newDOB: newDOB || undefined,
      newPhone: newPhone || undefined,
      newEmail: newEmail || undefined,
      newAddress: newAddress || undefined,
      verificationType,
      nin: verificationType === "NIN" ? nin : undefined,
      idFileName: idFile?.name,
      comment: comment || undefined,
      category: "bvn",
      action: "modification",
      idempotencyKey: crypto.randomUUID(),
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
        description: "BVN Modification Request submitted successfully!",
      })

      setModificationType("")
      setCurrentBVN("")
      setCurrentFirstName("")
      setCurrentMiddleName("")
      setCurrentSurname("")
      setCurrentDOB("")
      setCurrentPhone("")
      setCurrentEmail("")
      setCurrentAddress("")
      setNewFirstName("")
      setNewMiddleName("")
      setNewSurname("")
      setNewDOB("")
      setNewPhone("")
      setNewEmail("")
      setNewAddress("")
      setNin("")
      setIdFile(null)
      setComment("")
      setConsentChecked(false)
      setTermsAccepted(false)
    } catch (err: any) {
      toast({ title: "Submission Error", description: err.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] || ""}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-4 md:p-8">
      <Toaster />

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 p-6">
            <div className="w-16 h-16 rounded-full border-2 border-[#3457D5] bg-[#CCCCFF]/20 flex items-center justify-center">
              <Info className="h-8 w-8 text-[#3457D5]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Warning</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              By submitting a BVN modification request, you confirm that you have obtained the necessary legal authority
              to process this personal data, and you assume full liability for unlawful access. The Company and its Data
              Protection Compliance Organization (DPCO) will cooperate fully with regulators in cases of misuse.
            </p>
            <Button
              onClick={() => setShowWarning(false)}
              className="bg-[#3457D5] hover:bg-[#3457D5]/90 text-white px-8"
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-[#CCCCFF]/30">
          <CardContent className="p-6 md:p-8">
            <h1 className="text-xl font-semibold mb-2 text-gray-900">BVN Modification Request</h1>
            <p className="text-sm text-gray-600 mb-8">
              Submit a request to correct or update your BVN information securely.
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Modification Type</Label>
                <Select value={modificationType} onValueChange={setModificationType}>
                  <SelectTrigger className="w-full border-[#CCCCFF] focus:border-[#3457D5]">
                    <SelectValue placeholder="Select modification type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODIFICATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold">Current Details</Label>
                <Input
                  type="text"
                  placeholder="Current BVN (11 digits)"
                  maxLength={11}
                  value={currentBVN}
                  onChange={(e) => setCurrentBVN(e.target.value.replace(/\D/g, ""))}
                  className="border-[#CCCCFF] focus:border-[#3457D5]"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={currentFirstName}
                    onChange={(e) => setCurrentFirstName(e.target.value)}
                    className="border-[#CCCCFF] focus:border-[#3457D5]"
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Middle Name"
                    value={currentMiddleName}
                    onChange={(e) => setCurrentMiddleName(e.target.value)}
                    className="border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                  <Input
                    type="text"
                    placeholder="Surname/Last Name"
                    value={currentSurname}
                    onChange={(e) => setCurrentSurname(e.target.value)}
                    className="border-[#CCCCFF] focus:border-[#3457D5]"
                    required
                  />
                </div>

                {modificationType.includes("Date of Birth") && (
                  <Input
                    type="date"
                    placeholder="Current Date of Birth"
                    value={currentDOB}
                    onChange={(e) => setCurrentDOB(e.target.value)}
                    className="border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                )}
                {modificationType.includes("Phone") && (
                  <Input
                    type="tel"
                    placeholder="Current Phone Number"
                    maxLength={11}
                    value={currentPhone}
                    onChange={(e) => setCurrentPhone(e.target.value.replace(/\D/g, ""))}
                    className="border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                )}
                {modificationType.includes("Email") && (
                  <Input
                    type="email"
                    placeholder="Current Email"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                    className="border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                )}
                {modificationType.includes("Address") && (
                  <Input
                    type="text"
                    placeholder="Current Address"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    className="border-[#CCCCFF] focus:border-[#3457D5]"
                  />
                )}
              </div>

              {modificationType && (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">New Details</Label>
                  {modificationType.includes("Name") && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        type="text"
                        placeholder="New First Name"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        className="border-[#CCCCFF] focus:border-[#3457D5]"
                      />
                      <Input
                        type="text"
                        placeholder="New Middle Name"
                        value={newMiddleName}
                        onChange={(e) => setNewMiddleName(e.target.value)}
                        className="border-[#CCCCFF] focus:border-[#3457D5]"
                      />
                      <Input
                        type="text"
                        placeholder="New Surname/Last Name"
                        value={newSurname}
                        onChange={(e) => setNewSurname(e.target.value)}
                        className="border-[#CCCCFF] focus:border-[#3457D5]"
                      />
                    </div>
                  )}
                  {modificationType.includes("Date of Birth") && (
                    <Input
                      type="date"
                      placeholder="New Date of Birth"
                      value={newDOB}
                      onChange={(e) => setNewDOB(e.target.value)}
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  )}
                  {modificationType.includes("Phone") && (
                    <Input
                      type="tel"
                      placeholder="New Phone Number"
                      maxLength={11}
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  )}
                  {modificationType.includes("Email") && (
                    <Input
                      type="email"
                      placeholder="New Email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  )}
                  {modificationType.includes("Address") && (
                    <Input
                      type="text"
                      placeholder="New Address"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="border-[#CCCCFF] focus:border-[#3457D5]"
                    />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Verification Type</Label>
                <Select
                  value={verificationType}
                  onValueChange={(value) => setVerificationType(value as (typeof VERIFICATION_TYPES)[number])}
                >
                  <SelectTrigger className="w-full border-[#CCCCFF] focus:border-[#3457D5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {verificationType === "NIN" ? (
                <Input
                  type="text"
                  placeholder="Enter NIN (11 digits)"
                  maxLength={11}
                  value={nin}
                  onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                  className="border-[#CCCCFF] focus:border-[#3457D5]"
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="id-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-[#CCCCFF] rounded-lg hover:border-[#3457D5] transition-colors bg-[#CCCCFF]/10">
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-[#3457D5]" />
                        <p className="text-sm text-gray-700">{idFile ? idFile.name : "Upload ID Document"}</p>
                        <p className="text-xs text-gray-500 mt-1">Click to browse</p>
                      </div>
                    </div>
                    <input
                      id="id-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </Label>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Comment / Notes (Optional)</Label>
                <Textarea
                  placeholder="Short explanation for the modification request"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="border-[#CCCCFF] focus:border-[#3457D5]"
                />
              </div>

              <div className="space-y-4 border-t border-[#CCCCFF]/50 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Estimated Price</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {priceLoading ? "Loading..." : servicePrice != null ? `₦${servicePrice}` : "—"}
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consent"
                    checked={consentChecked}
                    onCheckedChange={(checked) => setConsentChecked(checked === true)}
                    className="mt-1 border-[#3457D5] data-[state=checked]:bg-[#3457D5]"
                  />
                  <Label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                    By checking this box, you confirm the ID owner's consent for verification.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-1 border-[#3457D5] data-[state=checked]:bg-[#3457D5]"
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-[#3457D5] hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#3457D5] hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#3457D5] hover:bg-[#3457D5]/90 text-white font-medium py-6"
                disabled={!consentChecked || !termsAccepted || isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Submit Modification Request"}
              </Button>
              {priceError && (
                <p className="text-xs text-red-600 mt-2">{String(priceError)}</p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="mt-8 shadow-lg border-[#CCCCFF]/30">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Your Modification History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#CCCCFF]/50">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Ref ID</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">BVN</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No modification requests yet.
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr key={request.id} className="border-b border-[#CCCCFF]/30">
                        <td className="py-3 px-2 font-mono text-xs text-gray-600">#{request.id.slice(0, 8)}</td>
                        <td className="py-3 px-2 text-gray-700">{request.currentBVN}</td>
                        <td className="py-3 px-2 text-gray-700">{request.modificationType}</td>
                        <td className="py-3 px-2 text-gray-600">
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">{getStatusBadge(request.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <KYCRequiredModal open={showKYCModal} onOpenChange={setShowKYCModal} />
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isSubmitting}
      />
    </div>
  )
}
