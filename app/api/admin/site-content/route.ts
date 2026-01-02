"use strict";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";

// Default content structure for seeding
const DEFAULT_CONTENT = {
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
            answer: "We use bank-level security with 256-bit SSL encryption, multi-factor authentication, and comply with international security standards. All transactions are monitored 24/7 for fraud prevention, and your personal information is never shared with third parties.",
        },
        {
            question: "What are the transaction limits and fees?",
            answer: "Transaction limits vary by service type and account verification level. Basic accounts have daily limits of ₦500,000, while verified accounts can transact up to ₦5,000,000 daily. Our fees are competitive and transparent - airtime purchases have no fees, while bill payments have a flat ₦50 convenience fee.",
        },
        {
            question: "How long do transactions take to process?",
            answer: "Most transactions are processed instantly, including airtime purchases, data bundles, and bill payments. Bank transfers typically take 1-5 minutes, while BVN and NIN verification services are completed within 24 hours during business days.",
        },
        {
            question: "Can I get a refund if something goes wrong?",
            answer: "Yes, we have a comprehensive refund policy. Failed transactions are automatically reversed within 24 hours. For service-related issues, contact our support team with your transaction reference, and we'll resolve it within 48 hours. Refunds for successful transactions depend on the service provider's policy.",
        },
        {
            question: "Do you offer customer support?",
            answer: "Our customer support team is available 24/7 through multiple channels: in-app chat, email (support@ufriendsit.com), phone (+234-800-UFRIENDS), and WhatsApp. We also have a comprehensive help center with guides and tutorials.",
        },
        {
            question: "How do I verify my account for higher limits?",
            answer: "Account verification is simple and secure. Upload a valid government-issued ID (NIN, driver's license, or passport), provide your BVN, and take a selfie for identity confirmation. Verification typically takes 2-4 hours during business days and unlocks higher transaction limits and premium features.",
        },
        {
            question: "Can I use UFriends IT for business transactions?",
            answer: "Yes! We offer specialized business accounts with features like bulk payments, invoice generation, expense tracking, and dedicated account managers. Business accounts have higher transaction limits and access to our API for integration with your existing systems.",
        },
        {
            question: "Is there a mobile app available?",
            answer: "Yes, our mobile app is available for both iOS and Android devices. Download it from the App Store or Google Play Store. The app offers all web platform features plus biometric login, push notifications, and offline transaction history viewing.",
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
        subtitle: "Join over 50,000 users who trust UFriends IT for their financial technology needs. Start your journey today and experience the future of digital finance.",
        primaryButtonText: "Create Account",
        secondaryButtonText: "Download App",
        badges: [
            { color: "green", text: "Free to get started" },
            { color: "blue", text: "No hidden fees" },
            { color: "purple", text: "24/7 support" },
        ],
    },
    footer: {
        description: "Your trusted partner for comprehensive financial technology solutions. Making digital finance accessible, secure, and efficient for everyone.",
        copyright: "© 2024 UFriends Information Technology. All rights reserved.",
        tagline: "Made with ❤️ in Nigeria",
    },
};

// Verify admin token from request
async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.slice(7);
    try {
        const payload = await verifyAccessToken(token);
        if (payload.role !== "ADMIN") {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}

// GET - Retrieve all site content
export async function GET(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const content = await prisma.siteContent.findMany();

        // Transform to key-value object
        const contentMap: Record<string, unknown> = {};
        for (const item of content) {
            contentMap[item.key] = item.content;
        }

        // Return with defaults for any missing keys
        return NextResponse.json({
            hero: contentMap.hero || DEFAULT_CONTENT.hero,
            contact: contentMap.contact || DEFAULT_CONTENT.contact,
            faqs: contentMap.faqs || DEFAULT_CONTENT.faqs,
            social: contentMap.social || DEFAULT_CONTENT.social,
            cta: contentMap.cta || DEFAULT_CONTENT.cta,
            footer: contentMap.footer || DEFAULT_CONTENT.footer,
        });
    } catch (error) {
        console.error("Error fetching site content:", error);
        return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
    }
}

// PUT - Update site content
export async function PUT(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { key, content } = body;

        if (!key || !content) {
            return NextResponse.json({ error: "Key and content are required" }, { status: 400 });
        }

        const validKeys = ["hero", "contact", "faqs", "social", "cta", "footer"];
        if (!validKeys.includes(key)) {
            return NextResponse.json({ error: "Invalid content key" }, { status: 400 });
        }

        const updated = await prisma.siteContent.upsert({
            where: { key },
            update: {
                content,
                updatedBy: admin.sub,
            },
            create: {
                key,
                content,
                updatedBy: admin.sub,
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating site content:", error);
        return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
    }
}

// POST - Seed default content
export async function POST(req: NextRequest) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const entries = Object.entries(DEFAULT_CONTENT);

        for (const [key, content] of entries) {
            await prisma.siteContent.upsert({
                where: { key },
                update: {}, // Don't overwrite existing
                create: {
                    key,
                    content,
                    updatedBy: admin.sub,
                },
            });
        }

        return NextResponse.json({ success: true, message: "Default content seeded" });
    } catch (error) {
        console.error("Error seeding content:", error);
        return NextResponse.json({ error: "Failed to seed content" }, { status: 500 });
    }
}
