import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/mailer"

interface NotificationParams {
    userId: string
    type: string
    title: string
    body: string
    email?: {
        subject: string
        html: string
        text?: string
    }
}

export async function sendNotification({ userId, type, title, body, email }: NotificationParams) {
    try {
        // 1. Create In-App Notification
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                body,
            },
        })

        // 2. Send Email Notification if requested
        if (email) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true },
            })

            if (user?.email) {
                // We don't await email to prevent blocking the main flow, 
                // but it's already handled in sendEmail with catch
                sendEmail({
                    to: user.email,
                    subject: email.subject,
                    html: email.html,
                    text: email.text || body,
                })
            }
        }

        return notification
    } catch (error) {
        console.error("Failed to send notification:", error)
        return null
    }
}

export async function sendAdminNotification({ type, title, body, email }: Omit<NotificationParams, "userId">) {
    try {
        // Find all admins
        const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true },
        })

        const results = await Promise.all(
            admins.map(async (admin: { id: string; email: string }) => {
                // Create In-App Notification for each admin
                const notif = await prisma.notification.create({
                    data: {
                        userId: admin.id,
                        type,
                        title,
                        body,
                    },
                })

                // Send Email to each admin
                if (email) {
                    sendEmail({
                        to: admin.email,
                        subject: email.subject,
                        html: email.html,
                        text: email.text || body,
                    })
                }

                return notif
            })
        )

        return results
    } catch (error) {
        console.error("Failed to send admin notification:", error)
        return null
    }
}
