"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import Image from "next/image"
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
    description: "Buy airtime for all networks",
    href: "/services/airtime",
  },
  {
    icon: Wifi,
    title: "Data",
    description: "Purchase data bundles",
    href: "/services/data",
  },
  {
    icon: Receipt,
    title: "Bills",
    description: "Pay utility bills",
    href: "/services/bills",
  },
  {
    icon: UserCheck,
    title: "BVN Services",
    description: "BVN verification services",
    href: "/services/bvn",
  },
  {
    icon: IdCard,
    title: "NIN Services",
    description: "National ID services",
    href: "/services/nin",
  },
  {
    icon: Building2,
    title: "CAC Registration",
    description: "Business registration",
    href: "/services/cac/registration", // Updated link to new path
  },
  {
    icon: GraduationCap,
    title: "Education",
    description: "Educational services",
    href: "/services/education",
  },
  {
    icon: Banknote,
    title: "Agency Banking",
    description: "POS and banking services",
    href: "/services/agency-banking",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    description: "Identity verification",
    href: "/services/verification",
  },
  {
    icon: BookOpen,
    title: "Training",
    description: "Professional training",
    href: "/services/training",
  },
  {
    icon: Code,
    title: "Software Development",
    description: "Custom software solutions",
    href: "/services/software-development",
  },
]

export function Navbar() {
  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/ufriend-logo.png" alt="UFriends Logo" width={32} height={32} className="w-8 h-8" />
              <span className="font-bold text-xl text-foreground">UFriends IT</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>

              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-muted-foreground hover:text-foreground transition-colors bg-transparent">
                      Services
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid grid-cols-3 gap-3 p-6 w-[600px]">
                        {services.map((service, index) => {
                          const IconComponent = service.icon
                          return (
                            <NavigationMenuLink key={index} asChild>
                              <Link
                                href={service.href}
                                className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  <IconComponent className="h-4 w-4 text-primary" />
                                  <div className="text-sm font-medium leading-none">{service.title}</div>
                                </div>
                                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                  {service.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          )
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <Link href="/partner" className="text-muted-foreground hover:text-foreground transition-colors">
                Partner
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
