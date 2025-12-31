import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import { MaintenanceCheck } from "@/components/maintenance-check"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UFriends IT",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.className}`}>
        <Providers>
          <MaintenanceCheck>
            {children}
          </MaintenanceCheck>
        </Providers>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}

