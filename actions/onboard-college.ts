'use server'

import { db } from "@/lib/db"
import { createFreeTrialForCollege, ensureSaasPlans } from "@/lib/saas"
import { hash } from "bcryptjs"

function normalizeSubdomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
}

export async function onboardCollegeAction(formData: FormData) {
  const collegeName = (formData.get("collegeName") as string)?.trim()
  const subdomainRaw = (formData.get("subdomain") as string)?.trim()
  const location = (formData.get("location") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim()
  const website = (formData.get("website") as string)?.trim()
  const details = (formData.get("details") as string)?.trim()
  const tpoName = (formData.get("tpoName") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = (formData.get("password") as string) || ""

  if (!collegeName || !subdomainRaw || !phone || !email || !password) {
    return { error: "Please fill all required fields." }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email format." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  const subdomain = normalizeSubdomain(subdomainRaw)
  if (subdomain.length < 3 || subdomain.length > 40) {
    return { error: "Subdomain must be 3-40 characters." }
  }

  try {
    await ensureSaasPlans()

    const hashedPassword = await hash(password, 12)

    await db.$transaction(async (tx) => {
      const college = await tx.college.create({
        data: {
          name: collegeName,
          subdomain,
          location: location || null,
          phone,
          website: website || null,
          details: details || null,
          status: "active",
        },
      })

      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "tpo",
          collegeId: college.id,
          profile: {
            create: {
              fullName: tpoName || "TPO",
            },
          },
        },
      })
    })

    const createdCollege = await db.college.findUnique({
      where: { subdomain },
      select: { id: true },
    })

    if (!createdCollege) {
      return { error: "Failed to initialize tenant subscription." }
    }

    await createFreeTrialForCollege(createdCollege.id)
  } catch (error) {
    console.error("Onboarding error:", error)
    return { error: "Onboarding failed. Subdomain or email may already be in use." }
  }

  return { success: true }
}
