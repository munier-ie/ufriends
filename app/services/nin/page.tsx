"use client"

import { motion } from "framer-motion"
import { FileText, Edit, CheckCircle, Shield, Printer } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const ninServices = [
  {
    title: "NIN Slip",
    description: "Get your National Identification Number slip instantly",
    icon: FileText,
    href: "/services/nin/slip",
    color: "bg-[#3457D5]",
  },
  {
    title: "NIN Modification",
    description: "Modify and update your NIN details and information",
    icon: Edit,
    href: "/services/nin/modification",
    color: "bg-[#3457D5]",
  },
  {
    title: "NIN Validation",
    description: "Validate and verify National Identification Numbers",
    icon: CheckCircle,
    href: "/services/nin/validation",
    color: "bg-[#3457D5]",
  },
  {
    title: "IPE Clearance",
    description: "Get your International Passport Eligibility clearance",
    icon: Shield,
    href: "/services/nin/ipe-clearance",
    color: "bg-[#3457D5]",
  },
  {
    title: "NIN Printout",
    description: "Print your NIN slip and verification documents",
    icon: Printer,
    href: "/services/nin/printout",
    color: "bg-[#3457D5]",
  },
]

export default function NINServicesPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-[#3457D5] mb-2">NIN Services</h1>
        <p className="text-muted-foreground">
          National Identification Number services including slip generation, modification, and validation
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ninServices.map((service, index) => {
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
