"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { authFetch } from "@/lib/client-auth"

interface PopupMessage {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  includeUserName: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface DashboardPopupMessageProps {
  userName?: string
}

export function DashboardPopupMessage({ userName = "User" }: DashboardPopupMessageProps) {
  const [messages, setMessages] = useState<PopupMessage[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    // Wait for userName to be properly loaded (not default "User") before showing popups
    // This prevents showing "{userName}" literally when the API hasn't responded yet
    if (hasLoaded) return

    const loadMessages = async () => {
      try {
        const res = await authFetch("/api/popup-messages?activeOnly=true")
        if (res.ok) {
          const data = await res.json()
          const activeMessages = data.messages || []
          setMessages(activeMessages)
          // Only show popup after we have messages and a real user name
          if (activeMessages.length > 0) {
            // If any message includes userName, wait a bit for userName prop to update
            const hasUserNameMessage = activeMessages.some((m: PopupMessage) => m.includeUserName)
            if (hasUserNameMessage && userName === "User") {
              // Retry after a short delay to allow parent to fetch user name
              setTimeout(() => {
                setShowPopup(true)
                setHasLoaded(true)
              }, 1000)
            } else {
              setShowPopup(true)
              setHasLoaded(true)
            }
          } else {
            setHasLoaded(true)
          }
        }
      } catch (err) {
        console.error("Failed to load popup messages:", err)
        setHasLoaded(true)
      }
    }
    loadMessages()
  }, [userName, hasLoaded])


  const currentMessage = messages[currentMessageIndex]

  if (!currentMessage || dismissedMessages.includes(currentMessage.id)) {
    return null
  }

  const getIcon = () => {
    switch (currentMessage.type) {
      case "info":
        return <Info className="w-6 h-6 text-blue-600" />
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-600" />
      default:
        return <Info className="w-6 h-6 text-blue-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (currentMessage.type) {
      case "info":
        return "bg-blue-50 border-blue-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  const getTextColor = () => {
    switch (currentMessage.type) {
      case "info":
        return "text-blue-900"
      case "warning":
        return "text-yellow-900"
      case "success":
        return "text-green-900"
      case "error":
        return "text-red-900"
      default:
        return "text-blue-900"
    }
  }

  const handleDismiss = () => {
    setDismissedMessages([...dismissedMessages, currentMessage.id])
    if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1)
    } else {
      setShowPopup(false)
    }
  }

  const handleNext = () => {
    if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1)
    } else {
      setShowPopup(false)
    }
  }

  const messageContent = currentMessage.includeUserName
    ? currentMessage.message.replace("{userName}", userName)
    : currentMessage.message

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className={`max-w-md border-2 ${getBackgroundColor()}`}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle className={getTextColor()}>{currentMessage.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className={`${getTextColor()} text-sm leading-relaxed`}>{messageContent}</div>

        {messages.length > 1 && (
          <div className="flex gap-1 justify-center py-2">
            {messages.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${index === currentMessageIndex ? "bg-[#3457D5]" : "bg-gray-300"
                  }`}
              />
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDismiss}>
            Dismiss
          </Button>
          {currentMessageIndex < messages.length - 1 && (
            <Button className="flex-1 bg-[#3457D5] hover:bg-[#3457D5]/90" onClick={handleNext}>
              Next
            </Button>
          )}
          {currentMessageIndex === messages.length - 1 && (
            <Button className="flex-1 bg-[#3457D5] hover:bg-[#3457D5]/90" onClick={() => setShowPopup(false)}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

