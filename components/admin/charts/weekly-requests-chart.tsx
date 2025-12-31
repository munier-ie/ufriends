"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", requests: 145 },
  { day: "Tue", requests: 178 },
  { day: "Wed", requests: 192 },
  { day: "Thu", requests: 165 },
  { day: "Fri", requests: 210 },
  { day: "Sat", requests: 198 },
  { day: "Sun", requests: 156 },
]

export function WeeklyRequestsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="requests" stroke="#3457D5" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
