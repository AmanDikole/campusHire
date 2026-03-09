import { db } from "@/lib/db"
import { auth } from "@/auth"
import { AdminSidebar } from "@/components/AdminSidebar"
import { JobControlCard } from "@/components/JobControlCard"
import { Plus, Briefcase } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isTpoRole } from "@/lib/rbac"

export default async function ManageJobs() {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role)) redirect('/login')

  const jobs = await db.job.findMany({
    where: {
      collegeId: session.user.collegeId,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage Drives</h1>
              <p className="mt-2 text-gray-500">Approve HR postings, control active listings, and track responses.</p>
            </div>

            <Link href="/admin/post-job" className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 font-medium text-white shadow-lg shadow-gray-200 transition hover:bg-zinc-800">
              <Plus size={18} /> Post New Drive
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {jobs.map((job) => (
              <JobControlCard
                key={job.id}
                job={job}
                applicantCount={job._count.applications}
              />
            ))}

            {jobs.length === 0 && (
              <div className="col-span-2 rounded-3xl border border-dashed border-gray-300 bg-white py-20 text-center">
                <Briefcase className="mx-auto mb-3 text-gray-300" size={32} />
                <p className="text-gray-500">No jobs posted yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
