"use client"

import { motion } from "framer-motion"
import { Globe, Smartphone, Wrench } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const softwareDevelopmentServices = [
  {
    title: "Web Applications",
    description: "Custom web applications, portals, and e-commerce solutions",
    icon: Globe,
    href: "/services/software-development/web",
    color: "bg-[#3457D5]",
  },
  {
    title: "Mobile Applications",
    description: "iOS and Android mobile app development services",
    icon: Smartphone,
    href: "/services/software-development/mobile",
    color: "bg-[#3457D5]",
  },
  {
    title: "Custom Solutions",
    description: "Tailored software solutions for your specific business needs",
    icon: Wrench,
    href: "/services/software-development/custom",
    color: "bg-[#3457D5]",
  },
]

export default function SoftwareDevelopmentServicesPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-[#3457D5] mb-2">Software Development Services</h1>
        <p className="text-muted-foreground">
          Professional software development services for web, mobile, and custom solutions
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {softwareDevelopmentServices.map((service, index) => {
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
                    <span className="text-sm text-[#3457D5] font-medium hover:underline">Learn More →</span>
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
