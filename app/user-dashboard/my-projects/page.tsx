"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Code2, Eye, Download, Star, Clock, CheckCircle2, AlertCircle, FileCode } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
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
  progressNote?: string
}

interface AssignedProject {
  requestId: string
  developerName: string
  contact?: string
  expectedCompletion: string
  assignedBy: string
  assignedAt: string
}

interface ProjectFeedback {
  projectId: string
  rating: number
  comment: string
  submittedAt: string
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<SoftwareRequest[]>([])
  const [assignments, setAssignments] = useState<AssignedProject[]>([])
  const [selectedProject, setSelectedProject] = useState<SoftwareRequest | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRatingOpen, setIsRatingOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const resp = await authFetch("/api/software/requests")
      if (!resp.ok) {
        console.error("Failed to load projects", await resp.text())
        setProjects([])
        setAssignments([])
        return
      }
      const payload = await resp.json()
      const rawItems = (payload?.items || []) as any[]

      const toUiStatus = (s: string) => {
        switch ((s || "").toUpperCase()) {
          case "COMPLETED":
            return "Completed"
          case "PROCESSING":
            return "In Progress"
          case "FAILED":
            return "Rejected"
          default:
            return "Pending"
        }
      }

      const mappedProjects: SoftwareRequest[] = rawItems.map((r) => ({
        id: r.id,
        userId: r.userId,
        serviceType: r.serviceType,
        subType: r.subType,
        formData: r.formData || {},
        price: Number(r.price || 0),
        status: toUiStatus(r.status),
        submittedAt: r.submittedAt,
        completedAt: undefined,
        deliveryFile:
          Array.isArray(r.deliveryFiles) && r.deliveryFiles.length > 0 && r.deliveryFiles[0]?.fileUrl
            ? r.deliveryFiles[0].fileUrl
            : undefined,
        progressNote:
          Array.isArray(r.deliveryFiles) && r.deliveryFiles.length > 0 && r.deliveryFiles[0]?.note
            ? r.deliveryFiles[0].note
            : undefined,
      }))

      setProjects(mappedProjects)

      const mappedAssignments: AssignedProject[] = rawItems
        .filter((r) => !!r.assignment)
        .map((r) => ({
          requestId: r.id,
          developerName: r.assignment.developerName,
          contact: r.assignment.contact || undefined,
          expectedCompletion: r.assignment.assignedAt,
          assignedBy: r.assignment.assignedBy,
          assignedAt: r.assignment.assignedAt,
        }))

      setAssignments(mappedAssignments)
    } catch (e) {
      console.error("Error loading projects", e)
      setProjects([])
      setAssignments([])
    }
  }

  const getAssignment = (projectId: string) => {
    return assignments.find((a) => a.requestId === projectId)
  }

  const handleViewDetails = (project: SoftwareRequest) => {
    setSelectedProject(project)
    setIsDetailsOpen(true)
  }

  const handleRateProject = (project: SoftwareRequest) => {
    setSelectedProject(project)
    setIsRatingOpen(true)
  }

  const submitRating = () => {
    if (!selectedProject || rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      })
      return
    }

    const feedbackList = JSON.parse(localStorage.getItem("ufriends_project_feedback") || "[]")
    const newFeedback: ProjectFeedback = {
      projectId: selectedProject.id,
      rating,
      comment: feedback,
      submittedAt: new Date().toISOString(),
    }

    feedbackList.push(newFeedback)
    localStorage.setItem("ufriends_project_feedback", JSON.stringify(feedbackList))

    toast({
      title: "Thank You!",
      description: "Your feedback has been submitted successfully",
    })

    setIsRatingOpen(false)
    setRating(0)
    setFeedback("")
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      Pending: { variant: "secondary", icon: Clock },
      "In Progress": { variant: "default", icon: Code2 },
      Completed: { variant: "outline", icon: CheckCircle2 },
      Rejected: { variant: "destructive", icon: AlertCircle },
    }

    const { variant, icon: Icon } = config[status] || config.Pending

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getProgressStage = (status: string) => {
    const stages = ["Submitted", "Under Review", "In Progress", "Completed"]
    const currentIndex = status === "Pending" ? 0 : status === "In Progress" ? 2 : status === "Completed" ? 3 : 1
    return { stages, currentIndex }
  }

  const filterProjects = (filter: string) => {
    switch (filter) {
      case "in-progress":
        return projects.filter((p) => p.status === "In Progress")
      case "completed":
        return projects.filter((p) => p.status === "Completed")
      case "pending":
        return projects.filter((p) => p.status === "Pending")
      default:
        return projects
    }
  }

  const ProjectCard = ({ project }: { project: SoftwareRequest }) => {
    const assignment = getAssignment(project.id)

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} layout>
        <Card className="border-2 border-[#CCCCFF] hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg text-[#3457D5]">{project.formData.projectTitle}</CardTitle>
                <CardDescription className="mt-1">
                  <Badge variant="secondary" className="mr-2">
                    {project.subType}
                  </Badge>
                  {getStatusBadge(project.status)}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#3457D5]">₦{project.price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{new Date(project.submittedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment && (
              <div className="rounded-lg bg-[#CCCCFF]/20 p-3">
                <p className="text-sm font-medium text-[#3457D5]">Assigned to: {assignment.developerName}</p>
                <p className="text-xs text-muted-foreground">
                  Expected completion: {new Date(assignment.expectedCompletion).toLocaleDateString()}
                </p>
              </div>
            )}

            {project.progressNote && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900">Latest Update:</p>
                <p className="text-sm text-blue-800">{project.progressNote}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => handleViewDetails(project)} className="flex-1 bg-[#3457D5]">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
              {project.status === "Completed" && (
                <>
                  {project.deliveryFile && (
                    <Button variant="outline" onClick={() => window.open(ensureAbsoluteUrl(project.deliveryFile), "_blank")}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => handleRateProject(project)}>
                    <Star className="mr-2 h-4 w-4" />
                    Rate
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#CCCCFF]">
        <FileCode className="h-12 w-12 text-[#3457D5]" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-[#3457D5]">No Projects Yet</h3>
      <p className="mb-6 text-muted-foreground">You haven't requested any software development project yet.</p>
      <Button
        className="bg-[#3457D5]"
        onClick={() => (window.location.href = "/services/software-development/web-app")}
      >
        <Code2 className="mr-2 h-4 w-4" />
        Start a Project
      </Button>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3457D5]">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3457D5]">My Projects</h1>
              <p className="text-muted-foreground">Track your software development projects</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4 mb-6">
            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#3457D5]">{projects.length}</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {projects.filter((p) => p.status === "In Progress").length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {projects.filter((p) => p.status === "Completed").length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#CCCCFF]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {projects.filter((p) => p.status === "Pending").length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-white border-2 border-[#CCCCFF]">
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {projects.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="in-progress">
              {filterProjects("in-progress").length === 0 ? (
                <Card className="border-2 border-[#CCCCFF] p-12 text-center">
                  <p className="text-muted-foreground">No projects in progress</p>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {filterProjects("in-progress").map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {filterProjects("completed").length === 0 ? (
                <Card className="border-2 border-[#CCCCFF] p-12 text-center">
                  <p className="text-muted-foreground">No completed projects yet</p>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {filterProjects("completed").map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {filterProjects("pending").length === 0 ? (
                <Card className="border-2 border-[#CCCCFF] p-12 text-center">
                  <p className="text-muted-foreground">No pending projects</p>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {filterProjects("pending").map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Project Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Project Details</DialogTitle>
              <DialogDescription>Complete information about your project</DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#3457D5] mb-2">{selectedProject.formData.projectTitle}</h3>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{selectedProject.subType}</Badge>
                    {getStatusBadge(selectedProject.status)}
                  </div>
                </div>

                {/* Progress Timeline */}
                <Card className="border-2 border-[#CCCCFF]">
                  <CardHeader>
                    <CardTitle className="text-sm">Project Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {getProgressStage(selectedProject.status).stages.map((stage, index) => {
                        const isActive = index <= getProgressStage(selectedProject.status).currentIndex
                        return (
                          <div key={stage} className="flex flex-1 items-center">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "bg-[#3457D5] text-white" : "bg-gray-200 text-gray-500"
                                  }`}
                              >
                                {index + 1}
                              </div>
                              <p className={`mt-2 text-xs ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                                {stage}
                              </p>
                            </div>
                            {index < getProgressStage(selectedProject.status).stages.length - 1 && (
                              <div
                                className={`h-1 flex-1 ${isActive ? "bg-[#3457D5]" : "bg-gray-200"}`}
                                style={{ marginTop: "-20px" }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold">Description</Label>
                    <p className="text-sm mt-1">
                      {selectedProject.formData.projectDescription ||
                        selectedProject.formData.description ||
                        selectedProject.formData.problemDescription}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Features</Label>
                    <p className="text-sm mt-1">
                      {selectedProject.formData.featureRequirements ||
                        selectedProject.formData.features ||
                        selectedProject.formData.featureList}
                    </p>
                  </div>
                </div>

                {getAssignment(selectedProject.id) && (
                  <Card className="border-2 border-[#CCCCFF] bg-[#CCCCFF]/10">
                    <CardHeader>
                      <CardTitle className="text-sm">Developer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Developer</Label>
                        <p className="font-semibold">{getAssignment(selectedProject.id)?.developerName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Expected Completion</Label>
                        <p>
                          {getAssignment(selectedProject.id)?.expectedCompletion &&
                            new Date(getAssignment(selectedProject.id)!.expectedCompletion).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedProject.progressNote && (
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-sm text-blue-900">Progress Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-blue-800">{selectedProject.progressNote}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedProject.deliveryFile && (
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-sm text-green-900">Delivery Evidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => window.open(ensureAbsoluteUrl(selectedProject.deliveryFile), "_blank")}
                        className="bg-green-600"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Delivery File
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-muted-foreground">Budget Range</Label>
                    <p className="font-semibold">{selectedProject.formData.budgetRange}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Project Cost</Label>
                    <p className="text-xl font-bold text-[#3457D5]">₦{selectedProject.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rating Modal */}
        <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate This Project</DialogTitle>
              <DialogDescription>Share your experience with this project</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Your Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                      <Star
                        className={`h-10 w-10 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <Button onClick={submitRating} className="w-full bg-[#3457D5]">
                Submit Rating
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
