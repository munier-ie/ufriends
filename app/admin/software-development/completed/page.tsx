"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Code2, Download, Eye } from "lucide-react"
import { ensureAbsoluteUrl } from "@/lib/utils"

interface SoftwareRequest {
  id: string
  userId: string
  serviceType: string
  subType: string
  formData: any
  price: number
  status: string
  submittedAt: string
  completedAt?: string
  deliveryFile?: string
}

export default function CompletedProjectsPage() {
  const [requests, setRequests] = useState<SoftwareRequest[]>([])

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = () => {
    const services = JSON.parse(localStorage.getItem("ufriends_manual_services") || "[]")
    const completed = services.filter((s: any) => s.serviceType === "Software Development" && s.status === "Completed")
    setRequests(completed)
  }

  const handleDownload = (deliveryFile: string) => {
    window.open(ensureAbsoluteUrl(deliveryFile), "_blank")
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-600">Completed Projects</h1>
              <p className="text-muted-foreground">Successfully delivered software projects</p>
            </div>
          </div>

          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle>Delivered Projects</CardTitle>
              <CardDescription>Total: {requests.length} completed projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead>Delivery File</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Completed Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.formData.projectTitle}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Assigned Developer</Badge>
                        </TableCell>
                        <TableCell>
                          {request.deliveryFile ? (
                            <span className="text-sm text-blue-600">{request.deliveryFile}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No file</span>
                          )}
                        </TableCell>
                        <TableCell>{request.userId}</TableCell>
                        <TableCell>
                          {request.completedAt ? new Date(request.completedAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.deliveryFile && (
                              <Button size="sm" variant="ghost" onClick={() => handleDownload(request.deliveryFile!)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
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
