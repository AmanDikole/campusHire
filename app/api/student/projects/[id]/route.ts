import { auth } from "@/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

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

type UpdateProjectBody = {
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

async function ownsProject(projectId: string, userId: string) {
  const rows = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`
      SELECT sp.\`id\`
      FROM \`StudentProject\` sp
      INNER JOIN \`Profile\` p ON p.\`id\` = sp.\`profileId\`
      WHERE sp.\`id\` = ${projectId} AND p.\`userId\` = ${userId}
      LIMIT 1
    `
  )

  return rows.length > 0
}

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "Project ID is required." }, { status: 400 })
  }

  let body: UpdateProjectBody
  try {
    body = (await req.json()) as UpdateProjectBody
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
    if (!(await ownsProject(id, session.user.id))) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 })
    }

    const parsedStartDate = startDate ? new Date(startDate) : null
    const parsedEndDate = endDate ? new Date(endDate) : null
    const now = new Date()

    await db.$executeRaw(
      Prisma.sql`
        UPDATE \`StudentProject\`
        SET
          \`title\` = ${title},
          \`description\` = ${description || null},
          \`techStack\` = ${techStack || null},
          \`projectUrl\` = ${projectUrl || null},
          \`githubUrl\` = ${githubUrl || null},
          \`startDate\` = ${parsedStartDate},
          \`endDate\` = ${parsedEndDate},
          \`updatedAt\` = ${now}
        WHERE \`id\` = ${id}
      `
    )

    const updated = await db.$queryRaw<ProjectRow[]>(
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

    return NextResponse.json({ project: updated[0] })
  } catch (error) {
    console.error("Projects PATCH error:", error)
    return NextResponse.json({ error: "Failed to update project." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "Project ID is required." }, { status: 400 })
  }

  try {
    if (!(await ownsProject(id, session.user.id))) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 })
    }

    await db.$executeRaw(
      Prisma.sql`
        DELETE FROM \`StudentProject\`
        WHERE \`id\` = ${id}
      `
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Projects DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete project." }, { status: 500 })
  }
}
