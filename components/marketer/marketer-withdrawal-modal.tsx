"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface MarketerWithdrawalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  marketerData: any
}

export function MarketerWithdrawalModal({ open, onOpenChange, marketerData }: MarketerWithdrawalModalProps) {
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [destination, setDestination] = useState("wallet")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleWithdraw = async () => {
    if (!withdrawalAmount || Number.parseInt(withdrawalAmount) <= 0) return

    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      console.log(`Withdrawal of ₦${withdrawalAmount} to ${destination}`)
      setWithdrawalAmount("")
      setDestination("wallet")
      setIsSubmitting(false)
      onOpenChange(false)
    }, 1500)
  }

  const maxAmount = marketerData?.withdrawableBalance || 0
  const isValidAmount =
    Number.parseInt(withdrawalAmount || "0") > 0 && Number.parseInt(withdrawalAmount || "0") <= maxAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>Transfer your earnings to your wallet or bank account</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Balance */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold text-[#3457D5]">₦{maxAmount.toLocaleString()}</p>
          </div>

          {/* Withdrawal Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              max={maxAmount}
            />
            <p className="text-xs text-muted-foreground">Max: ₦{maxAmount.toLocaleString()}</p>
          </div>

          {/* Destination Selection */}
          <div className="space-y-3">
            <Label>Destination</Label>
            <RadioGroup value={destination} onValueChange={setDestination}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                  <p className="font-medium">UFriends Wallet</p>
                  <p className="text-xs text-muted-foreground">Instant transfer</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="flex-1 cursor-pointer">
                  <p className="font-medium">Bank Account</p>
                  <p className="text-xs text-muted-foreground">1-2 business days</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Bank Details (if bank selected) */}
          {destination === "bank" && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-medium">John Doe</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-medium">1234567890</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="font-medium">First Bank Nigeria</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {withdrawalAmount && (
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>Amount</span>
                <span className="font-medium">₦{Number.parseInt(withdrawalAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fee</span>
                <span className="font-medium">₦0</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#3457D5]">₦{Number.parseInt(withdrawalAmount).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#3457D5] hover:bg-[#3457D5]/90"
              onClick={handleWithdraw}
              disabled={!isValidAmount || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Withdraw"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
