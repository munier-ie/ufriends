"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Zap, Wifi, Tv, Fingerprint } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export function HeroSection() {
  const scrollToServices = () => {
    const servicesSection = document.getElementById("services")
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <motion.section
      className="relative py-20 lg:py-32 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                Your Complete <span className="text-primary">Financial</span> Technology Partner
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed text-pretty max-w-2xl">
                Experience seamless digital payments, bill management, and financial services all in one powerful
                platform. UFriends IT makes managing your finances simple, secure, and efficient.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-lg"
              >
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToServices}
                className="text-lg px-8 py-6 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                <Play className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">₦2B+</div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Updated Phone Mockup */}
          <motion.div
            className="relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative w-80 h-[640px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  <div className="h-full bg-gradient-to-br from-primary/5 to-secondary/10 p-6 flex flex-col">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center mb-6 text-xs text-gray-600">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-4 h-2 bg-primary rounded-sm"></div>
                        <div className="w-1 h-2 bg-gray-300 rounded-sm"></div>
                        <div className="w-6 h-2 bg-primary rounded-sm"></div>
                      </div>
                    </div>

                    {/* UFriends Logo and Branding */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Image src="/ufriend-logo.png" alt="UFriends Logo" width={24} height={24} className="w-6 h-6" />
                        <span className="font-bold text-lg text-primary">UFriends</span>
                      </div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">INFORMATION TECHNOLOGY</p>
                    </div>

                    {/* Main Heading */}
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Secure ID & Services</h2>
                      <p className="text-sm text-gray-600">Trusted by 10,000+ users in Nigeria</p>
                    </div>

                    {/* Get Started Button */}
                    <div className="mb-6">
                      <Button asChild className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold">
                        <Link href="/signup">Get Started</Link>
                      </Button>
                    </div>

                    {/* Service Icons Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl mb-2 flex items-center justify-center mx-auto">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-gray-900">Airtime</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl mb-2 flex items-center justify-center mx-auto">
                          <Wifi className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-gray-900">Data</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl mb-2 flex items-center justify-center mx-auto">
                          <Tv className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-gray-900">Bills</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl mb-2 flex items-center justify-center mx-auto">
                          <Fingerprint className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-gray-900">BVN</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl mb-2 flex items-center justify-center mx-auto">
                          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-gray-900">NIN</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl mb-2 flex items-center justify-center mx-auto">
                          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-gray-900">CAC</p>
                      </div>
                    </div>

                    {/* More Services Section */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">More Services</h3>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>• Education</span>
                        <span>• Agency Banking</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>• Training</span>
                        <span>• Software Dev</span>
                      </div>
                    </div>

                    {/* Open Account Button */}
                    <Button asChild className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold">
                      <Link href="/signup">Open Account</Link>
                    </Button>
                  </div>
                </div>

                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl"></div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
    </motion.section>
  )
}
