"use client"

import { motion } from "framer-motion"
import { Users, Crown, BookOpen, FileText, CreditCard, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const trainingServices = [
  {
    title: "Free User Training",
    description: "Learn platform basics, signup, login, and dashboard management",
    icon: Users,
    href: "/services/training/free-user",
    color: "bg-[#3457D5]",
  },
  {
    title: "Premium User Training",
    description: "Advanced features, package management, and premium services",
    icon: Crown,
    href: "/services/training/premium-user",
    color: "bg-[#3457D5]",
  },
  {
    title: "CAC Registration Training",
    description: "Complete guide to Corporate Affairs Commission registration",
    icon: FileText,
    href: "/services/training/cac-registration",
    color: "bg-[#3457D5]",
  },
  {
    title: "NIN Modification Training",
    description: "Learn how to modify National Identification Number details",
    icon: BookOpen,
    href: "/services/training/nin-modification",
    color: "bg-[#3457D5]",
  },
  {
    title: "BVN Modification Training",
    description: "Training on Bank Verification Number modification process",
    icon: CreditCard,
    href: "/services/training/bvn-modification",
    color: "bg-[#3457D5]",
  },
  {
    title: "Agency Updates Training",
    description: "Stay updated with latest agency banking features and updates",
    icon: TrendingUp,
    href: "/services/training/agency-updates",
    color: "bg-[#3457D5]",
  },
]

export default function TrainingServicesPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-[#3457D5] mb-2">Training Services</h1>
        <p className="text-muted-foreground">
          Comprehensive training programs to help you master UFriends platform and services
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainingServices.map((service, index) => {
          const Icon = service.icon
          return (
            <motion.div
              key={service.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={service.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-[#CCCCFF]/20">
                  <CardHeader>
                    <div className={`${service.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-[#3457D5]">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-[#3457D5] font-medium hover:underline">Start Learning →</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
