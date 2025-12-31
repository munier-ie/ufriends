"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Code2, Eye, Edit } from "lucide-react"

interface SoftwareRequest {
  id: string
  userId: string
  serviceType: string
  subType: string
  formData: any
  price: number
  status: string
  submittedAt: string
}

export default function InProgressRequestsPage() {
  const [requests, setRequests] = useState<SoftwareRequest[]>([])

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = () => {
    const services = JSON.parse(localStorage.getItem("ufriends_manual_services") || "[]")
    const inProgress = services.filter(
      (s: any) => s.serviceType === "Software Development" && s.status === "In Progress",
    )
    setRequests(inProgress)
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3457D5]">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3457D5]">In Progress Projects</h1>
              <p className="text-muted-foreground">Projects currently being developed</p>
            </div>
          </div>

          <Card className="border-2 border-[#CCCCFF]">
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Total: {requests.length} projects in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Subtype</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs">{request.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Badge variant="default">{request.subType}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate font-medium">{request.formData.projectTitle}</TableCell>
                        <TableCell className="font-semibold">₦{request.price.toLocaleString()}</TableCell>
                        <TableCell>{new Date(request.submittedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
