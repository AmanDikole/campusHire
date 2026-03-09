"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateCompanyProfileAction(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "hr") {
    return { success: false, error: "Unauthorized" }
  }

  const companyName = (formData.get("companyName") as string)?.trim()
  if (!companyName || companyName.length < 2) {
    return { success: false, error: "Please enter a valid company name." }
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { companyName },
    })

    revalidatePath("/hr/company-profile")
    revalidatePath("/hr/post-job")
    revalidatePath("/hr/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Update company profile error:", error)
    return { success: false, error: "Failed to update company profile." }
  }
}
