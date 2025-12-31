"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authFetch } from "@/lib/client-auth"

type ServiceRow = {
  id: string
  name: string
  category: string
  normalPrice: number
  marketerPrice: number
  profit: number
}

function toTitleCase(s: string) {
  return s
    .split(/[-_.\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function MarketerServicesTable() {
  const [services, setServices] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null)
  const [requestAmount, setRequestAmount] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const [userRes, marketerRes] = await Promise.all([
          authFetch("/api/pricing?tier=user"),
          authFetch("/api/pricing?tier=marketer"),
        ])
        const userJson: any = await userRes.json().catch(() => ({}))
        const marketerJson: any = await marketerRes.json().catch(() => ({}))
        const userPrices: Array<{ service: { id: string; name: string; slug: string }; price: any | null }> =
          userJson?.prices || []
        const marketerPrices: Array<{ service: { id: string; name: string; slug: string }; price: any | null }> =
          marketerJson?.prices || []

        const marketerMap = new Map<string, number>()
        for (const m of marketerPrices) {
          const p = m?.price?.price
          const val = typeof p === "number" ? p : Number(p || 0)
          marketerMap.set(m.service.slug, val)
        }

        const rows: ServiceRow[] = userPrices.map((u) => {
          const up = u?.price?.price
          const normal = typeof up === "number" ? up : Number(up || 0)
          const marketer = marketerMap.get(u.service.slug) ?? normal
          const profit = Math.max(0, normal - marketer)
          const catToken = u.service.slug?.split(".")[0] || "service"
          return {
            id: u.service.id,
            name: u.service.name,
            category: toTitleCase(catToken),
            normalPrice: normal,
            marketerPrice: marketer,
            profit,
          }
        })
        setServices(rows)
      } catch {
        setServices([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleRequestService = () => {
    if (!selectedService || !requestAmount) return
    // Handle service request
    console.log(`Requested ${selectedService.name} for ₦${requestAmount}`)
    setSelectedService(null)
    setRequestAmount("")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
          <CardDescription>Request services and manage your pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Normal Price</TableHead>
                  <TableHead className="text-right">Marketer Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(loading ? [] : services).map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">₦{service.normalPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold text-[#3457D5]">
                      ₦{service.marketerPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      ₦{service.profit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedService(service)}
                        className="text-[#3457D5] border-[#3457D5] hover:bg-[#3457D5] hover:text-white"
                      >
                        Request
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Service Request Modal */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Service</DialogTitle>
            <DialogDescription>Request {selectedService?.name} for your marketer account</DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4">
              <div>
                <Label>Service</Label>
                <p className="font-semibold mt-1">{selectedService.name}</p>
              </div>

              <div>
                <Label>Marketer Price</Label>
                <p className="font-semibold text-[#3457D5] mt-1">₦{selectedService.marketerPrice.toLocaleString()}</p>
              </div>

              <div>
                <Label htmlFor="amount">Quantity/Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter quantity or amount"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Total Cost:{" "}
                  <span className="font-bold text-[#3457D5]">
                    ₦{(Number.parseInt(requestAmount || "0") * selectedService.marketerPrice).toLocaleString()}
                  </span>
                </p>
              </div>

              <Button className="w-full bg-[#3457D5] hover:bg-[#2a4ab8]" onClick={handleRequestService}>
                Confirm Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
