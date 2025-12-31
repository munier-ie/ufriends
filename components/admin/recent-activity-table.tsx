"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { authFetch } from "@/lib/client-auth"

type ActivityRow = {
  id: string
  date: string
  user: string
  category: string
  service: string
  status: "Completed" | "Pending" | "Failed" | "Processing"
}

export function RecentActivityTable() {
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await authFetch(`/api/admin/audit-logs?take=10`)
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.ok && Array.isArray(data.logs)) {
          const mapped: ActivityRow[] = data.logs.map((l: any) => ({
            id: l.id,
            date: new Date(l.createdAt).toISOString().slice(0, 16).replace("T", " "),
            user: l.actorId || "system",
            category: l.resourceType || l.action || "Audit",
            service: l.action || "",
            status: "Completed",
          }))
          setRows(mapped)
        }
      } catch (err) {
        // leave rows empty on error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(loading ? [] : rows).map((activity) => (
          <TableRow key={activity.id}>
            <TableCell className="font-medium">{activity.date}</TableCell>
            <TableCell>{activity.user}</TableCell>
            <TableCell>{activity.category}</TableCell>
            <TableCell>{activity.service}</TableCell>
            <TableCell>
              <Badge
                variant={
                  activity.status === "Completed"
                    ? "default"
                    : activity.status === "Pending"
                      ? "secondary"
                      : activity.status === "Processing"
                        ? "secondary"
                        : "destructive"
                }
              >
                {activity.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
        {!loading && rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-sm text-muted-foreground">
              No recent activity
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
