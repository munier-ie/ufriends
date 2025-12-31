"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Search, Eye, UserPlus, Edit, Trash2, Code2 } from "lucide-react"

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

interface AssignedProject {
  requestId: string
  developerName: string
  contact?: string
  expectedCompletion: string
  assignedBy: string
  assignedAt: string
}

export default function AllSoftwareRequestsPage() {
  const [requests, setRequests] = useState<SoftwareRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<SoftwareRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<SoftwareRequest | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const { toast } = useToast()

  const [assignData, setAssignData] = useState({
    developerName: "",
    email: "",
    contact: "",
    expectedCompletion: "",
    note: "",
  })

  const [updateData, setUpdateData] = useState({
    progressNote: "",
    status: "",
    deliveryFile: "",
    comment: "",
  })

  useEffect(() => {
    loadRequests()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = requests.filter(
        (req) =>
          req.formData.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.subType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredRequests(filtered)
    } else {
      setFilteredRequests(requests)
    }
  }, [searchQuery, requests])

  const loadRequests = () => {
    const services = JSON.parse(localStorage.getItem("ufriends_manual_services") || "[]")
    const softwareRequests = services.filter((s: any) => s.serviceType === "Software Development")
    setRequests(softwareRequests)
    setFilteredRequests(softwareRequests)
  }

  const handleViewDetails = (request: SoftwareRequest) => {
    setSelectedRequest(request)
    setIsDetailsOpen(true)
  }

  const handleAssignDeveloper = (request: SoftwareRequest) => {
    setSelectedRequest(request)
    setIsAssignOpen(true)
  }

  const handleUpdateProgress = (request: SoftwareRequest) => {
    setSelectedRequest(request)
    setUpdateData({
      progressNote: "",
      status: request.status,
      deliveryFile: "",
      comment: "",
    })
    setIsUpdateOpen(true)
  }

  const handleDelete = (request: SoftwareRequest) => {
    setSelectedRequest(request)
    setIsDeleteOpen(true)
  }

  const confirmAssign = () => {
    if (!selectedRequest) return

    const assignedProjects = JSON.parse(localStorage.getItem("ufriends_assigned_projects") || "[]")
    const newAssignment: AssignedProject = {
      requestId: selectedRequest.id,
      developerName: assignData.developerName,
      contact: assignData.contact,
      expectedCompletion: assignData.expectedCompletion,
      assignedBy: "Admin",
      assignedAt: new Date().toISOString(),
    }

    assignedProjects.push(newAssignment)
    localStorage.setItem("ufriends_assigned_projects", JSON.stringify(assignedProjects))

    // Update request status
    const services = JSON.parse(localStorage.getItem("ufriends_manual_services") || "[]")
    const index = services.findIndex((s: any) => s.id === selectedRequest.id)
    if (index !== -1) {
      services[index].status = "In Progress"
      localStorage.setItem("ufriends_manual_services", JSON.stringify(services))
    }

    // Log audit
    const auditLog = JSON.parse(localStorage.getItem("ufriends_audit_log") || "[]")
    auditLog.push({
      adminId: "admin_001",
      requestId: selectedRequest.id,
      action: `Assigned to ${assignData.developerName}`,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem("ufriends_audit_log", JSON.stringify(auditLog))

    toast({
      title: "Developer Assigned",
      description: `Project assigned to ${assignData.developerName}`,
    })

    setIsAssignOpen(false)
    setAssignData({ developerName: "", email: "", contact: "", expectedCompletion: "", note: "" })
    loadRequests()
  }

  const confirmUpdate = () => {
    if (!selectedRequest) return

    const services = JSON.parse(localStorage.getItem("ufriends_manual_services") || "[]")
    const index = services.findIndex((s: any) => s.id === selectedRequest.id)

    if (index !== -1) {
      services[index].status = updateData.status
      services[index].progressNote = updateData.progressNote
      services[index].deliveryFile = updateData.deliveryFile

      if (updateData.status === "Completed") {
        services[index].completedAt = new Date().toISOString()
      }

      localStorage.setItem("ufriends_manual_services", JSON.stringify(services))
    }

    // Log audit
    const auditLog = JSON.parse(localStorage.getItem("ufriends_audit_log") || "[]")
    auditLog.push({
      adminId: "admin_001",
      requestId: selectedRequest.id,
      action: `Updated status to ${updateData.status}`,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem("ufriends_audit_log", JSON.stringify(auditLog))

    toast({
      title: "Progress Updated",
      description: `Project status updated to ${updateData.status}`,
    })

    setIsUpdateOpen(false)
    loadRequests()
  }

  const confirmDelete = () => {
    if (deletePassword !== "delete123") {
      toast({
        title: "Incorrect Password",
        description: "Please enter the correct password to delete",
        variant: "destructive",
      })
      return
    }

    if (!selectedRequest) return

    const services = JSON.parse(localStorage.getItem("ufriends_manual_services") || "[]")
    const filtered = services.filter((s: any) => s.id !== selectedRequest.id)
    localStorage.setItem("ufriends_manual_services", JSON.stringify(filtered))

    toast({
      title: "Request Deleted",
      description: "The request has been permanently deleted",
    })

    setIsDeleteOpen(false)
    setDeletePassword("")
    loadRequests()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pending: "secondary",
      "In Progress": "default",
      Completed: "outline",
      Rejected: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
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
              <h1 className="text-3xl font-bold text-[#3457D5]">All Software Development Requests</h1>
              <p className="text-muted-foreground">Manage all software development project requests</p>
            </div>
          </div>

          <Card className="border-2 border-[#CCCCFF]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Requests</CardTitle>
                  <CardDescription>Total: {filteredRequests.length} requests</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Subtype</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs">{request.id.slice(0, 8)}</TableCell>
                        <TableCell>{request.userId}</TableCell>
                        <TableCell>{request.subType}</TableCell>
                        <TableCell className="max-w-xs truncate">{request.formData.projectTitle}</TableCell>
                        <TableCell>₦{request.price.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{new Date(request.submittedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(request)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleAssignDeveloper(request)}>
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleUpdateProgress(request)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(request)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* View Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Project Details</DialogTitle>
              <DialogDescription>Complete information about this software development request</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Project Title</Label>
                  <p className="text-sm">{selectedRequest.formData.projectTitle}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Type</Label>
                  <p className="text-sm">{selectedRequest.subType}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Description</Label>
                  <p className="text-sm">
                    {selectedRequest.formData.projectDescription ||
                      selectedRequest.formData.description ||
                      selectedRequest.formData.problemDescription}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Features</Label>
                  <p className="text-sm">
                    {selectedRequest.formData.featureRequirements ||
                      selectedRequest.formData.features ||
                      selectedRequest.formData.featureList}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Budget</Label>
                    <p className="text-sm">{selectedRequest.formData.budgetRange}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Delivery Timeline</Label>
                    <p className="text-sm">{selectedRequest.formData.deliveryTimeframe}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Price</Label>
                  <p className="text-sm font-bold text-[#3457D5]">₦{selectedRequest.price.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsDetailsOpen(false)
                      handleAssignDeveloper(selectedRequest)
                    }}
                    className="bg-[#3457D5]"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Developer
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailsOpen(false)
                      handleUpdateProgress(selectedRequest)
                    }}
                    variant="outline"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Update Progress
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Developer Modal */}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Developer</DialogTitle>
              <DialogDescription>Assign this project to a developer</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="developerName">Developer Name *</Label>
                <Input
                  id="developerName"
                  value={assignData.developerName}
                  onChange={(e) => setAssignData({ ...assignData, developerName: e.target.value })}
                  placeholder="Enter developer name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={assignData.email}
                  onChange={(e) => setAssignData({ ...assignData, email: e.target.value })}
                  placeholder="developer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={assignData.contact}
                  onChange={(e) => setAssignData({ ...assignData, contact: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="expectedCompletion">Expected Completion Date *</Label>
                <Input
                  id="expectedCompletion"
                  type="date"
                  value={assignData.expectedCompletion}
                  onChange={(e) => setAssignData({ ...assignData, expectedCompletion: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={assignData.note}
                  onChange={(e) => setAssignData({ ...assignData, note: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button onClick={confirmAssign} className="w-full bg-[#3457D5]">
                Assign Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Update Progress Modal */}
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
              <DialogDescription>Update the project status and progress</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="progressNote">Progress Note</Label>
                <Textarea
                  id="progressNote"
                  value={updateData.progressNote}
                  onChange={(e) => setUpdateData({ ...updateData, progressNote: e.target.value })}
                  placeholder="Describe the current progress..."
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="deliveryFile">Delivery File/Link</Label>
                <Input
                  id="deliveryFile"
                  value={updateData.deliveryFile}
                  onChange={(e) => setUpdateData({ ...updateData, deliveryFile: e.target.value })}
                  placeholder="Upload link or file path"
                />
              </div>
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={updateData.comment}
                  onChange={(e) => setUpdateData({ ...updateData, comment: e.target.value })}
                  placeholder="Additional comments..."
                />
              </div>
              {updateData.status === "Completed" && (
                <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  Marking as completed will make this project visible to the user as Delivered.
                </div>
              )}
              <Button onClick={confirmUpdate} className="w-full bg-[#3457D5]">
                Update Progress
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Request</DialogTitle>
              <DialogDescription>This action cannot be undone. Enter password to confirm.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deletePassword">Password</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password"
                />
                <p className="mt-1 text-xs text-muted-foreground">Hint: delete123</p>
              </div>
              <Button onClick={confirmDelete} variant="destructive" className="w-full">
                Confirm Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
