"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Eye, Calendar, User } from "lucide-react"

interface AssignedProject {
  requestId: string
  developerName: string
  contact?: string
  expectedCompletion: string
  assignedBy: string
  assignedAt: string
}

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

export default function AssignedProjectsPage() {
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([])
  const [requests, setRequests] = useState<SoftwareRequest[]>([])
  const [selectedProject, setSelectedProject] = useState<{
    assignment: AssignedProject
    request: SoftwareRequest
  } | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const assigned = JSON.parse(localStorage.getItem("ufriends_assigned_projects") || "[]")
    const services = JSON.parse(localStorage.getItem("ufriends_manual_services") || "[]")
    setAssignedProjects(assigned)
    setRequests(services)
  }

  const getRequestById = (requestId: string) => {
    return requests.find((r) => r.id === requestId)
  }

  const handleViewDetails = (assignment: AssignedProject) => {
    const request = getRequestById(assignment.requestId)
    if (request) {
      setSelectedProject({ assignment, request })
      setIsDetailsOpen(true)
    }
  }

  const getStatusBadge = (requestId: string) => {
    const request = getRequestById(requestId)
    if (!request) return <Badge variant="secondary">Unknown</Badge>

    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pending: "secondary",
      "In Progress": "default",
      Completed: "outline",
      Rejected: "destructive",
    }
    return <Badge variant={variants[request.status] || "default"}>{request.status}</Badge>
  }

  const isOverdue = (expectedCompletion: string) => {
    return new Date(expectedCompletion) < new Date()
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3457D5]">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3457D5]">Assigned Projects</h1>
              <p className="text-muted-foreground">Track all developer assignments and deadlines</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assigned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#3457D5]">{assignedProjects.length}</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {
                    assignedProjects.filter((a) => {
                      const req = getRequestById(a.requestId)
                      return req?.status === "In Progress"
                    }).length
                  }
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {
                    assignedProjects.filter((a) => {
                      const req = getRequestById(a.requestId)
                      return req?.status !== "Completed" && isOverdue(a.expectedCompletion)
                    }).length
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-[#CCCCFF]">
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
              <CardDescription>Complete list of assigned software development projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Expected Completion</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedProjects.map((assignment) => {
                      const request = getRequestById(assignment.requestId)
                      const overdue = request?.status !== "Completed" && isOverdue(assignment.expectedCompletion)

                      return (
                        <TableRow key={assignment.requestId} className={overdue ? "bg-red-50" : ""}>
                          <TableCell className="font-medium">
                            {request?.formData.projectTitle || "Unknown Project"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-[#3457D5]" />
                              {assignment.developerName}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{assignment.contact || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span className={overdue ? "font-semibold text-red-600" : ""}>
                                {new Date(assignment.expectedCompletion).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(assignment.requestId)}</TableCell>
                          <TableCell>{assignment.assignedBy}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(assignment)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Assignment Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Assignment Details</DialogTitle>
              <DialogDescription>Complete information about this project assignment</DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-2 border-[#CCCCFF]">
                    <CardHeader>
                      <CardTitle className="text-sm">Project Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Project Title</Label>
                        <p className="font-semibold">{selectedProject.request.formData.projectTitle}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <p>{selectedProject.request.subType}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Budget</Label>
                        <p className="font-semibold text-[#3457D5]">
                          ₦{selectedProject.request.price.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedProject.request.id)}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#CCCCFF]">
                    <CardHeader>
                      <CardTitle className="text-sm">Developer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Developer Name</Label>
                        <p className="font-semibold">{selectedProject.assignment.developerName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Contact</Label>
                        <p>{selectedProject.assignment.contact || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Expected Completion</Label>
                        <p className="font-semibold">
                          {new Date(selectedProject.assignment.expectedCompletion).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Assigned By</Label>
                        <p>{selectedProject.assignment.assignedBy}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Assigned On</Label>
                        <p>{new Date(selectedProject.assignment.assignedAt).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2 border-[#CCCCFF]">
                  <CardHeader>
                    <CardTitle className="text-sm">Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {selectedProject.request.formData.projectDescription ||
                        selectedProject.request.formData.description ||
                        selectedProject.request.formData.problemDescription}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#CCCCFF]">
                  <CardHeader>
                    <CardTitle className="text-sm">Features & Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {selectedProject.request.formData.featureRequirements ||
                        selectedProject.request.formData.features ||
                        selectedProject.request.formData.featureList}
                    </p>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button className="bg-[#3457D5]">Contact Developer</Button>
                  <Button variant="outline">View Full Request</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
