'use server'

import { db } from "@/lib/db"
import { hash } from "bcryptjs"

export async function resetPasswordAction(formData: FormData) {
  const token = (formData.get("token") as string)?.trim()
  const password = formData.get("password") as string

  if (!token || !password) {
    return { error: "Token and password are required." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  const user = await db.user.findFirst({ where: { resetToken: token } })
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
    return { error: "Invalid or expired reset link." }
  }

  const hashedPassword = await hash(password, 12)

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
    },
  })

  return { success: "Password reset successful. Please sign in." }
}
