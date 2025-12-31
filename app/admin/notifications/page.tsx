"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { cn } from "@/lib/utils"

interface Notification {
    id: string
    type: string
    title: string
    body: string
    createdAt: string
    readAt: string | null
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [markingAll, setMarkingAll] = useState(false)

    const loadNotifications = async () => {
        try {
            const res = await authFetch("/api/notifications?limit=50")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
            }
        } catch { } finally {
            setLoading(false)
        }
    }

    const markAllRead = async () => {
        setMarkingAll(true)
        try {
            await authFetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            })
            setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
        } catch { } finally {
            setMarkingAll(false)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            await authFetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [id] }),
            })
            setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        } catch { }
    }

    useEffect(() => {
        loadNotifications()
    }, [])

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        if (diffMins < 60) return `${diffMins} minutes ago`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours} hours ago`
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays} days ago`
    }

    const unreadCount = notifications.filter((n) => !n.readAt).length

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3457D5]">
                        <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#3457D5]">Admin Notifications</h1>
                        <p className="text-muted-foreground">View all admin alerts and updates</p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={markAllRead} disabled={markingAll} variant="outline">
                        {markingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                        Mark all as read ({unreadCount})
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                    <CardDescription>
                        {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "py-4 px-2 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors",
                                        !n.readAt && "bg-primary/5"
                                    )}
                                    onClick={() => !n.readAt && markAsRead(n.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{n.title}</p>
                                                {!n.readAt && <Badge variant="secondary" className="text-xs">New</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                                            <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(n.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
