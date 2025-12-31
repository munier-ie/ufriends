export interface PopupMessage {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  includeUserName: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "admin_popup_messages"

export function getPopupMessages(): PopupMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error reading popup messages:", error)
    return []
  }
}

export function savePopupMessages(messages: PopupMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch (error) {
    console.error("Error saving popup messages:", error)
  }
}

export function addPopupMessage(message: Omit<PopupMessage, "id" | "createdAt" | "updatedAt">): PopupMessage {
  const messages = getPopupMessages()
  const newMessage: PopupMessage = {
    ...message,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  messages.push(newMessage)
  savePopupMessages(messages)
  return newMessage
}

export function updatePopupMessage(id: string, updates: Partial<PopupMessage>): PopupMessage | null {
  const messages = getPopupMessages()
  const index = messages.findIndex((m) => m.id === id)
  if (index === -1) return null

  const updated = {
    ...messages[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  messages[index] = updated
  savePopupMessages(messages)
  return updated
}

export function deletePopupMessage(id: string): boolean {
  const messages = getPopupMessages()
  const filtered = messages.filter((m) => m.id !== id)
  if (filtered.length === messages.length) return false
  savePopupMessages(filtered)
  return true
}

export function getActivePopupMessages(): PopupMessage[] {
  return getPopupMessages().filter((m) => m.isActive)
}
