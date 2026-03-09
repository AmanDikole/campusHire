'use server'

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { createFreeTrialForCollege, ensureSaasPlans } from "@/lib/saas"
import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createCollegeAction(formData: FormData) {
  const session = await auth()

  if (!session?.user || session.user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return { error: "Unauthorized: Super Admin access required." }
  }

  const name = (formData.get('name') as string)?.trim()
  const subdomain = (formData.get('subdomain') as string)?.trim().toLowerCase()
  const location = (formData.get('location') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const website = (formData.get('website') as string)?.trim()
  const details = (formData.get('details') as string)?.trim()
  const adminEmail = (formData.get('adminEmail') as string)?.trim().toLowerCase()
  const adminPassword = (formData.get('adminPassword') as string) || ""

  if (!name || !subdomain || !phone || !adminEmail || !adminPassword) {
    return { error: "All required fields must be filled." }
  }

  if (adminPassword.length < 8) {
    return { error: "Admin password must be at least 8 characters." }
  }

  try {
    await ensureSaasPlans()
    const hashedPassword = await hash(adminPassword, 12)

    const created = await db.$transaction(async (tx) => {
      const newCollege = await tx.college.create({
        data: {
          name,
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
          email: adminEmail,
          password: hashedPassword,
          role: 'tpo',
          collegeId: newCollege.id,
          profile: { create: { fullName: "TPO" } },
        },
      })

      return newCollege
    })

    await createFreeTrialForCollege(created.id)

    revalidatePath('/super-admin')
    return { success: `Successfully created ${name} with free trial subscription.` }
  } catch (error) {
    console.error("Create College Error:", error)
    return { error: "Failed to create college. Subdomain or email might already exist." }
  }
}
