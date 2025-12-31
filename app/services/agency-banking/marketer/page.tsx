"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/client-auth"
import { CheckCircle2, TrendingUp, Copy, Share2, QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

const marketingTypes = [
  { id: "pos", label: "POS Terminals" },
  { id: "airtime-data", label: "Airtime & Data" },
  { id: "verification", label: "Verification Services" },
  { id: "bills", label: "Bill Payments" },
  { id: "all", label: "All Services" },
]

export default function BecomeMarketerPage() {
  const { toast } = useToast()
  const [isRegistered, setIsRegistered] = useState(false)
  const [marketerData, setMarketerData] = useState<any>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    state: "",
    lga: "",
    referralCode: "",
  })
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null)
  const [validId, setValidId] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch("/api/marketers/me")
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            setIsRegistered(true)
            setMarketerData(data.profile)
          }
        }
      } catch (e) {
        console.error("Failed to load marketer status", e)
      }
    }
    loadStatus()
  }, [])

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes((prev) => (prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one marketing type",
        variant: "destructive",
      })
      return
    }

    if (!passportPhoto || !validId) {
      toast({
        title: "Error",
        description: "Please upload all required documents",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload Documents
      const uploadFile = async (file: File) => {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/uploads", { method: "POST", body: formData })
        if (!res.ok) throw new Error("File upload failed")
        return await res.json()
      }

      const passportRes = await uploadFile(passportPhoto)
      const validIdRes = await uploadFile(validId)

      // 2. Submit Registration
      const body = {
        ...formData,
        marketingType: selectedTypes,
        passportUrl: passportRes.url,
        validIdUrl: validIdRes.url,
      }

      const res = await fetch("/api/marketers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setIsRegistered(true)
      setMarketerData(data.profile)

      toast({
        title: "Registration Successful",
        description: "Your marketer registration request has been received. You'll be notified once it's reviewed.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyReferral = () => {
    if (marketerData?.referralLink) {
      navigator.clipboard.writeText(marketerData.referralLink)
      toast({
        title: "Copied",
        description: "Referral link copied to clipboard",
      })
    }
  }

  const getStatusBadge = () => {
    if (marketerData?.status === "approved") {
      return <Badge className="bg-green-600 text-white">Verified Marketer 💼</Badge>
    }
    if (marketerData?.status === "pending") {
      return <Badge className="bg-yellow-500 text-white">Marketer Request Pending ⏳</Badge>
    }
    return <Badge className="bg-gray-400 text-white">Standard User 💸</Badge>
  }

  if (isRegistered && marketerData) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketer Dashboard</h1>
                <p className="text-gray-600">Welcome back, {marketerData.fullName}!</p>
              </div>
              {getStatusBadge()}
            </div>
          </motion.div>

          {marketerData.status === "pending" && (
            <Card className="mb-8 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-yellow-800">
                  Your marketer request is under review. You'll receive an email notification once it's approved.
                </p>
              </CardContent>
            </Card>
          )}

          {marketerData.status === "approved" && (
            <>
              {/* Stats Grid */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#3457D5]">{marketerData.totalReferrals}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#3457D5]">₦{marketerData.totalSales.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Commission Earned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">₦{marketerData.commission.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Withdrawable Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#3457D5]">
                      ₦{marketerData.withdrawableBalance.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Section */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Your Referral Link</CardTitle>
                  <CardDescription>Share this link to earn referral commissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input readOnly value={marketerData.referralLink || ""} className="bg-muted" />
                    <Button onClick={handleCopyReferral} variant="outline" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowQR(!showQR)}>
                    <QrCode className="w-4 h-4 mr-2" />
                    {showQR ? "Hide" : "Show"} QR Code
                  </Button>

                  {showQR && (
                    <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                      <QRCodeSVG value={marketerData.referralLink || ""} size={200} level="H" includeMargin={true} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Marketer ID</Label>
                  <p className="font-medium">{marketerData.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <p className="font-medium capitalize">{marketerData.status}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Marketing Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {marketerData.marketingType.map((type: string) => (
                      <Badge key={type} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Member Since</Label>
                  <p className="font-medium">{new Date(marketerData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a UFriends Marketer</h1>
          <p className="text-gray-600">Join our marketer program and earn commissions by selling UFriends services.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Marketer Registration</CardTitle>
                <CardDescription>Fill out the form below to become a UFriends marketer</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lga">LGA *</Label>
                      <Input
                        id="lga"
                        value={formData.lga}
                        onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral/Agent Code (Optional)</Label>
                    <Input
                      id="referralCode"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Type of Marketing *</Label>
                    <div className="space-y-2">
                      {marketingTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={type.id}
                            checked={selectedTypes.includes(type.id)}
                            onCheckedChange={() => handleTypeToggle(type.id)}
                          />
                          <label
                            htmlFor={type.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {type.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-gray-900">Required Documents</h3>

                    <div className="space-y-2">
                      <Label htmlFor="passportPhoto">Passport Photograph *</Label>
                      <Input
                        id="passportPhoto"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPassportPhoto(e.target.files?.[0] || null)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validId">Valid ID (NIN, Voter's Card, or Driver's License) *</Label>
                      <Input
                        id="validId"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setValidId(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-[#3457D5] hover:bg-[#2a46b0]" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Register as Marketer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Sidebar */}
          <div className="space-y-4">
            <Card className="bg-[#CCCCFF]/20 border-[#3457D5]/20">
              <CardHeader>
                <CardTitle className="text-[#3457D5] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Marketer Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0" />
                  <span>Earn up to 15% commission on all sales</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0" />
                  <span>Access to exclusive marketer dashboard</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0" />
                  <span>Weekly commission payouts</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0" />
                  <span>Marketing materials and support</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3457D5] mt-0.5 flex-shrink-0" />
                  <span>Performance bonuses and incentives</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Commission Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">POS Sales</span>
                  <span className="font-semibold">10-15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Airtime/Data</span>
                  <span className="font-semibold">5-8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verifications</span>
                  <span className="font-semibold">8-12%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bill Payments</span>
                  <span className="font-semibold">3-5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
