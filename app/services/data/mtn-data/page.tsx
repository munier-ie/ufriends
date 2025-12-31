import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wifi, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MTNDataPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/services/data"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Data Services
          </Link>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wifi className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">MTN Data Plans</h1>
              <p className="text-muted-foreground">Choose from various MTN data bundles</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Data</CardTitle>
              <CardDescription>Select your preferred data plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="08012345678" />
              </div>
              <div>
                <Label htmlFor="plan">Data Plan</Label>
                <select className="w-full p-2 border rounded-md">
                  <option>500MB - ₦300 (30 days)</option>
                  <option>1GB - ₦500 (30 days)</option>
                  <option>2GB - ₦1000 (30 days)</option>
                  <option>5GB - ₦2000 (30 days)</option>
                  <option>10GB - ₦3500 (30 days)</option>
                </select>
              </div>
              <Button className="w-full">Purchase Data</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Plans</CardTitle>
              <CardDescription>Most purchased MTN data plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { size: "1GB", price: "₦500", validity: "30 days" },
                  { size: "2GB", price: "₦1000", validity: "30 days" },
                  { size: "5GB", price: "₦2000", validity: "30 days" },
                ].map((plan) => (
                  <div key={plan.size} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{plan.size}</p>
                      <p className="text-sm text-muted-foreground">{plan.validity}</p>
                    </div>
                    <p className="font-bold text-primary">{plan.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
