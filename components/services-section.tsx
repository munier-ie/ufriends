"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Smartphone,
  Wifi,
  Receipt,
  UserCheck,
  Award as IdCard,
  Building2,
  GraduationCap,
  Banknote,
  ShieldCheck,
  BookOpen,
  Code,
} from "lucide-react"

const services = [
  {
    icon: Smartphone,
    title: "Airtime",
    description: "Buy airtime for all networks instantly with competitive rates and instant delivery.",
    features: ["All Networks", "Instant Delivery", "Best Rates"],
  },
  {
    icon: Wifi,
    title: "Data",
    description: "Purchase data bundles for internet connectivity across all major network providers.",
    features: ["All Networks", "Various Plans", "Auto Renewal"],
  },
  {
    icon: Receipt,
    title: "Bills",
    description: "Pay electricity, water, cable TV, and other utility bills seamlessly in one place.",
    features: ["Electricity", "Cable TV", "Water Bills"],
  },
  {
    icon: UserCheck,
    title: "BVN Services",
    description: "Complete BVN verification and related banking services with secure processing.",
    features: ["BVN Verification", "Bank Linking", "Secure Process"],
  },
  {
    icon: IdCard,
    title: "NIN Services",
    description: "National Identity Number services including verification and documentation.",
    features: ["NIN Verification", "Documentation", "Fast Processing"],
  },
  {
    icon: Building2,
    title: "CAC Registration",
    description: "Business registration with Corporate Affairs Commission made simple and efficient.",
    features: ["Business Registration", "Name Search", "Documentation"],
  },
  {
    icon: GraduationCap,
    title: "Education",
    description: "Educational services including result checking, school fees, and academic payments.",
    features: ["Result Checking", "School Fees", "Exam Payments"],
  },
  {
    icon: Banknote,
    title: "Agency Banking",
    description:
      "Request POS terminals for your business and become a marketer earning commissions by selling POS devices to other businesses.",
    features: ["POS Request", "Marketer Program", "Commission Earnings"],
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    description: "Identity and document verification services for individuals and businesses.",
    features: ["ID Verification", "Document Check", "Background Verification"],
  },
  {
    icon: BookOpen,
    title: "Training",
    description: "Professional training programs in fintech, digital skills, and business development.",
    features: ["Digital Skills", "Fintech Training", "Certification"],
  },
  {
    icon: Code,
    title: "Software Development",
    description: "Custom software solutions, mobile apps, and web development services.",
    features: ["Mobile Apps", "Web Development", "Custom Solutions"],
  },
]

export function ServicesSection() {
  return (
    <motion.section
      id="services"
      className="py-20 lg:py-32 bg-muted/30"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Comprehensive <span className="text-primary">Financial Services</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            From everyday transactions to business solutions, we provide a complete suite of financial technology
            services to meet all your needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const IconComponent = service.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors mx-auto">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors text-center">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {service.description}
                    </CardDescription>

                    <div className="space-y-2 mb-6">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all bg-transparent"
                    >
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground mb-6">
            Need a custom solution? We're here to help build exactly what you need.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Contact Our Team
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}
