"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notifyUser } from "@/lib/notifications"
import { isTpoRole } from "@/lib/rbac"
import { getCollegePlanContext } from "@/lib/saas"
import { revalidatePath } from "next/cache"

const ALLOWED_STATUSES = new Set(["Pending", "Shortlisted", "Interview Scheduled", "Rejected", "Selected"])

export async function updateStatus(applicationId: string, newStatus: string) {
  const session = await auth()
  const role = session?.user?.role

  if (!session?.user || !(isTpoRole(role) || role === "hr") || !session.user.collegeId) {
    return { success: false, error: "Unauthorized" }
  }

  const planContext = await getCollegePlanContext(session.user.collegeId)
  if (planContext.college.status !== "active") {
    return { success: false, error: "College account is suspended." }
  }

  if (!ALLOWED_STATUSES.has(newStatus)) {
    return { success: false, error: "Invalid status" }
  }

  try {
    const app = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            collegeId: true,
            postedById: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!app || app.job.collegeId !== session.user.collegeId) {
      return { success: false, error: "Application not found" }
    }

    if (role === "hr" && app.job.postedById !== session.user.id) {
      return { success: false, error: "Access denied for this job" }
    }

    await db.application.update({
      where: { id: applicationId },
      data: { status: newStatus },
    })

    let msg = `Your application for ${app.job.title} at ${app.job.company} is now: ${newStatus}.`
    let type = "info"

    if (newStatus === "Shortlisted") {
      msg = `Great news! You are shortlisted for ${app.job.title} at ${app.job.company}.`
      type = "success"
    } else if (newStatus === "Interview Scheduled") {
      msg = `Interview scheduled for ${app.job.title} at ${app.job.company}. Check your portal regularly.`
      type = "info"
    } else if (newStatus === "Rejected") {
      msg = `Update on your application for ${app.job.title}.`
      type = "error"
    } else if (newStatus === "Selected") {
      msg = `Congratulations! You have been selected for ${app.job.title}!`
      type = "success"
    }

    await notifyUser({
      userId: app.student.id,
      email: app.student.email,
      message: msg,
      type,
      subject: `Application Update: ${newStatus}`,
    })

    revalidatePath("/admin/students")
    revalidatePath("/hr/applicants")
    revalidatePath("/student/applications")
    revalidatePath("/student/notifications")

    return { success: true }
  } catch (error) {
    console.error("Update Status Error:", error)
    return { success: false, error: "Failed to update status." }
  }
}

