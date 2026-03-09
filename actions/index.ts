'use server'

import { db } from "@/lib/db"

export async function getJobs() {
  try {
    const jobs = await db.job.findMany({
      where: {
        isActive: true,
        approvalStatus: "approved",
      },
      orderBy: { createdAt: "desc" },
    })

    return jobs
  } catch (error) {
    console.error("Failed to fetch jobs:", error)
    return []
  }
}
