import { db } from "@/lib/db"

type NotificationPayload = {
  userId: string
  message: string
  type?: string
  email?: string | null
  subject?: string
}

export async function notifyUser(payload: NotificationPayload) {
  await db.notification.create({
    data: {
      userId: payload.userId,
      message: payload.message,
      type: payload.type || "info",
    },
  })

  await sendEmailNotification({
    to: payload.email || undefined,
    subject: payload.subject || "CampusHire Notification",
    body: payload.message,
  })
}

export async function sendEmailNotification({
  to,
  subject,
  body,
}: {
  to?: string
  subject: string
  body: string
}) {
  if (!to) return

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Stub] To: ${to} | Subject: ${subject} | Body: ${body}`)
    return
  }

  try {
    const nodemailer = await import("nodemailer")

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    })
  } catch (error) {
    console.error("Email send failed:", error)
  }
}