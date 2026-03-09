'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isTpoRole } from "@/lib/rbac"
import { revalidatePath } from "next/cache"

export async function toggleJobStatus(jobId: string, currentStatus: boolean) {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role) || !session.user.collegeId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const job = await db.job.findUnique({
      where: { id: jobId },
      select: { collegeId: true, approvalStatus: true },
    })

    if (!job || job.collegeId !== session.user.collegeId) {
      return { success: false, error: "Job not found." }
    }

    if (job.approvalStatus !== "approved") {
      return { success: false, error: "Only approved jobs can be opened or closed." }
    }

    await db.job.update({
      where: { id: jobId },
      data: {
        isActive: !currentStatus,
      },
    })

    revalidatePath('/admin/jobs')
    revalidatePath('/student')
    revalidatePath('/student/dashboard')
    return { success: true }
  } catch (error) {
    console.error("Toggle Job Status Error:", error)
    return { success: false, error: "Failed to update status" }
  }
}
