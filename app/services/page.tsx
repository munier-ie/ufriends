"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  ArrowRight,
} from "lucide-react"

const services = [
  {
    icon: Smartphone,
    title: "Airtime",
    description: "Buy airtime for all networks instantly",
    href: "/services/airtime",
    color: "text-blue-600",
  },
  {
    icon: Wifi,
    title: "Data",
    description: "Purchase data bundles at competitive rates",
    href: "/services/data",
    color: "text-green-600",
  },
  {
    icon: Receipt,
    title: "Bills",
    description: "Pay utility bills conveniently",
    href: "/services/bills",
    color: "text-orange-600",
  },
  {
    icon: UserCheck,
    title: "BVN Services",
    description: "BVN verification and related services",
    href: "/services/bvn",
    color: "text-purple-600",
  },
  {
    icon: IdCard,
    title: "NIN Services",
    description: "National ID verification services",
    href: "/services/nin",
    color: "text-red-600",
  },
  {
    icon: Building2,
    title: "CAC Registration",
    description: "Business registration and incorporation",
    href: "/services/cac",
    color: "text-indigo-600",
  },
  {
    icon: GraduationCap,
    title: "Education",
    description: "Educational services and resources",
    href: "/services/education",
    color: "text-teal-600",
  },
  {
    icon: Banknote,
    title: "Agency Banking",
    description: "POS and banking services",
    href: "/services/agency-banking",
    color: "text-yellow-600",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    description: "Identity and document verification",
    href: "/services/verification",
    color: "text-pink-600",
  },
  {
    icon: BookOpen,
    title: "Training",
    description: "Professional training and development",
    href: "/services/training",
    color: "text-cyan-600",
  },
  {
    icon: Code,
    title: "Software Development",
    description: "Custom software solutions",
    href: "/services/software-development",
    color: "text-violet-600",
  },
]

import { ActiveRequests } from "@/components/active-requests"

export default function ServicesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Our Services</h1>
        <p className="text-muted-foreground text-lg">
          Explore our comprehensive range of digital services designed to make your life easier.
        </p>
      </div>

      <ActiveRequests />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => {
          const IconComponent = service.icon
          return (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-accent">
                    <IconComponent className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{service.description}</CardDescription>
                <Link href={service.href}>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
