"use client"

import { motion } from "framer-motion"
import { GraduationCap, BookOpen, Award, FileText, Users, Flag } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const educationServices = [
  {
    title: "WAEC",
    description: "West African Examinations Council services and result checking",
    icon: GraduationCap,
    href: "/services/education/waec",
    color: "bg-[#3457D5]",
  },
  {
    title: "NECO",
    description: "National Examinations Council services and verification",
    icon: BookOpen,
    href: "/services/education/neco",
    color: "bg-[#3457D5]",
  },
  {
    title: "NABTEB",
    description: "National Business and Technical Examinations Board services",
    icon: Award,
    href: "/services/education/nabteb",
    color: "bg-[#3457D5]",
  },
  {
    title: "NBAIS",
    description: "National Board for Arabic and Islamic Studies services",
    icon: FileText,
    href: "/services/education/nbais",
    color: "bg-[#3457D5]",
  },
  {
    title: "JAMB",
    description: "Joint Admissions and Matriculation Board services",
    icon: Users,
    href: "/services/education/jamb",
    color: "bg-[#3457D5]",
  },
  {
    title: "NYSC",
    description: "National Youth Service Corps services and verification",
    icon: Flag,
    href: "/services/education/nysc",
    color: "bg-[#3457D5]",
  },
]

export default function EducationServicesPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-[#3457D5] mb-2">Education Services</h1>
        <p className="text-muted-foreground">
          Access examination results, verification services, and educational documentation
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {educationServices.map((service, index) => {
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
                    <span className="text-sm text-[#3457D5] font-medium hover:underline">Access Service →</span>
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
