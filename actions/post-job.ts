"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notifyUser } from "@/lib/notifications"
import { isTpoRole } from "@/lib/rbac"
import { ensureCollegeCanPostJob } from "@/lib/saas"
import { revalidatePath } from "next/cache"

function parseBoundedNumber(value: FormDataEntryValue | null, min: number, max: number) {
  const normalized = (value?.toString() || "").trim()
  if (!normalized) return 0

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null
  }

  return parsed
}

export async function postJobAction(formData: FormData) {
  const session = await auth()
  const userRole = session?.user?.role

  if (
    !session?.user ||
    !session.user.collegeId ||
    !(isTpoRole(userRole) || userRole === "hr")
  ) {
    return { error: "Unauthorized" }
  }

  const canPost = await ensureCollegeCanPostJob(session.user.collegeId)
  if (!canPost.allowed) {
    return { error: canPost.error }
  }

  const title = (formData.get("title") as string)?.trim() || ""
  const company = (formData.get("company") as string)?.trim() || ""
  const location = (formData.get("location") as string)?.trim() || ""
  const salary = (formData.get("salary") as string)?.trim() || ""
  const description = (formData.get("description") as string)?.trim() || ""

  const minCgpa = parseBoundedNumber(formData.get("min_cgpa"), 0, 10)
  const min10thPercent = parseBoundedNumber(formData.get("min_10th"), 0, 100)
  const min12thPercent = parseBoundedNumber(formData.get("min_12th"), 0, 100)
  const minDiplomaPercent = parseBoundedNumber(formData.get("min_diploma"), 0, 100)

  if (!title || !company || !location || !salary || !description) {
    return { error: "Please fill in all required fields." }
  }

  if (minCgpa === null || min10thPercent === null || min12thPercent === null || minDiplomaPercent === null) {
    return { error: "Enter valid eligibility scores (CGPA: 0-10, percentages: 0-100)." }
  }

  let eligibleBranches: string[] = []
  try {
    const parsed = JSON.parse((formData.get("eligible_branches") as string) || "[]")
    if (Array.isArray(parsed)) {
      eligibleBranches = [...new Set(parsed.map((item) => String(item).trim()).filter(Boolean))]
    }
  } catch {
    return { error: "Invalid branch selection." }
  }

  const eligibleGender = (formData.get("eligible_gender") as string)?.trim() || "Any"

  if (eligibleBranches.length === 0) {
    return { error: "Select at least one eligible branch." }
  }

  const tpoApproved = isTpoRole(userRole)
  const approvalStatus = tpoApproved ? "approved" : "pending"

  try {
    await db.job.create({
      data: {
        title,
        company,
        location,
        salary,
        description,
        minCgpa,
        min10thPercent,
        min12thPercent,
        minDiplomaPercent,
        eligibleGender,
        isActive: tpoApproved,
        approvalStatus,
        approvedAt: tpoApproved ? new Date() : null,
        approvedBy: tpoApproved ? (session.user.email || "TPO") : null,
        collegeId: session.user.collegeId,
        postedById: session.user.id,
        eligibleBranches: {
          create: eligibleBranches.map((name) => ({ name })),
        },
      },
    })

    if (tpoApproved) {
      const students = await db.user.findMany({
        where: {
          collegeId: session.user.collegeId,
          role: "student",
        },
        select: {
          id: true,
          email: true,
        },
      })

      await Promise.all(
        students.map((student) =>
          notifyUser({
            userId: student.id,
            email: student.email,
            type: "info",
            subject: `New Job Posted: ${title}`,
            message: `A new job "${title}" at ${company} has been posted.`,
          })
        )
      )
    }

    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/jobs")
    revalidatePath("/admin/companies")
    revalidatePath("/hr/dashboard")
    revalidatePath("/hr/applicants")
    revalidatePath("/student")
    revalidatePath("/student/dashboard")

    return { success: tpoApproved ? "Job drive posted successfully!" : "Job submitted for TPO approval." }
  } catch (error) {
    console.error("Post Job Error:", error)
    return { error: "Failed to create job. Please try again." }
  }
}
