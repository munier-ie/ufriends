"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle2, XCircle, AlertCircle, ExternalLink, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Request = {
    id: string
    reference: string
    status: string
    category: string
    subservice: string | null
    createdAt: string
    adminNotes: string | null
    proofUrl: string | null
}

export function ActiveRequests() {
    const [requests, setRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)

    const fetchActiveRequests = async () => {
        try {
            // We'll use the wallet transactions endpoint but filter for active manual statuses
            // Alternatively, we could create a dedicated endpoint for user active requests
            const res = await fetch("/api/wallet/transactions?pageSize=10")
            if (res.ok) {
                const data = await res.json()
                const active = (data.transactions || []).filter((t: any) =>
                    ["SUBMITTED", "ONGOING"].includes(t.status)
                )
                setRequests(active)
            }
        } catch (e) {
            console.error("Failed to fetch active requests", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActiveRequests()
        const interval = setInterval(fetchActiveRequests, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    if (loading && requests.length === 0) return null
    if (requests.length === 0) return null

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#3457D5] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#3457D5]" />
                    Active Requests
                </h2>
                <span className="text-xs text-muted-foreground italic">Updating automatically...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                    {requests.map((req) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="border-[#3457D5]/20 shadow-sm overflow-hidden border-l-4 border-l-[#3457D5]">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between bg-[#3457D5]/5">
                                    <div>
                                        <CardTitle className="text-sm font-bold uppercase">{req.category}</CardTitle>
                                        <p className="text-[10px] text-muted-foreground font-mono">{req.reference}</p>
                                    </div>
                                    <Badge className={
                                        req.status === "SUBMITTED" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                                            "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 animate-pulse"
                                    }>
                                        {req.status === "SUBMITTED" ? "Submitted" : "Ongoing"}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="pt-2 text-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-muted-foreground">Sub-service:</span>
                                        <span className="font-medium">{req.subservice || "N/A"}</span>
                                    </div>

                                    {req.adminNotes && (
                                        <div className="p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 mb-2 italic">
                                            Admin: {req.adminNotes}
                                        </div>
                                    )}

                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="bg-[#3457D5] h-full"
                                            initial={{ width: "10%" }}
                                            animate={{ width: req.status === "SUBMITTED" ? "30%" : "70%" }}
                                            transition={{ duration: 1 }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2">
                                        Submitted on {new Date(req.createdAt).toLocaleString()}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
