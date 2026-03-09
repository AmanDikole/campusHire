import { auth } from "@/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"

type ProjectRow = {
  id: string
  title: string
  description: string | null
  techStack: string | null
  projectUrl: string | null
  githubUrl: string | null
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
}

type CreateProjectBody = {
  title?: string
  description?: string
  techStack?: string
  projectUrl?: string
  githubUrl?: string
  startDate?: string
  endDate?: string
}

function isValidHttpUrl(value: string) {
  if (!value) return true

  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

async function getStudentProfileId(userId: string) {
  const profile = await db.profile.findUnique({
    where: { userId },
    select: { id: true },
  })

  return profile?.id || null
}

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const profileId = await getStudentProfileId(session.user.id)
    if (!profileId) {
      return NextResponse.json({ projects: [] })
    }

    const projects = await db.$queryRaw<ProjectRow[]>(
      Prisma.sql`
        SELECT
          \`id\`,
          \`title\`,
          \`description\`,
          \`techStack\`,
          \`projectUrl\`,
          \`githubUrl\`,
          \`startDate\`,
          \`endDate\`,
          \`createdAt\`,
          \`updatedAt\`
        FROM \`StudentProject\`
        WHERE \`profileId\` = ${profileId}
        ORDER BY \`createdAt\` DESC
      `
    )

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Projects GET error:", error)
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: CreateProjectBody
  try {
    body = (await req.json()) as CreateProjectBody
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }

  const title = (body.title || "").trim()
  const description = (body.description || "").trim()
  const techStack = (body.techStack || "").trim()
  const projectUrl = (body.projectUrl || "").trim()
  const githubUrl = (body.githubUrl || "").trim()
  const startDate = (body.startDate || "").trim()
  const endDate = (body.endDate || "").trim()

  if (title.length < 2 || title.length > 120) {
    return NextResponse.json({ error: "Project title must be between 2 and 120 characters." }, { status: 400 })
  }

  if (!isValidHttpUrl(projectUrl) || !isValidHttpUrl(githubUrl)) {
    return NextResponse.json({ error: "Project and GitHub links must start with http:// or https://." }, { status: 400 })
  }

  try {
    const profileId = await getStudentProfileId(session.user.id)
    if (!profileId) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 })
    }

    const id = randomUUID()
    const now = new Date()
    const parsedStartDate = startDate ? new Date(startDate) : null
    const parsedEndDate = endDate ? new Date(endDate) : null

    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO \`StudentProject\`
          (\`id\`, \`profileId\`, \`title\`, \`description\`, \`techStack\`, \`projectUrl\`, \`githubUrl\`, \`startDate\`, \`endDate\`, \`createdAt\`, \`updatedAt\`)
        VALUES
          (${id}, ${profileId}, ${title}, ${description || null}, ${techStack || null}, ${projectUrl || null}, ${githubUrl || null}, ${parsedStartDate}, ${parsedEndDate}, ${now}, ${now})
      `
    )

    const created = await db.$queryRaw<ProjectRow[]>(
      Prisma.sql`
        SELECT
          \`id\`,
          \`title\`,
          \`description\`,
          \`techStack\`,
          \`projectUrl\`,
          \`githubUrl\`,
          \`startDate\`,
          \`endDate\`,
          \`createdAt\`,
          \`updatedAt\`
        FROM \`StudentProject\`
        WHERE \`id\` = ${id}
        LIMIT 1
      `
    )

    return NextResponse.json({ project: created[0] }, { status: 201 })
  } catch (error) {
    console.error("Projects POST error:", error)
    return NextResponse.json({ error: "Failed to create project." }, { status: 500 })
  }
}
