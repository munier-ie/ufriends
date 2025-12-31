"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Lock, Play, Video, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import {
  getTrainingsByCategory,
  getUserSubscription,
  setUserSubscription,
  isNewTraining,
  type Training,
} from "@/lib/training-storage"
import { useToast } from "@/hooks/use-toast"
import useDynamicPricing from "@/hooks/useDynamicPricing"
import { PinPrompt } from "@/components/PinPrompt"
import { handleServiceError } from "@/lib/service-utils"
import { ensureAbsoluteUrl } from "@/lib/utils"

export default function NINModificationTrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const { price: upgradePrice, isLoading: priceLoading, submitService } = useDynamicPricing(
    "training",
    "nin-modification",
    "basic",
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    setTimeout(() => {
      const subscription = getUserSubscription()
      setIsPremium(subscription.isPremium)
      const data = getTrainingsByCategory("NIN")
      setTrainings(data)
      setLoading(false)
    }, 500)
  }, [])

  const handleUpgrade = () => {
    setPendingPayload({
      amount: Number(upgradePrice || 0),
      idempotencyKey: crypto.randomUUID(),
      category: "training",
      action: "nin-modification"
    })
    setIsPinPromptOpen(true)
  }

  const handlePinConfirm = async (pin: string) => {
    setIsPinPromptOpen(false)
    setIsSubmitting(true)

    try {
      const resp = await submitService({ ...pendingPayload, pin })

      if (!resp.ok) {
        handleServiceError(resp, toast, "Upgrade Failed")
        return
      }

      const subscription = {
        userId: "u_001",
        isPremium: true,
        activatedAt: new Date().toISOString(),
      }
      setUserSubscription(subscription)
      setIsPremium(true)
      toast({
        title: "Success!",
        description: "You now have Premium Access!",
      })
    } catch (err: any) {
      toast({ title: "Upgrade Error", description: err.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center p-10 rounded-2xl shadow-lg max-w-md">
            <div className="w-20 h-20 rounded-full bg-[#CCCCFF] flex items-center justify-center mx-auto mb-4">
              <Lock size={40} className="text-[#3457D5]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Premium Access Required</h2>
            <p className="text-sm text-gray-600 mb-6">
              Upgrade to access NIN modification training with correction guides and sample affidavit formats.
            </p>
            <Button onClick={handleUpgrade} disabled={isSubmitting || priceLoading} className="bg-[#3457D5] hover:bg-[#2a46b0] text-white">
              {isSubmitting ? "Processing..." : "Upgrade Now"}
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3] p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-[#3457D5]">NIN Modification Training</h1>
            <Badge className="bg-gradient-to-r from-[#3457D5] to-[#CCCCFF] text-white">Premium</Badge>
          </div>
          <p className="text-gray-600 mb-8">
            Learn the NIN correction process with detailed guides, screenshots, and sample affidavit formats.
          </p>
        </motion.div>

        {trainings.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl shadow-sm">
            <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Training Available</h3>
            <p className="text-gray-600">Check back later for NIN modification tutorials.</p>
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
                        <Download className="w-4 h-4 mr-2" />
                        Download Guide
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={() => setIsPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        isLoading={isSubmitting}
      />
    </div>
  )
}
