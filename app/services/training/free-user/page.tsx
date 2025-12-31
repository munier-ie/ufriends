"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Download, Play, FileText, Video, Image as ImageIcon } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { ensureAbsoluteUrl } from "@/lib/utils"

interface Training {
  id: string
  category: string
  title: string
  description: string
  videoUrl?: string
  pdfUrl?: string
  fileUrl?: string
  fileType?: string
  fileName?: string
  createdAt: string
}

export default function FreeUserTrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTrainings = async () => {
      try {
        const res = await authFetch("/api/training?category=Free")
        if (res.ok) {
          const data = await res.json()
          setTrainings(data.trainings || [])
        }
      } catch (err) {
        console.error("Failed to load trainings:", err)
      } finally {
        setLoading(false)
      }
    }
    loadTrainings()
  }, [])

  const isNewTraining = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays < 7
  }

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="w-4 h-4" />
    if (fileType.startsWith("video/")) return <Video className="w-4 h-4" />
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-[#3457D5] mb-2">Free User Training</h1>
          <p className="text-gray-600 mb-8">
            Watch tutorials and read updates to learn how to use the UFriends platform.
          </p>
        </motion.div>

        {trainings.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl shadow-sm">
            <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Training Available</h3>
            <p className="text-gray-600">Check back later for new tutorials and updates.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training, index) => (
              <motion.div
                key={training.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="shadow-sm rounded-2xl p-3 hover:shadow-lg transition-shadow">
                  {training.videoUrl ? (
                    <div className="relative group">
                      <iframe
                        src={training.videoUrl}
                        className="w-full aspect-video rounded-xl"
                        allowFullScreen
                        title={training.title}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />
                    </div>
                  ) : training.fileUrl && training.fileType?.startsWith("video/") ? (
                    <div className="relative group">
                      <video
                        src={training.fileUrl}
                        controls
                        className="w-full aspect-video rounded-xl"
                      />
                    </div>
                  ) : training.fileUrl && training.fileType?.startsWith("image/") ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-full aspect-video rounded-xl overflow-hidden cursor-pointer relative group">
                          <img
                            src={training.fileUrl}
                            alt={training.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none">
                        <div className="flex items-center justify-center h-full w-full">
                          <img
                            src={training.fileUrl}
                            alt={training.title}
                            className="w-full h-full max-h-[90vh] object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-[#3457D5] to-[#CCCCFF] flex items-center justify-center">
                      <Play className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg leading-tight">{training.title}</h3>
                      {isNewTraining(training.createdAt) && (
                        <Badge className="bg-[#3457D5] text-white shrink-0">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{training.description}</p>
                    {(training.pdfUrl || (training.fileUrl && !training.fileType?.startsWith("video/") && !training.fileType?.startsWith("image/"))) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => window.open(ensureAbsoluteUrl(training.fileUrl || training.pdfUrl), "_blank")}
                      >
                        {getFileIcon(training.fileType)}
                        <span className="ml-2">Download Resource</span>
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

