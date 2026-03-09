import { auth } from "@/auth"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 })
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File size must be less than 5MB." }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes")
  await mkdir(uploadDir, { recursive: true })

  const safeUserId = session.user.id.replace(/[^a-zA-Z0-9_-]/g, "")
  const fileName = `${safeUserId}-${Date.now()}.pdf`
  const filePath = path.join(uploadDir, fileName)

  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/resumes/${fileName}` })
}
