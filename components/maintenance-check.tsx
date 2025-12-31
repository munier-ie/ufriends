"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

export function MaintenanceCheck({ children }: { children: React.ReactNode }) {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const res = await fetch("/api/system/maintenance")
                if (res.ok) {
                    const data = await res.json()
                    setIsMaintenanceMode(data.maintenanceMode === true)
                }
            } catch {
                // If we can't check, assume not in maintenance
            } finally {
                setLoading(false)
            }
        }
        checkMaintenance()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3457D5]/10 to-[#CCCCFF]/10">
                <Loader2 className="h-12 w-12 animate-spin text-[#3457D5]" />
            </div>
        )
    }

    if (isMaintenanceMode) {
        // Allow admin routes to bypass maintenance mode
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
            return <>{children}</>
        }

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#3457D5] to-[#CCCCFF] text-white p-8">
                <div className="max-w-md text-center space-y-6">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <AlertTriangle className="h-12 w-12 text-yellow-300" />
                    </div>
                    <h1 className="text-4xl font-bold">Under Maintenance</h1>
                    <p className="text-lg text-white/90">
                        We're currently performing scheduled maintenance to improve your experience.
                        Please check back in a few minutes.
                    </p>
                    <div className="pt-4">
                        <p className="text-sm text-white/70">UFriends Information Technology</p>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
