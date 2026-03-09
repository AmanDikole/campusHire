'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function ensurePlatformAdmin() {
  const session = await auth()
  if (!session?.user || session.user.email !== process.env.SUPER_ADMIN_EMAIL) {
    throw new Error("Unauthorized")
  }
}

export async function setCollegeStatusAction(formData: FormData) {
  try {
    await ensurePlatformAdmin()
    const collegeId = (formData.get("collegeId") as string) || ""
    const status = (formData.get("status") as string) || ""

    if (!collegeId || !["active", "suspended"].includes(status)) {
      return { error: "Invalid request." }
    }

    await db.college.update({
      where: { id: collegeId },
      data: { status: status as "active" | "suspended" },
    })

    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Set college status error:", error)
    return { error: "Failed to update college status." }
  }
}

export async function deleteCollegeAction(formData: FormData) {
  try {
    await ensurePlatformAdmin()
    const collegeId = (formData.get("collegeId") as string) || ""
    if (!collegeId) return { error: "Invalid request." }

    await db.college.delete({
      where: { id: collegeId },
    })

    revalidatePath("/super-admin")
    return { success: true }
  } catch (error) {
    console.error("Delete college error:", error)
    return { error: "Failed to delete college." }
  }
}
