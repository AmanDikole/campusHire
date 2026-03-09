"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

type ProfileActionState = {
  error?: string
  success?: string
} | null

const ALLOWED_GENDERS = new Set(["Male", "Female", "Other"])
const ALLOWED_BRANCHES = new Set(["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AI&DS", "ENTC"])
const SENSITIVE_KEYS = [
  "fullName",
  "course",
  "branch",
  "currentYear",
  "cgpa",
  "board10th",
  "percent10th",
  "board12th",
  "percent12th",
  "diplomaCourse",
  "percentDiploma",
  "university",
  "gender",
  "backlogs",
  "yearOfPassing",
  "universityRollNo",
  "currentSemester",
  "resumeUrl",
  "linkedinUrl",
  "portfolioUrl",
  "resumeHeadline",
  "githubUrl",
  "codingProfileUrl",
] as const

function parseBoundedNumber(value: FormDataEntryValue | null, min: number, max: number) {
  const normalized = (value?.toString() || "").trim()
  if (!normalized) return 0

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null
  }

  return parsed
}

function parseOptionalInt(
  value: FormDataEntryValue | null,
  min: number,
  max: number
): { value: number | null; invalid: boolean } {
  const normalized = (value?.toString() || "").trim()
  if (!normalized) return { value: null, invalid: false }

  const parsed = Number(normalized)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return { value: null, invalid: true }
  }

  return { value: parsed, invalid: false }
}

function isValidUrl(value: string) {
  if (!value) return true
  if (value.startsWith("/")) return true

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth()

  if (!session?.user) {
    return { error: "Unauthorized" }
  }

  if (session.user.role !== "student") {
    return { error: "Access denied" }
  }

  const fullName = (formData.get("fullName") as string)?.trim() || ""
  const course = (formData.get("course") as string)?.trim() || ""
  const branch = (formData.get("branch") as string)?.trim() || ""
  const gender = (formData.get("gender") as string)?.trim() || "Male"
  const board10th = (formData.get("board10th") as string)?.trim() || ""
  const board12th = (formData.get("board12th") as string)?.trim() || ""
  const diplomaCourse = (formData.get("diplomaCourse") as string)?.trim() || ""
  const university = (formData.get("university") as string)?.trim() || ""

  const currentYearInput = parseOptionalInt(formData.get("currentYear"), 1, 10)
  const cgpa = parseBoundedNumber(formData.get("cgpa"), 0, 10)
  const percent10th = parseBoundedNumber(formData.get("percent10th"), 0, 100)
  const percent12th = parseBoundedNumber(formData.get("percent12th"), 0, 100)
  const percentDiploma = parseBoundedNumber(formData.get("percentDiploma"), 0, 100)
  const backlogsInput = parseOptionalInt(formData.get("backlogs"), 0, 100)
  const yearOfPassingInput = parseOptionalInt(formData.get("yearOfPassing"), 2000, 2100)
  const currentSemesterInput = parseOptionalInt(formData.get("currentSemester"), 1, 12)
  const backlogs = backlogsInput.value ?? 0
  const currentYear = currentYearInput.value
  const yearOfPassing = yearOfPassingInput.value
  const currentSemester = currentSemesterInput.value

  const resumeUrl = (formData.get("resumeUrl") as string)?.trim() || ""
  const linkedinUrl = (formData.get("linkedinUrl") as string)?.trim() || ""
  const portfolioUrl = (formData.get("portfolioUrl") as string)?.trim() || ""
  const universityRollNo = (formData.get("universityRollNo") as string)?.trim() || ""
  const technicalSkills = (formData.get("technicalSkills") as string)?.trim() || ""
  const softSkills = (formData.get("softSkills") as string)?.trim() || ""
  const certifications = (formData.get("certifications") as string)?.trim() || ""
  const internshipExperience = (formData.get("internshipExperience") as string)?.trim() || ""
  const resumeHeadline = (formData.get("resumeHeadline") as string)?.trim() || ""
  const githubUrl = (formData.get("githubUrl") as string)?.trim() || ""
  const codingProfileUrl = (formData.get("codingProfileUrl") as string)?.trim() || ""
  const preferredLocation = (formData.get("preferredLocation") as string)?.trim() || ""

  if (fullName.length > 80) {
    return { error: "Full name must be 80 characters or fewer." }
  }

  if (branch.length > 40) {
    return { error: "Branch must be 40 characters or fewer." }
  }

  if (course.length > 80) {
    return { error: "Course must be 80 characters or fewer." }
  }

  if (board10th.length > 80 || board12th.length > 80) {
    return { error: "Board names must be 80 characters or fewer." }
  }

  if (diplomaCourse.length > 80) {
    return { error: "Diploma course must be 80 characters or fewer." }
  }

  if (university.length > 120) {
    return { error: "University must be 120 characters or fewer." }
  }

  if (branch && !ALLOWED_BRANCHES.has(branch)) {
    return { error: "Please select a valid branch from the dropdown." }
  }

  if (cgpa === null || percent10th === null || percent12th === null || percentDiploma === null) {
    return { error: "Enter valid academic scores (CGPA: 0-10, percentages: 0-100)." }
  }

  if (currentYearInput.invalid || backlogsInput.invalid || yearOfPassingInput.invalid || currentSemesterInput.invalid) {
    return { error: "Enter valid values for current year, backlogs, year of passing, and current semester." }
  }

  if (!ALLOWED_GENDERS.has(gender)) {
    return { error: "Invalid gender value." }
  }

  try {
    const existingProfile = await db.profile.findUnique({
      where: { userId: session.user.id },
    })

    const resumeFile = formData.get("resumeFile")
    let finalResumeUrl = resumeUrl || existingProfile?.resumeUrl || ""

    if (resumeFile instanceof File && resumeFile.size > 0) {
      if (resumeFile.type !== "application/pdf") {
        return { error: "Resume must be a PDF file." }
      }
      if (resumeFile.size > 5 * 1024 * 1024) {
        return { error: "Resume size must be less than 5MB." }
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes")
      await mkdir(uploadDir, { recursive: true })

      const fileName = `${session.user.id}-${Date.now()}.pdf`
      const filePath = path.join(uploadDir, fileName)
      const buffer = Buffer.from(await resumeFile.arrayBuffer())
      await writeFile(filePath, buffer)
      finalResumeUrl = `/uploads/resumes/${fileName}`
    }

    if (
      !isValidUrl(finalResumeUrl) ||
      !isValidUrl(linkedinUrl) ||
      !isValidUrl(portfolioUrl) ||
      !isValidUrl(githubUrl) ||
      !isValidUrl(codingProfileUrl)
    ) {
      return { error: "All URLs must start with http:// or https://." }
    }

    const nextProfileData = {
      fullName,
      course,
      branch,
      currentYear,
      gender,
      cgpa,
      board10th,
      percent10th,
      board12th,
      percent12th,
      diplomaCourse,
      percentDiploma,
      university,
      backlogs,
      yearOfPassing,
      universityRollNo,
      currentSemester,
      resumeUrl: finalResumeUrl,
      linkedinUrl,
      portfolioUrl,
      technicalSkills,
      softSkills,
      certifications,
      internshipExperience,
      resumeHeadline,
      githubUrl,
      codingProfileUrl,
      preferredLocation,
    }

    const hasSensitiveChanges =
      !existingProfile ||
      SENSITIVE_KEYS.some((key) => {
        const oldValue = String((existingProfile as Record<string, unknown>)[key] ?? "")
        const newValue = String((nextProfileData as Record<string, unknown>)[key] ?? "")
        return oldValue !== newValue
      })

    await db.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...nextProfileData,
        verificationStatus: "Pending",
        verificationRequestedAt: new Date(),
        verifiedAt: null,
        verifiedBy: null,
        verificationComment: null,
      },
      update: {
        ...nextProfileData,
        ...(hasSensitiveChanges
          ? {
              verificationStatus: "Pending",
              verificationRequestedAt: new Date(),
              verifiedAt: null,
              verifiedBy: null,
              verificationComment: "Awaiting TPO verification.",
            }
          : {}),
      },
    })

    revalidatePath("/student/profile")
    revalidatePath("/student")
    revalidatePath("/student/dashboard")

    return {
      success: hasSensitiveChanges
        ? "Profile updated and sent to TPO for verification."
        : "Profile updated successfully!",
    }
  } catch (error) {
    console.error("Update Profile Error:", error)
    if (process.env.NODE_ENV !== "production" && error instanceof Error) {
      return { error: `Save failed: ${error.message}` }
    }
    return { error: "Something went wrong. Please try again." }
  }
}
