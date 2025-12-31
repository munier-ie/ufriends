"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type UserGrowthPoint = { month: string; users: number }

export function UserGrowthChart({ data = [] as UserGrowthPoint[] }: { data?: UserGrowthPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>Active users over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            <Area type="monotone" dataKey="users" stroke="#3457D5" fill="#CCCCFF" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
