"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notifyUser } from "@/lib/notifications"
import { isTpoRole } from "@/lib/rbac"
import { revalidatePath } from "next/cache"

export async function reviewJobPosting(
  jobId: string,
  decision: "approved" | "rejected",
  comment?: string
) {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role) || !session.user.collegeId) {
    return { success: false, error: "Unauthorized" }
  }

  const job = await db.job.findUnique({
    where: { id: jobId },
    include: {
      postedBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  })

  if (!job || job.collegeId !== session.user.collegeId) {
    return { success: false, error: "Job not found." }
  }

  try {
    const isApproved = decision === "approved"

    await db.job.update({
      where: { id: jobId },
      data: {
        approvalStatus: decision,
        approvalComment: comment?.trim() || null,
        approvedAt: isApproved ? new Date() : null,
        approvedBy: isApproved ? (session.user.email || "TPO") : null,
        isActive: isApproved,
      },
    })

    if (job.postedBy?.id) {
      await notifyUser({
        userId: job.postedBy.id,
        email: job.postedBy.email,
        type: isApproved ? "success" : "error",
        subject: isApproved ? "Job Posting Approved" : "Job Posting Rejected",
        message: isApproved
          ? `Your job "${job.title}" has been approved by TPO and is now visible to students.`
          : `Your job "${job.title}" was rejected by TPO.${comment ? ` Comment: ${comment}` : ""}`,
      })
    }

    revalidatePath("/admin/jobs")
    revalidatePath("/admin/dashboard")
    revalidatePath("/hr/dashboard")
    revalidatePath("/student")
    revalidatePath("/student/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Review Job Posting Error:", error)
    return { success: false, error: "Failed to review posting." }
  }
}
