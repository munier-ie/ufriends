import nodemailer from "nodemailer"

const host = process.env.EMAIL_SERVER_HOST
const port = Number(process.env.EMAIL_SERVER_PORT || 465)
const user = process.env.EMAIL_SERVER_USER
const pass = process.env.EMAIL_SERVER_PASSWORD
const from = process.env.EMAIL_FROM || "UFriends IT <no-reply@ufriends.com>"

export const mailer = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user && pass ? { user, pass } : undefined,
})

export interface EmailParams {
  to: string
  subject: string
  text?: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: EmailParams) {
  try {
    await mailer.sendMail({ from, to, subject, text, html })
    return { success: true }
  } catch (error) {
    console.error("Email sending failed:", error)
    return { success: false, error }
  }
}

export async function sendOtpEmail(to: string, code: string) {
  const subject = "Your UFriends verification code"
  const text = `Your verification code is ${code}. It expires in 5 minutes.`
  const html = `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`
  return sendEmail({ to, subject, text, html })
}