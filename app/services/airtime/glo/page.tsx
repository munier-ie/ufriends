import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GloAirtimePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/services/airtime"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Airtime Services
          </Link>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Glo Airtime</h1>
              <p className="text-muted-foreground">Purchase Glo airtime with bonus</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Buy Glo Airtime</CardTitle>
              <CardDescription>Get extra value with Glo airtime purchases</CardDescription>
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
              <Button className="w-full bg-green-600 hover:bg-green-700">Purchase Airtime</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Glo Bonuses</CardTitle>
              <CardDescription>Special offers for Glo customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium">₦100 = ₦120 Airtime</p>
                  <p className="text-sm text-muted-foreground">20% bonus airtime</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium">₦500 = ₦650 Airtime</p>
                  <p className="text-sm text-muted-foreground">30% bonus airtime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
