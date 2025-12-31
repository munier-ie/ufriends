"use client"

import { motion } from "framer-motion"
import { Wifi, Building2, Gift } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const dataServices = [
  {
    title: "SME Data",
    description: "Affordable SME data bundles for all networks with long validity",
    icon: Wifi,
    href: "/services/data/sme",
    color: "bg-[#3457D5]",
  },
  {
    title: "Corporate Data",
    description: "Corporate data plans for businesses and organizations",
    icon: Building2,
    href: "/services/data/cooperate",
    color: "bg-[#3457D5]",
  },
  {
    title: "Gift Data",
    description: "Send data bundles as gifts to friends and family",
    icon: Gift,
    href: "/services/data/gift",
    color: "bg-[#3457D5]",
  },
]

export default function DataServicesPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-[#3457D5] mb-2">Data Services</h1>
        <p className="text-muted-foreground">
          Choose from SME, Corporate, or Gift data bundles for all your internet needs
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataServices.map((service, index) => {
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
