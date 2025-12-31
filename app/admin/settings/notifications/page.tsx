"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit2, Trash2, Eye, Loader2 } from "lucide-react"
import { authFetch } from "@/lib/client-auth"
import { toast } from "sonner"

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

export default function NotificationSettingsPage() {
  const [popupMessages, setPopupMessages] = useState<PopupMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<PopupMessage | null>(null)
  const [formData, setFormData] = useState<{ title: string; message: string; type: PopupMessage['type']; includeUserName: boolean }>({
    title: "",
    message: "",
    type: "info",
    includeUserName: false,
  })

  const loadMessages = async () => {
    try {
      const res = await authFetch("/api/popup-messages")
      if (res.ok) {
        const data = await res.json()
        setPopupMessages(data.messages || [])
      }
    } catch (err) {
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  const handleCreateMessage = async () => {
    if (!formData.title || !formData.message) return

    try {
      const res = await authFetch("/api/popup-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", message: { ...formData, isActive: true } }),
      })
      if (res.ok) {
        const data = await res.json()
        setPopupMessages(data.messages || [])
        setFormData({ title: "", message: "", type: "info", includeUserName: false })
        setShowCreateDialog(false)
        toast.success("Message created")
      }
    } catch (err) {
      toast.error("Failed to create message")
    }
  }

  const handleUpdateMessage = async () => {
    if (!selectedMessage || !formData.title || !formData.message) return

    try {
      const res = await authFetch("/api/popup-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: selectedMessage.id, updates: formData }),
      })
      if (res.ok) {
        const data = await res.json()
        setPopupMessages(data.messages || [])
        setShowEditDialog(false)
        setSelectedMessage(null)
        toast.success("Message updated")
      }
    } catch (err) {
      toast.error("Failed to update message")
    }
  }

  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await authFetch("/api/popup-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      })
      if (res.ok) {
        const data = await res.json()
        setPopupMessages(data.messages || [])
        toast.success("Message deleted")
      }
    } catch (err) {
      toast.error("Failed to delete message")
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const res = await authFetch("/api/popup-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id }),
      })
      if (res.ok) {
        const data = await res.json()
        setPopupMessages(data.messages || [])
      }
    } catch (err) {
      toast.error("Failed to toggle message")
    }
  }

  const handleEditClick = (message: PopupMessage) => {
    setSelectedMessage(message)
    setFormData({
      title: message.title,
      message: message.message,
      type: message.type,
      includeUserName: message.includeUserName,
    })
    setShowEditDialog(true)
  }

  const handlePreviewClick = (message: PopupMessage) => {
    setSelectedMessage(message)
    setShowPreviewDialog(true)
  }


  const getTypeColor = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-700"
      case "warning":
        return "bg-yellow-100 text-yellow-700"
      case "success":
        return "bg-green-100 text-green-700"
      case "error":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
          <p className="text-muted-foreground mt-1">Manage popup messages shown to users on dashboard access</p>
        </div>
        <Button className="bg-[#3457D5] hover:bg-[#2a4ab8]" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Message
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Total Messages</p>
              <p className="text-3xl font-bold text-[#3457D5]">{popupMessages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Active Messages</p>
              <p className="text-3xl font-bold text-green-600">{popupMessages.filter((m) => m.isActive).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">With User Name</p>
              <p className="text-3xl font-bold text-[#CCCCFF]">
                {popupMessages.filter((m) => m.includeUserName).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Popup Messages</CardTitle>
          <CardDescription>All notification messages displayed to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popupMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No popup messages created yet</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setShowCreateDialog(true)}>
                  Create First Message
                </Button>
              </div>
            ) : (
              popupMessages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{message.title}</h3>
                        <Badge className={getTypeColor(message.type)}>{message.type}</Badge>
                        {message.includeUserName && (
                          <Badge variant="outline" className="bg-blue-50">
                            Includes User Name
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={message.isActive} onCheckedChange={() => handleToggleActive(message.id)} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(message.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handlePreviewClick(message)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(message)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteMessage(message.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Popup Message</DialogTitle>
            <DialogDescription>Create a new notification message for users</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Message Title</Label>
              <Input
                id="title"
                placeholder="e.g., Welcome Back!"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                placeholder="Enter the message content..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {"{userName}"} to include the user's name in the message
              </p>
            </div>

            <div>
              <Label htmlFor="type">Message Type</Label>
              <select
                id="type"
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PopupMessage['type'] })}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.includeUserName}
                onCheckedChange={(checked) => setFormData({ ...formData, includeUserName: checked })}
              />
              <Label className="cursor-pointer">Include user's name in message</Label>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className={`p-3 rounded ${getTypeColor(formData.type)}`}>
                <p className="font-semibold">{formData.title || "Message Title"}</p>
                <p className="text-sm mt-1">{formData.message || "Message content will appear here..."}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#3457D5] hover:bg-[#2a4ab8]" onClick={handleCreateMessage}>
                Create Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Popup Message</DialogTitle>
            <DialogDescription>Update the notification message</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Message Title</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Welcome Back!"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-message">Message Content</Label>
              <Textarea
                id="edit-message"
                placeholder="Enter the message content..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-type">Message Type</Label>
              <select
                id="edit-type"
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PopupMessage['type'] })}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.includeUserName}
                onCheckedChange={(checked) => setFormData({ ...formData, includeUserName: checked })}
              />
              <Label className="cursor-pointer">Include user's name in message</Label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#3457D5] hover:bg-[#2a4ab8]" onClick={handleUpdateMessage}>
                Update Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
            <DialogDescription>How this message will appear to users</DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className={`p-6 rounded-lg ${getTypeColor(selectedMessage.type)}`}>
                <p className="font-bold text-lg mb-2">{selectedMessage.title}</p>
                <p className="text-sm">
                  {selectedMessage.includeUserName
                    ? selectedMessage.message.replace("{userName}", "John Doe")
                    : selectedMessage.message}
                </p>
              </div>

              <div className="bg-muted p-3 rounded text-xs space-y-1">
                <p>
                  <span className="font-medium">Type:</span> {selectedMessage.type}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {selectedMessage.isActive ? "Active" : "Inactive"}
                </p>
                <p>
                  <span className="font-medium">Include User Name:</span>{" "}
                  {selectedMessage.includeUserName ? "Yes" : "No"}
                </p>
              </div>

              <Button className="w-full" onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
