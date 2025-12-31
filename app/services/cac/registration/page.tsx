"use client"

import { CacRegistrationForm } from "@/components/cac-registration-form"
import { motion } from "framer-motion"

export default function CacRegistrationPage() {
  return (
    <div className="min-h-screen crosshatch-bg">
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">CAC Registration</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Register your business name or company with the Corporate Affairs Commission
            </p>
          </div>
          <CacRegistrationForm />
        </motion.div>
      </main>
    </div>
  )
}
