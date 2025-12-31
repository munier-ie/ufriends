"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type ServiceRevenue = { service: string; revenue: number }

export function TopServicesByRevenueChart({ data = [] as ServiceRevenue[] }: { data?: ServiceRevenue[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Services by Revenue</CardTitle>
        <CardDescription>Best performing services</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="service" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `₦${value.toLocaleString()}`}
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            />
            <Bar dataKey="revenue" fill="#3457D5" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
