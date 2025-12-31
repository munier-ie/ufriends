export interface Training {
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

export interface UserSubscription {
  userId: string
  isPremium: boolean
  activatedAt: string
}

const TRAININGS_KEY = "ufriends_trainings"
const SUBSCRIPTION_KEY = "ufriends_user_subscription"

export function getTrainings(): Training[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(TRAININGS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveTraining(training: Omit<Training, "id" | "createdAt">): Training {
  const trainings = getTrainings()
  const newTraining: Training = {
    ...training,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  trainings.push(newTraining)
  localStorage.setItem(TRAININGS_KEY, JSON.stringify(trainings))
  return newTraining
}

export function updateTraining(id: string, updates: Partial<Training>): void {
  const trainings = getTrainings()
  const index = trainings.findIndex((t) => t.id === id)
  if (index !== -1) {
    trainings[index] = { ...trainings[index], ...updates }
    localStorage.setItem(TRAININGS_KEY, JSON.stringify(trainings))
  }
}

export function deleteTraining(id: string): void {
  const trainings = getTrainings()
  const filtered = trainings.filter((t) => t.id !== id)
  localStorage.setItem(TRAININGS_KEY, JSON.stringify(filtered))
}

export function getTrainingsByCategory(category: Training["category"]): Training[] {
  return getTrainings().filter((t) => t.category === category)
}

export function getUserSubscription(): UserSubscription {
  if (typeof window === "undefined") {
    return { userId: "u_001", isPremium: false, activatedAt: "" }
  }
  const data = localStorage.getItem(SUBSCRIPTION_KEY)
  return data ? JSON.parse(data) : { userId: "u_001", isPremium: false, activatedAt: "" }
}

export function setUserSubscription(subscription: UserSubscription): void {
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription))
}

export function isNewTraining(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays < 7
}
