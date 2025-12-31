"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { category: "BVN", count: 12 },
  { category: "NIN", count: 8 },
  { category: "CAC", count: 15 },
  { category: "VTU", count: 6 },
  { category: "Bills", count: 9 },
  { category: "Verification", count: 4 },
]

export function DisputesByCategoryChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#E63946" />
      </BarChart>
    </ResponsiveContainer>
  )
}
