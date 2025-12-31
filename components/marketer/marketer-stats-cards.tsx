"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Wallet, Gift, Users } from "lucide-react"

interface MarketerStatsCardsProps {
  marketerData: any
}

export function MarketerStatsCards({ marketerData }: MarketerStatsCardsProps) {
  const stats = [
    {
      title: "Withdrawable Balance",
      value: `₦${Number(marketerData.commissionBalance || 0).toLocaleString()}`,
      icon: Wallet,
      gradient: "from-[#3457D5] to-[#CCCCFF]",
      delay: 0,
    },
    {
      title: "Total Sales",
      value: `₦${Number(marketerData.totalSales || 0).toLocaleString()}`,
      icon: TrendingUp,
      gradient: "from-[#CCCCFF] to-[#CCCCFF]/50",
      textColor: "text-[#3457D5]",
      delay: 0.1,
    },
    {
      title: "Total Commission",
      value: `₦${Number(marketerData.totalCommission || 0).toLocaleString()}`,
      icon: Gift,
      gradient: "from-[#CCCCFF] to-[#CCCCFF]/50",
      textColor: "text-[#3457D5]",
      delay: 0.2,
    },
    {
      title: "Total Referrals",
      value: Number(marketerData.totalReferrals || 0).toString(),
      icon: Users,
      gradient: "border-2 border-[#3457D5]",
      textColor: "text-[#3457D5]",
      delay: 0.3,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: stat.delay }}
          >
            <Card className={`bg-gradient-to-br ${stat.gradient} border-0 overflow-hidden`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.textColor || "text-white"}`}>{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.textColor || "text-white"} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
