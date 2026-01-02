"use client"

import { useState, useEffect } from "react"

interface HeroContent {
    title: string
    titleHighlight: string
    subtitle: string
    stats: { value: string; label: string }[]
    downloadAppUrl: string
}

interface ContactContent {
    phone: string
    phoneHref: string
    email: string
    whatsappNumber: string
    whatsappUrl: string
    address: {
        street: string
        city: string
        country: string
    }
    supportHours: string
}

interface FaqItem {
    question: string
    answer: string
}

interface SocialContent {
    facebook: string
    twitter: string
    linkedin: string
    instagram: string
}

interface CtaContent {
    title: string
    titleHighlight: string
    subtitle: string
    primaryButtonText: string
    secondaryButtonText: string
    badges: { color: string; text: string }[]
}

interface FooterContent {
    description: string
    copyright: string
    tagline: string
}

export interface SiteContent {
    hero: HeroContent
    contact: ContactContent
    faqs: FaqItem[]
    social: SocialContent
    cta: CtaContent
    footer: FooterContent
}

// Default content for SSR and fallback
const DEFAULT_CONTENT: SiteContent = {
    hero: {
        title: "Your Complete Financial Technology Partner",
        titleHighlight: "Financial",
        subtitle: "Experience seamless digital payments, bill management, and financial services all in one powerful platform. UFriends IT makes managing your finances simple, secure, and efficient.",
        stats: [
            { value: "50K+", label: "Active Users" },
            { value: "₦2B+", label: "Transactions" },
            { value: "99.9%", label: "Uptime" },
        ],
        downloadAppUrl: "",
    },
    contact: {
        phone: "+234-800-UFRIENDS",
        phoneHref: "tel:+2348001234567",
        email: "support@ufriendsit.com",
        whatsappNumber: "2348001234567",
        whatsappUrl: "https://wa.me/2348001234567",
        address: {
            street: "123 Technology Drive",
            city: "Victoria Island, Lagos",
            country: "Nigeria",
        },
        supportHours: "24/7",
    },
    faqs: [
        {
            question: "How secure are my transactions on UFriends IT?",
            answer: "We use bank-level security with 256-bit SSL encryption, multi-factor authentication, and comply with international security standards.",
        },
    ],
    social: {
        facebook: "#",
        twitter: "#",
        linkedin: "#",
        instagram: "#",
    },
    cta: {
        title: "Ready to Transform Your",
        titleHighlight: "Financial Experience?",
        subtitle: "Join over 50,000 users who trust UFriends IT for their financial technology needs.",
        primaryButtonText: "Create Account",
        secondaryButtonText: "Download App",
        badges: [
            { color: "green", text: "Free to get started" },
            { color: "blue", text: "No hidden fees" },
            { color: "purple", text: "24/7 support" },
        ],
    },
    footer: {
        description: "Your trusted partner for comprehensive financial technology solutions.",
        copyright: "© 2024 UFriends Information Technology. All rights reserved.",
        tagline: "Made with ❤️ in Nigeria",
    },
}

// Cache for site content
let cachedContent: SiteContent | null = null
let cacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useSiteContent() {
    const [content, setContent] = useState<SiteContent>(cachedContent || DEFAULT_CONTENT)
    const [loading, setLoading] = useState(!cachedContent)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Use cache if valid
        if (cachedContent && Date.now() - cacheTime < CACHE_DURATION) {
            setContent(cachedContent)
            setLoading(false)
            return
        }

        const fetchContent = async () => {
            try {
                const res = await fetch("/api/site-content")
                if (res.ok) {
                    const data = await res.json()
                    cachedContent = data
                    cacheTime = Date.now()
                    setContent(data)
                } else {
                    setError("Failed to load content")
                }
            } catch (err) {
                console.error("Error fetching site content:", err)
                setError("Error loading content")
            } finally {
                setLoading(false)
            }
        }

        fetchContent()
    }, [])

    return { content, loading, error }
}

// Export types for use in components
export type { HeroContent, ContactContent, FaqItem, SocialContent, CtaContent, FooterContent }
