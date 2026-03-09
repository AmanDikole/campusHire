'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isTpoRole } from "@/lib/rbac"
import { ensureCollegeCanAddStudent, getCollegePlanContext } from "@/lib/saas"
import { extractTenantSubdomain } from "@/lib/tenant"
import { hash } from "bcryptjs"
import { headers } from "next/headers"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getPasswordValidationError(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters."
  if (password.length > 72) return "Password must be 72 characters or fewer."
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter."
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter."
  if (!/[0-9]/.test(password)) return "Password must include at least one number."
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character."
  return null
}

export async function registerAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string) || ""
  const collegeId = (formData.get('collegeId') as string) || ""
  const role = ((formData.get('role') as string) || "student").trim().toLowerCase()
  const allowedRoles = new Set(["student", "hr", "tpo"])

  if (!email || !password || !collegeId || !role) {
    return { error: "All fields are required." }
  }

  if (!allowedRoles.has(role)) {
    return { error: "Invalid role selected." }
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Invalid email format." }
  }

  if (email.length > 254) {
    return { error: "Email is too long." }
  }

  const passwordError = getPasswordValidationError(password)
  if (passwordError) {
    return { error: passwordError }
  }

  try {
    const session = await auth()

    if (!session?.user && role !== "student") {
      return { error: "Only student self-registration is allowed from signup." }
    }

    if (role !== "student") {
      if (!session?.user || !isTpoRole(session.user.role)) {
        return { error: "HR and TPO accounts must be created by TPO/Admin." }
      }

      if (session.user.collegeId !== collegeId) {
        return { error: "You can only create users for your own college." }
      }
    }

    const tenantSubdomain = extractTenantSubdomain((await headers()).get("host"))
    const college = await db.college.findUnique({
      where: { id: collegeId },
      select: { subdomain: true },
    })

    if (!college) {
      return { error: "Selected college does not exist." }
    }

    if (tenantSubdomain && college.subdomain !== tenantSubdomain) {
      return { error: "Invalid college for this tenant." }
    }

    const planContext = await getCollegePlanContext(collegeId)
    if (planContext.college.status !== "active") {
      return { error: "College account is suspended. Contact platform support." }
    }

    if (role === "student") {
      const canAdd = await ensureCollegeCanAddStudent(collegeId)
      if (!canAdd.allowed) {
        return { error: canAdd.error }
      }
    }

    const existingUser = await db.user.findFirst({
      where: { email, collegeId },
    })

    if (existingUser) {
      return { error: "User already exists in this college." }
    }

    const hashedPassword = await hash(password, 12)

    await db.user.create({
      data: {
        email,
        password: hashedPassword,
        collegeId,
        role,
        ...(role === "student"
          ? {
              profile: {
                create: {
                  fullName: email.split('@')[0],
                },
              },
            }
          : {}),
      },
    })

    return { success: true, email, collegeId, role }
  } catch (error) {
    console.error("Register Error:", error)
    return { error: "Registration failed." }
  }
}
