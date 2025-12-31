"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Trash2, Edit, Video, Upload, FileText, Image, Loader2 } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { ensureAbsoluteUrl } from "@/lib/utils"

interface Training {
  id: string
  category: "Free" | "Premium" | "CAC" | "NIN" | "BVN" | "Agency"
  title: string
  description: string
  videoUrl?: string
  pdfUrl?: string
  fileUrl?: string
  fileType?: string
  fileName?: string
  createdAt: string
}

export default function TrainingManagerPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    category: "Free" as Training["category"],
    title: "",
    description: "",
    videoUrl: "",
    pdfUrl: "",
    fileUrl: "",
    fileType: "",
    fileName: "",
  })

  useEffect(() => {
    loadTrainings()
  }, [])

  const loadTrainings = async () => {
    try {
      const res = await authFetch("/api/training")
      if (res.ok) {
        const data = await res.json()
        setTrainings(data.trainings || [])
      }
    } catch (err) {
      toast.error("Failed to load trainings")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append("file", file)

      const res = await authFetch("/api/training/upload", {
        method: "POST",
        body: formDataObj,
      })

      const data = await res.json()
      if (res.ok) {
        setFormData({
          ...formData,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileName: data.fileName,
        })
        toast.success("File uploaded successfully")
      } else {
        toast.error(data.error || "Upload failed")
      }
    } catch (err) {
      toast.error("Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const res = await authFetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? {
              action: "update",
              id: editingId,
              updates: {
                ...formData,
                pdfUrl: formData.pdfUrl ? ensureAbsoluteUrl(formData.pdfUrl) : "",
                videoUrl: formData.videoUrl ? ensureAbsoluteUrl(formData.videoUrl) : "",
              },
            }
            : {
              action: "create",
              training: {
                ...formData,
                pdfUrl: formData.pdfUrl ? ensureAbsoluteUrl(formData.pdfUrl) : "",
                videoUrl: formData.videoUrl ? ensureAbsoluteUrl(formData.videoUrl) : "",
              },
            }
        ),
      })

      if (res.ok) {
        const data = await res.json()
        setTrainings(data.trainings || [])
        toast.success(editingId ? "Training updated" : "Training uploaded")
        resetForm()
      } else {
        toast.error("Failed to save training")
      }
    } catch (err) {
      toast.error("Failed to save training")
    }
  }

  const resetForm = () => {
    setFormData({
      category: "Free",
      title: "",
      description: "",
      videoUrl: "",
      pdfUrl: "",
      fileUrl: "",
      fileType: "",
      fileName: "",
    })
    setEditingId(null)
    setIsOpen(false)
  }

  const handleEdit = (training: Training) => {
    setFormData({
      category: training.category,
      title: training.title,
      description: training.description,
      videoUrl: training.videoUrl || "",
      pdfUrl: training.pdfUrl || "",
      fileUrl: training.fileUrl || "",
      fileType: training.fileType || "",
      fileName: training.fileName || "",
    })
    setEditingId(training.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training?")) return

    try {
      const res = await authFetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      })

      if (res.ok) {
        const data = await res.json()
        setTrainings(data.trainings || [])
        toast.success("Training deleted")
      }
    } catch (err) {
      toast.error("Failed to delete")
    }
  }

  const getCategoryColor = (category: Training["category"]) => {
    const colors = {
      Free: "bg-green-500",
      Premium: "bg-[#3457D5]",
      CAC: "bg-purple-500",
      NIN: "bg-blue-500",
      BVN: "bg-orange-500",
      Agency: "bg-pink-500",
    }
    return colors[category]
  }

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="w-4 h-4" />
    if (fileType.startsWith("video/")) return <Video className="w-4 h-4" />
    if (fileType.startsWith("image/")) return <Image className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#3457D5] mb-2">Training Manager</h1>
            <p className="text-gray-600">Upload and manage training content for users</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3457D5] hover:bg-[#2a46b0] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Training
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Training" : "Add New Training"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as Training["category"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="CAC">CAC Registration</SelectItem>
                      <SelectItem value="NIN">NIN Modification</SelectItem>
                      <SelectItem value="BVN">BVN Modification</SelectItem>
                      <SelectItem value="Agency">Agency Updates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Training Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., How to Register a Company"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the training content"
                    rows={3}
                    required
                  />
                </div>

                {/* File Upload Section */}
                <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                  <Label>Upload File (Video, PDF, Image, Document)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                  {formData.fileName && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                      {getFileIcon(formData.fileType)}
                      <span>{formData.fileName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="videoUrl">Or Video URL (YouTube embed)</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>

                <div>
                  <Label htmlFor="pdfUrl">Or Resource URL (External link)</Label>
                  <Input
                    id="pdfUrl"
                    value={formData.pdfUrl}
                    onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                    placeholder="https://example.com/resource.pdf"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-[#3457D5] hover:bg-[#2a46b0] text-white">
                    {editingId ? "Update Training" : "Upload Training"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {trainings.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl shadow-sm">
            <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Training Content</h3>
            <p className="text-gray-600 mb-4">Start by adding your first training video or tutorial</p>
            <Button onClick={() => setIsOpen(true)} className="bg-[#3457D5] hover:bg-[#2a46b0] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Training
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training, index) => (
              <motion.div
                key={training.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="shadow-sm rounded-2xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${getCategoryColor(training.category)} text-white`}>{training.category}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(training)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(training.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {training.videoUrl ? (
                    <div className="w-full aspect-video rounded-xl bg-gray-200 mb-3 overflow-hidden">
                      <iframe src={training.videoUrl} className="w-full h-full" title={training.title} />
                    </div>
                  ) : training.fileUrl && training.fileType?.startsWith("video/") ? (
                    <div className="w-full aspect-video rounded-xl bg-gray-200 mb-3 overflow-hidden">
                      <video src={training.fileUrl} controls className="w-full h-full" />
                    </div>
                  ) : training.fileUrl && training.fileType?.startsWith("image/") ? (
                    <div className="w-full aspect-video rounded-xl bg-gray-200 mb-3 overflow-hidden">
                      <img src={training.fileUrl} alt={training.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-[#3457D5] to-[#CCCCFF] flex items-center justify-center mb-3">
                      {training.fileUrl ? getFileIcon(training.fileType) : <Video className="w-12 h-12 text-white" />}
                    </div>
                  )}

                  <h3 className="font-semibold text-lg mb-2">{training.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{training.description}</p>
                  {training.fileName && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      {getFileIcon(training.fileType)}
                      {training.fileName}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {new Date(training.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

