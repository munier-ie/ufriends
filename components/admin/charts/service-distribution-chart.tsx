"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const data = [
  { name: "Airtime", value: 320 },
  { name: "Data", value: 280 },
  { name: "Bills", value: 180 },
  { name: "Education", value: 150 },
  { name: "Software", value: 120 },
  { name: "Others", value: 234 },
]

const COLORS = ["#3457D5", "#CCCCFF", "#2c3e50", "#f0f4f8", "#e63946", "#6b7280"]

export function ServiceDistributionChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(((percent ?? 0) as number) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
