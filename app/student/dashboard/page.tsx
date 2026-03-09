import { auth } from "@/auth"
import { JobCard } from "@/components/JobCard"
import { StudentSidebar } from "@/components/StudentSidebar"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function StudentDashboardPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "student") redirect("/login")

  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
  })

  const jobsRaw = await db.job.findMany({
    where: {
      isActive: true,
      approvalStatus: "approved",
      collegeId: session.user.collegeId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      eligibleBranches: {
        select: { name: true },
      },
    },
  })

  const jobs = jobsRaw.map((job) => ({
    ...job,
    eligibleBranches: job.eligibleBranches.map((branch) => branch.name),
  }))

  const applications = await db.application.findMany({
    where: { studentId: session.user.id },
    select: { jobId: true, status: true },
  })

  const applicationStatusByJobId = new Map(applications.map((app) => [app.jobId, app.status]))

  const college = await db.college.findUnique({
    where: { id: session.user.collegeId },
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-8 lg:p-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{college?.name || "Campus"} Placements</h1>
            <p className="text-gray-500">Welcome back, {session.user.email}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                userProfile={profile}
                hasApplied={applicationStatusByJobId.has(job.id)}
                applicationStatus={applicationStatusByJobId.get(job.id) || null}
              />
            ))}

            {jobs.length === 0 && (
              <p className="col-span-2 py-10 text-center text-gray-500">No active drives at {college?.name} yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
