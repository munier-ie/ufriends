"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, RotateCcw, Check, Smile, Eye, AlertCircle, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  capturedImage: string | null
}

export function CameraCapture({ onCapture, capturedImage }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [livenessStep, setLivenessStep] = useState<"smile" | "blink" | "ready">("smile")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraErrorDetail, setCameraErrorDetail] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  const enumerateCameras = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      const cams = list.filter((d) => d.kind === "videoinput")
      setDevices(cams)
      if (!selectedDeviceId && cams.length > 0) {
        setSelectedDeviceId(cams[0].deviceId)
      }
    } catch (err) {
      console.warn("[v0] Unable to list cameras:", err)
    }
  }

  const startCamera = async () => {
    setCameraError(null)
    setCameraErrorDetail(null)
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: 640, height: 480 }
          : { facingMode: "user", width: 640, height: 480 },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCameraActive(true)
        setLivenessStep("smile")
      }

      await enumerateCameras()
    } catch (error: any) {
      console.error("[v0] Error accessing camera:", error)

      // Attempt a safe fallback without constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream
          setStream(fallbackStream)
          setIsCameraActive(true)
          setLivenessStep("smile")
        }
        await enumerateCameras()
        return
      } catch (fallbackErr: any) {
        console.error("[v0] Fallback camera access failed:", fallbackErr)
        setCameraErrorDetail(`${fallbackErr?.name ?? "Error"}: ${fallbackErr?.message ?? "Unknown error"}`)
      }

      let errorMessage = "Unable to access camera. Please try the following:"

      if (error.name === "NotAllowedError") {
        errorMessage = "Camera access was denied. Please:"
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found. Please:"
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is being used by another application. Please:"
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Camera doesn't support the required settings. Please:"
      }

      setCameraError(errorMessage)
      setCameraErrorDetail(`${error?.name ?? "Error"}: ${error?.message ?? "Unknown error"}`)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsCameraActive(false)
      setLivenessStep("smile")
      setCountdown(null)
    }
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    if (isCameraActive) {
      stopCamera()
      await startCamera()
    }
  }

  const handleLivenessCheck = () => {
    if (livenessStep === "smile") {
      setTimeout(() => {
        setLivenessStep("blink")
      }, 1500)
    } else if (livenessStep === "blink") {
      setTimeout(() => {
        setLivenessStep("ready")
        startCountdown()
      }, 1500)
    }
  }

  const startCountdown = () => {
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval)
          capturePhoto()
          return null
        }
        return prev ? prev - 1 : null
      })
    }, 1000)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        onCapture(imageData)
        stopCamera()
      }
    }
  }

  const retake = () => {
    onCapture("")
    setCameraError(null)
    setCameraErrorDetail(null)
    startCamera()
  }

  useEffect(() => {
    if (isCameraActive && livenessStep !== "ready") {
      const timer = setTimeout(() => {
        handleLivenessCheck()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCameraActive, livenessStep])

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden bg-black">
        <div className="aspect-[4/3] flex items-center justify-center">
          {!isCameraActive && !capturedImage && !cameraError && (
            <div className="text-center p-8">
              <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-white mb-4">Click below to start camera</p>
              <Button onClick={startCamera} size="lg" className="bg-primary hover:bg-primary/90">
                <Camera className="mr-2 h-5 w-5" />
                Start Camera
              </Button>
            </div>
          )}

          {cameraError && (
            <div className="text-center p-8 max-w-md">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-white text-lg font-semibold mb-2">Camera Access Issue</h3>
              <p className="text-gray-300 mb-2">{cameraError}</p>
              {cameraErrorDetail && (
                <p className="text-xs text-gray-500 mb-4">Details: {cameraErrorDetail}</p>
              )}
              <div className="text-left text-sm text-gray-400 mb-6 space-y-2">
                <p>• Click the lock icon → Reset permissions → Reload</p>
                <p>• Allow camera permissions in your browser</p>
                <p>• Close other apps using the camera</p>
                <p>• Refresh the page and try again</p>
                <p>• Check if your camera is working in other apps</p>
              </div>
              <div className="space-y-2">
                <Button onClick={startCamera} size="lg" className="bg-primary hover:bg-primary/90 w-full">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="lg" 
                  className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          )}

          {isCameraActive && !capturedImage && (
            <div className="relative w-full h-full">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {/* Circular mask overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <motion.div
                    className="w-64 h-64 rounded-full border-4 border-primary"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="absolute inset-0 rounded-full border-8 border-black/50" />
                </div>
              </div>

              {/* Liveness instructions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={livenessStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-8 left-0 right-0 text-center"
                >
                  <div className="inline-block bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full">
                    {livenessStep === "smile" && (
                      <div className="flex items-center gap-2 text-white">
                        <Smile className="h-5 w-5" />
                        <span className="font-medium">Please smile</span>
                      </div>
                    )}
                    {livenessStep === "blink" && (
                      <div className="flex items-center gap-2 text-white">
                        <Eye className="h-5 w-5" />
                        <span className="font-medium">Now blink your eyes</span>
                      </div>
                    )}
                    {livenessStep === "ready" && countdown && (
                      <div className="text-white">
                        <span className="text-3xl font-bold">{countdown}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Alignment guide text */}
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black/70 backdrop-blur-sm inline-block px-4 py-2 rounded-full">
                  Align your face in the circle
                </p>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {capturedImage && (
            <div className="relative w-full h-full">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Captured</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Camera selector (shown when active and multiple cameras available) */}
      {isCameraActive && devices.length > 1 && (
        <div>
          <Select value={selectedDeviceId ?? undefined} onValueChange={(v) => switchCamera(v)}>
            <SelectTrigger className="w-full bg-black text-white border-gray-700">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((d, idx) => (
                <SelectItem key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${idx + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {capturedImage && (
        <div className="flex gap-2">
          <Button onClick={retake} variant="outline" className="flex-1 bg-transparent">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Photo
          </Button>
        </div>
      )}

      {isCameraActive && (
        <Button onClick={stopCamera} variant="outline" className="w-full bg-transparent">
          Cancel
        </Button>
      )}
    </div>
  )
}
