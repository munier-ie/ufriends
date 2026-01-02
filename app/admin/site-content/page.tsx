"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { authFetch } from "@/lib/client-auth"
import { Save, Plus, Trash2, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

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

interface SiteContent {
    hero: HeroContent
    contact: ContactContent
    faqs: FaqItem[]
    social: SocialContent
    cta: CtaContent
    footer: FooterContent
}

export default function SiteContentPage() {
    const [content, setContent] = useState<SiteContent | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    useEffect(() => {
        loadContent()
    }, [])

    const loadContent = async () => {
        setLoading(true)
        try {
            const res = await authFetch("/api/admin/site-content")
            if (res.ok) {
                const data = await res.json()
                setContent(data)
            } else {
                toast.error("Failed to load content")
            }
        } catch (error) {
            console.error("Error loading content:", error)
            toast.error("Error loading content")
        } finally {
            setLoading(false)
        }
    }

    const saveSection = async (key: string, sectionContent: unknown) => {
        setSaving(key)
        try {
            const res = await authFetch("/api/admin/site-content", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, content: sectionContent }),
            })
            if (res.ok) {
                toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} saved successfully`)
            } else {
                toast.error("Failed to save")
            }
        } catch (error) {
            console.error("Error saving:", error)
            toast.error("Error saving content")
        } finally {
            setSaving(null)
        }
    }

    const seedDefaults = async () => {
        setSaving("seed")
        try {
            const res = await authFetch("/api/admin/site-content", { method: "POST" })
            if (res.ok) {
                toast.success("Default content seeded")
                loadContent()
            } else {
                toast.error("Failed to seed defaults")
            }
        } catch (error) {
            console.error("Error seeding:", error)
            toast.error("Error seeding defaults")
        } finally {
            setSaving(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!content) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No content found</p>
                <Button onClick={seedDefaults} disabled={saving === "seed"}>
                    {saving === "seed" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Initialize Default Content
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Site Content Management</h1>
                    <p className="text-muted-foreground">Manage dynamic homepage content</p>
                </div>
                <Button variant="outline" onClick={seedDefaults} disabled={saving === "seed"}>
                    {saving === "seed" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Reset to Defaults
                </Button>
            </div>

            <Tabs defaultValue="hero" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="hero">Hero</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="faqs">FAQs</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                    <TabsTrigger value="cta">CTA</TabsTrigger>
                    <TabsTrigger value="footer">Footer</TabsTrigger>
                </TabsList>

                {/* Hero Section */}
                <TabsContent value="hero">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hero Section</CardTitle>
                            <CardDescription>Edit the main hero section on the homepage</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="hero-title">Title</Label>
                                    <Input
                                        id="hero-title"
                                        value={content.hero.title}
                                        onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hero-highlight">Title Highlight Word</Label>
                                    <Input
                                        id="hero-highlight"
                                        value={content.hero.titleHighlight}
                                        onChange={(e) => setContent({ ...content, hero: { ...content.hero, titleHighlight: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hero-subtitle">Subtitle</Label>
                                <Textarea
                                    id="hero-subtitle"
                                    value={content.hero.subtitle}
                                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hero-download">Download App URL</Label>
                                <Input
                                    id="hero-download"
                                    value={content.hero.downloadAppUrl}
                                    placeholder="https://play.google.com/store/..."
                                    onChange={(e) => setContent({ ...content, hero: { ...content.hero, downloadAppUrl: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label>Stats</Label>
                                {content.hero.stats.map((stat, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={stat.value}
                                            placeholder="Value (e.g., 50K+)"
                                            onChange={(e) => {
                                                const newStats = [...content.hero.stats]
                                                newStats[index].value = e.target.value
                                                setContent({ ...content, hero: { ...content.hero, stats: newStats } })
                                            }}
                                        />
                                        <Input
                                            value={stat.label}
                                            placeholder="Label"
                                            onChange={(e) => {
                                                const newStats = [...content.hero.stats]
                                                newStats[index].label = e.target.value
                                                setContent({ ...content, hero: { ...content.hero, stats: newStats } })
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => saveSection("hero", content.hero)} disabled={saving === "hero"}>
                                {saving === "hero" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Hero
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contact Section */}
                <TabsContent value="contact">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>Edit contact details shown on the homepage and contact page</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contact-phone">Phone Display</Label>
                                    <Input
                                        id="contact-phone"
                                        value={content.contact.phone}
                                        onChange={(e) => setContent({ ...content, contact: { ...content.contact, phone: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact-phone-href">Phone Link (tel:...)</Label>
                                    <Input
                                        id="contact-phone-href"
                                        value={content.contact.phoneHref}
                                        onChange={(e) => setContent({ ...content, contact: { ...content.contact, phoneHref: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contact-email">Email</Label>
                                    <Input
                                        id="contact-email"
                                        type="email"
                                        value={content.contact.email}
                                        onChange={(e) => setContent({ ...content, contact: { ...content.contact, email: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact-whatsapp">WhatsApp Number</Label>
                                    <Input
                                        id="contact-whatsapp"
                                        value={content.contact.whatsappNumber}
                                        onChange={(e) => setContent({ ...content, contact: { ...content.contact, whatsappNumber: e.target.value, whatsappUrl: `https://wa.me/${e.target.value}` } })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="address-street">Street Address</Label>
                                    <Input
                                        id="address-street"
                                        value={content.contact.address.street}
                                        onChange={(e) => setContent({ ...content, contact: { ...content.contact, address: { ...content.contact.address, street: e.target.value } } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address-city">City</Label>
                                    <Input
                                        id="address-city"
                                        value={content.contact.address.city}
                                        onChange={(e) => setContent({ ...content, contact: { ...content.contact, address: { ...content.contact.address, city: e.target.value } } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address-country">Country</Label>
                                    <Input
                                        id="address-country"
                                        value={content.contact.address.country}
                                        onChange={(e) => setContent({ ...content, contact: { ...content.contact, address: { ...content.contact.address, country: e.target.value } } })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="support-hours">Support Hours</Label>
                                <Input
                                    id="support-hours"
                                    value={content.contact.supportHours}
                                    onChange={(e) => setContent({ ...content, contact: { ...content.contact, supportHours: e.target.value } })}
                                />
                            </div>
                            <Button onClick={() => saveSection("contact", content.contact)} disabled={saving === "contact"}>
                                {saving === "contact" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Contact
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FAQs Section */}
                <TabsContent value="faqs">
                    <Card>
                        <CardHeader>
                            <CardTitle>FAQ Management</CardTitle>
                            <CardDescription>Manage frequently asked questions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {content.faqs.map((faq, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">FAQ #{index + 1}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const newFaqs = content.faqs.filter((_, i) => i !== index)
                                                setContent({ ...content, faqs: newFaqs })
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Question</Label>
                                        <Input
                                            value={faq.question}
                                            onChange={(e) => {
                                                const newFaqs = [...content.faqs]
                                                newFaqs[index].question = e.target.value
                                                setContent({ ...content, faqs: newFaqs })
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Answer</Label>
                                        <Textarea
                                            value={faq.answer}
                                            rows={3}
                                            onChange={(e) => {
                                                const newFaqs = [...content.faqs]
                                                newFaqs[index].answer = e.target.value
                                                setContent({ ...content, faqs: newFaqs })
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setContent({ ...content, faqs: [...content.faqs, { question: "", answer: "" }] })
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add FAQ
                            </Button>
                            <div className="pt-4">
                                <Button onClick={() => saveSection("faqs", content.faqs)} disabled={saving === "faqs"}>
                                    {saving === "faqs" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save FAQs
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Social Section */}
                <TabsContent value="social">
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media Links</CardTitle>
                            <CardDescription>Edit social media URLs shown in the footer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="social-facebook">Facebook URL</Label>
                                    <Input
                                        id="social-facebook"
                                        value={content.social.facebook}
                                        onChange={(e) => setContent({ ...content, social: { ...content.social, facebook: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social-twitter">Twitter URL</Label>
                                    <Input
                                        id="social-twitter"
                                        value={content.social.twitter}
                                        onChange={(e) => setContent({ ...content, social: { ...content.social, twitter: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social-linkedin">LinkedIn URL</Label>
                                    <Input
                                        id="social-linkedin"
                                        value={content.social.linkedin}
                                        onChange={(e) => setContent({ ...content, social: { ...content.social, linkedin: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social-instagram">Instagram URL</Label>
                                    <Input
                                        id="social-instagram"
                                        value={content.social.instagram}
                                        onChange={(e) => setContent({ ...content, social: { ...content.social, instagram: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <Button onClick={() => saveSection("social", content.social)} disabled={saving === "social"}>
                                {saving === "social" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Social
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CTA Section */}
                <TabsContent value="cta">
                    <Card>
                        <CardHeader>
                            <CardTitle>Call to Action Section</CardTitle>
                            <CardDescription>Edit the CTA section content</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cta-title">Title</Label>
                                    <Input
                                        id="cta-title"
                                        value={content.cta.title}
                                        onChange={(e) => setContent({ ...content, cta: { ...content.cta, title: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cta-highlight">Title Highlight</Label>
                                    <Input
                                        id="cta-highlight"
                                        value={content.cta.titleHighlight}
                                        onChange={(e) => setContent({ ...content, cta: { ...content.cta, titleHighlight: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cta-subtitle">Subtitle</Label>
                                <Textarea
                                    id="cta-subtitle"
                                    value={content.cta.subtitle}
                                    onChange={(e) => setContent({ ...content, cta: { ...content.cta, subtitle: e.target.value } })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cta-primary">Primary Button Text</Label>
                                    <Input
                                        id="cta-primary"
                                        value={content.cta.primaryButtonText}
                                        onChange={(e) => setContent({ ...content, cta: { ...content.cta, primaryButtonText: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cta-secondary">Secondary Button Text</Label>
                                    <Input
                                        id="cta-secondary"
                                        value={content.cta.secondaryButtonText}
                                        onChange={(e) => setContent({ ...content, cta: { ...content.cta, secondaryButtonText: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <Button onClick={() => saveSection("cta", content.cta)} disabled={saving === "cta"}>
                                {saving === "cta" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save CTA
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Footer Section */}
                <TabsContent value="footer">
                    <Card>
                        <CardHeader>
                            <CardTitle>Footer Content</CardTitle>
                            <CardDescription>Edit footer text and descriptions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="footer-description">Description</Label>
                                <Textarea
                                    id="footer-description"
                                    value={content.footer.description}
                                    onChange={(e) => setContent({ ...content, footer: { ...content.footer, description: e.target.value } })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="footer-copyright">Copyright Text</Label>
                                    <Input
                                        id="footer-copyright"
                                        value={content.footer.copyright}
                                        onChange={(e) => setContent({ ...content, footer: { ...content.footer, copyright: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="footer-tagline">Tagline</Label>
                                    <Input
                                        id="footer-tagline"
                                        value={content.footer.tagline}
                                        onChange={(e) => setContent({ ...content, footer: { ...content.footer, tagline: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <Button onClick={() => saveSection("footer", content.footer)} disabled={saving === "footer"}>
                                {saving === "footer" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Footer
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
