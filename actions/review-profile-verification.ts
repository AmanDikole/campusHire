"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isTpoRole } from "@/lib/rbac"
import { revalidatePath } from "next/cache"

export async function reviewProfileVerification(
  profileId: string,
  decision: "Approved" | "Rejected",
  comment?: string
) {
  const session = await auth()

  if (!session?.user || !isTpoRole(session.user.role) || !session.user.collegeId) {
    return { success: false, error: "Unauthorized" }
  }

  const profile = await db.profile.findUnique({
    where: { id: profileId },
    include: {
      user: {
        select: {
          id: true,
          collegeId: true,
        },
      },
    },
  })

  if (!profile || profile.user.collegeId !== session.user.collegeId) {
    return { success: false, error: "Profile not found." }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profileId },
        data: {
          verificationStatus: decision,
          verificationComment: comment?.trim() || (decision === "Approved" ? "Verified by TPO." : "Rejected by TPO."),
          verifiedAt: new Date(),
          verifiedBy: session.user.email || "TPO",
        },
      })

      await tx.notification.create({
        data: {
          userId: profile.user.id,
          message:
            decision === "Approved"
              ? "Your profile has been verified by TPO. You can now apply for drives."
              : "Your profile verification was rejected by TPO. Please update details and resubmit.",
          type: decision === "Approved" ? "success" : "error",
        },
      })
    })

    revalidatePath("/admin/students")
    revalidatePath("/student/profile")
    revalidatePath("/student")
    revalidatePath("/student/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Review Profile Verification Error:", error)
    return { success: false, error: "Failed to update verification status." }
  }
}
