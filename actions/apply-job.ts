'use server'

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { getCollegePlanContext } from "@/lib/saas"
import { revalidatePath } from "next/cache"

export async function applyForJob(jobId: string) {
  const session = await auth()
  
  // 1. Security Check
  if (!session?.user || session.user.role !== 'student') {
    return { error: "Unauthorized" }
  }

  try {
    const planContext = await getCollegePlanContext(session.user.collegeId)
    if (planContext.college.status !== "active") {
      return { error: "College account is suspended. Applications are unavailable." }
    }

    const profile = await db.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        verificationStatus: true,
        cgpa: true,
        percent10th: true,
        percent12th: true,
        percentDiploma: true,
        branch: true,
        gender: true,
      },
    })

    if (!profile || profile.verificationStatus !== "Approved") {
      return { error: "Your profile must be verified by TPO before applying." }
    }

    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        eligibleBranches: {
          select: { name: true },
        },
      },
    })

    if (!job || job.collegeId !== session.user.collegeId || !job.isActive || job.approvalStatus !== "approved") {
      return { error: "Job is not currently available for application." }
    }

    if ((profile.cgpa ?? 0) < job.minCgpa) {
      return { error: "Not eligible: CGPA criteria not met." }
    }
    if ((profile.percent10th ?? 0) < job.min10thPercent) {
      return { error: "Not eligible: 10th percentage criteria not met." }
    }
    if ((profile.percent12th ?? 0) < job.min12thPercent) {
      return { error: "Not eligible: 12th percentage criteria not met." }
    }
    if ((profile.percentDiploma ?? 0) < job.minDiplomaPercent) {
      return { error: "Not eligible: diploma percentage criteria not met." }
    }

    if (job.eligibleGender !== "Any" && (profile.gender || "Any") !== job.eligibleGender) {
      return { error: "Not eligible: gender criteria not met." }
    }

    if (job.eligibleBranches.length > 0) {
      const normalizedBranch = (profile.branch || "").trim().toLowerCase()
      const normalizedAllowed = job.eligibleBranches.map((b) => b.name.trim().toLowerCase())
      if (!normalizedAllowed.includes(normalizedBranch)) {
        return { error: "Not eligible: branch criteria not met." }
      }
    }

    // 2. Check for duplicate application
    const existing = await db.application.findUnique({
      where: {
        jobId_studentId: {
          jobId,
          studentId: session.user.id
        }
      }
    })

    if (existing) {
      return { error: "You have already applied for this job." }
    }

    // 3. Create Application (Tagged with CollegeId)
    await db.application.create({
      data: {
        jobId,
        studentId: session.user.id,
        collegeId: session.user.collegeId, // ✅ CRITICAL: Links app to the college
        status: "Pending"
      }
    })

    // 4. Update UI
    revalidatePath('/student')
    revalidatePath('/student/dashboard')
    revalidatePath('/student/applications')
    return { success: "Application submitted successfully!" }

  } catch (error) {
    console.error("Apply Error:", error)
    return { error: "Something went wrong. Please try again." }
  }
}
