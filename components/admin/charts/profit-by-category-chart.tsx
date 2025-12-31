"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "BVN Services", value: 285000, color: "#3457D5" },
  { name: "NIN Services", value: 198000, color: "#CCCCFF" },
  { name: "CAC Services", value: 156000, color: "#2C3E50" },
  { name: "Airtime & Data", value: 124000, color: "#F0F4F8" },
  { name: "Bills Payment", value: 79000, color: "#E63946" },
]

export function ProfitByCategoryChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
