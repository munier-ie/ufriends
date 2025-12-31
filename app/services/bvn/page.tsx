"use client"

import { motion } from "framer-motion"
import { CreditCard, Edit, FileSearch, AlertTriangle, Printer } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const bvnServices = [
  {
    title: "Android License",
    description: "Get your BVN Android license for mobile banking applications",
    icon: CreditCard,
    href: "/services/bvn/android-license",
    color: "bg-[#3457D5]",
  },
  {
    title: "BVN Modification",
    description: "Update and modify your Bank Verification Number details",
    icon: Edit,
    href: "/services/bvn/modification",
    color: "bg-[#3457D5]",
  },
  {
    title: "BVN Retrieval",
    description: "Retrieve your Bank Verification Number if forgotten",
    icon: FileSearch,
    href: "/services/bvn/retrieval",
    color: "bg-[#3457D5]",
  },
  {
    title: "Central Risk Management",
    description: "Check and manage your central risk management status",
    icon: AlertTriangle,
    href: "/services/bvn/central-risk",
    color: "bg-[#3457D5]",
  },
  {
    title: "BVN Print Out",
    description: "Print your BVN slip and verification documents",
    icon: Printer,
    href: "/services/bvn/printout",
    color: "bg-[#3457D5]",
  },
]

export default function BVNServicesPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-[#3457D5] mb-2">BVN Services</h1>
        <p className="text-muted-foreground">
          Complete Bank Verification Number services including retrieval, modification, and more
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bvnServices.map((service, index) => {
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
                    <span className="text-sm text-[#3457D5] font-medium hover:underline">Get Started →</span>
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
