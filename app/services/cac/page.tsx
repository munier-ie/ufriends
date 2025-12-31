"use client"

import { motion } from "framer-motion"
import { Building2, FileText, ClipboardCheck, Award } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const cacServices = [
  {
    title: "Business Registration",
    description: "Register your business with the Corporate Affairs Commission",
    icon: Building2,
    href: "/services/cac/registration",
    color: "bg-[#3457D5]",
  },
  {
    title: "JTB TIN Registration",
    description: "Register for Joint Tax Board Tax Identification Number for individuals and businesses",
    icon: Award,
    href: "/services/cac/jtb-tin",
    color: "bg-[#3457D5]",
  },
  {
    title: "Retrieval Status Report",
    description: "Get status reports for your CAC registration applications",
    icon: ClipboardCheck,
    href: "/services/cac/status-report",
    color: "bg-[#3457D5]",
  },
  {
    title: "Retrieval of Certification",
    description: "Retrieve your business registration certificates and documents",
    icon: FileText,
    href: "/services/cac/certification",
    color: "bg-[#3457D5]",
  },
  {
    title: "Post-Incorporation",
    description: "Handle post-incorporation services and compliance requirements",
    icon: Building2,
    href: "/services/cac/post-incorporation",
    color: "bg-[#3457D5]",
  },
]

export default function CACServicesPage() {
  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#3457D5] mb-2">CAC Services</h1>
          <p className="text-muted-foreground">
            Corporate Affairs Commission services for business registration and compliance
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cacServices.map((service, index) => {
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
                      <span className="text-sm text-[#3457D5] font-medium hover:underline">Learn more →</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
