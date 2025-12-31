import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone } from "lucide-react"

export default function MTNAirtimePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">MTN Airtime</h1>
          <p className="text-muted-foreground">Purchase MTN airtime instantly</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Buy MTN Airtime</CardTitle>
            <CardDescription>Enter phone number and amount to purchase airtime</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="08012345678" />
            </div>
            <div>
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input id="amount" type="number" placeholder="100" />
            </div>
            <Button className="w-full">Purchase Airtime</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Amounts</CardTitle>
            <CardDescription>Select from popular airtime amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[100, 200, 500, 1000, 2000, 5000].map((amount) => (
                <Button key={amount} variant="outline" className="h-12 bg-transparent">
                  ₦{amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
