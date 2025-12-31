import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ensureAbsoluteUrl(url: string | undefined): string {
  if (!url) return ""
  const trimmed = url.trim()
  if (!trimmed) return ""
  // If it already has a protocol or is a valid internal relative path, return as is
  if (/^(?:[a-z]+:)?\/\//i.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return trimmed
  }
  // Otherwise prefix with https://
  return `https://${trimmed}`
}
