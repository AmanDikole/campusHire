'use server'

import { db } from "@/lib/db"
import { sendEmailNotification } from "@/lib/notifications"
import crypto from "node:crypto"

export async function requestPasswordResetAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const collegeId = (formData.get("collegeId") as string)?.trim()
  const origin = (formData.get("origin") as string)?.trim()

  if (!email || !collegeId) {
    return { error: "Email and college are required." }
  }

  const user = await db.user.findFirst({ where: { email, collegeId } })
  if (!user) {
    return { success: "If this account exists, reset instructions were sent." }
  }

  const token = crypto.randomBytes(24).toString("hex")
  const resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiresAt,
    },
  })

  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  await sendEmailNotification({
    to: email,
    subject: "CampusHire Password Reset",
    body: `Reset your password using this link: ${resetUrl}\nThis link expires in 30 minutes.`,
  })

  return { success: "If this account exists, reset instructions were sent." }
}
