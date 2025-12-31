"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Share2 } from "lucide-react"
import {QRCodeSVG} from "qrcode.react"

interface MarketerReferralCardProps {
  marketerData: any
}

export function MarketerReferralCard({ marketerData }: MarketerReferralCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(marketerData.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join UFriends",
        text: "Join me on UFriends and earn rewards!",
        url: marketerData.referralLink,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Link & QR Code</CardTitle>
        <CardDescription>Invite users and earn bonus commissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Referral Link Section */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Your Referral Link</label>
              <div className="flex gap-2 mt-2">
                <Input readOnly value={marketerData.referralLink} className="bg-muted" />
                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {copied && <p className="text-xs text-green-600 mt-1">Link copied!</p>}
            </div>

            <div className="space-y-2">
              <Button className="w-full bg-[#3457D5] hover:bg-[#2a4ab8]" onClick={handleShareLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </div>

            {/* Referral Stats */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Referrals</span>
                <span className="font-bold text-[#3457D5]">{marketerData.totalReferrals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="font-bold text-[#3457D5]">{Math.floor(marketerData.totalReferrals * 0.67)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bonus Earned</span>
                <span className="font-bold text-green-600">
                  ₦{(marketerData.totalReferrals * 200).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center bg-muted p-6 rounded-lg">
            <QRCodeSVG value={marketerData.referralLink} size={200} level="H" includeMargin={true} />
            <p className="text-xs text-muted-foreground mt-3 text-center">Scan to share your referral link</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
