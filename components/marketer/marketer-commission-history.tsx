"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const commissionHistory = [
  {
    id: "1",
    date: "2024-01-15",
    service: "Airtime Purchase",
    amount: 500,
    commission: 25,
    status: "Completed",
  },
  {
    id: "2",
    date: "2024-01-14",
    service: "BVN Print-Out",
    amount: 2000,
    commission: 500,
    status: "Completed",
  },
  {
    id: "3",
    date: "2024-01-13",
    service: "Data Bundle",
    amount: 1500,
    commission: 75,
    status: "Completed",
  },
  {
    id: "4",
    date: "2024-01-12",
    service: "Referral Bonus",
    amount: 0,
    commission: 200,
    status: "Completed",
  },
]

export function MarketerCommissionHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Commissions</CardTitle>
        <CardDescription>Your latest earnings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {commissionHistory.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.service}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">+₦{item.commission.toLocaleString()}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
