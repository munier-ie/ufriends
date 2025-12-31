"use client"

import { Button } from "@/components/ui/button"
import { Home, Smartphone, Wifi, Receipt, MoreHorizontal, CreditCard, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const primaryNavItems = [
  { icon: Home, label: "Home", href: "/dashboard", active: true },
  { icon: Smartphone, label: "Airtime", href: "/dashboard/airtime" },
  { icon: Wifi, label: "Data", href: "/dashboard/data" },
  { icon: Receipt, label: "Bills", href: "/dashboard/bills" },
  { icon: MoreHorizontal, label: "More", href: "#" },
]

const moreNavItems = [
  { icon: CreditCard, label: "BVN", href: "/dashboard/bvn" },
  { icon: Building2, label: "Agency Banking", href: "/dashboard/agency-banking" },
  { icon: Building2, label: "CAC", href: "/dashboard/cac" },
]

export function MobileBottomNav() {
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
        <div className="grid grid-cols-5 h-16">
          {primaryNavItems.map((item, index) => {
            const Icon = item.icon
            const isMore = item.label === "More"

            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "h-full rounded-none flex-col gap-1 px-1",
                  item.active && "text-primary bg-primary/10",
                  isMore && showMore && "text-primary bg-primary/10",
                )}
                onClick={() => {
                  if (isMore) {
                    setShowMore(!showMore)
                  }
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.active && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
                )}
              </Button>
            )
          })}
        </div>
      </nav>

      {/* More Menu Overlay - Mobile Only */}
      {showMore && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowMore(false)} />
          <div className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">More Services</h3>
              <div className="grid grid-cols-3 gap-3">
                {moreNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className="h-auto p-3 flex-col gap-2"
                      onClick={() => setShowMore(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs text-center">{item.label}</span>
                    </Button>
                  )
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowMore(false)}>
                  View All Services
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
