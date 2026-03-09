import { auth } from "@/auth"
import { HrSidebar } from "@/components/HrSidebar"
import { db } from "@/lib/db"
import { Briefcase, FileText, Plus, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function HrDashboardPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "hr") redirect("/login")

  const jobs = await db.job.findMany({
    where: {
      collegeId: session.user.collegeId,
      postedById: session.user.id,
    },
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalApplications = jobs.reduce((acc, job) => acc + job._count.applications, 0)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <HrSidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
              <p className="mt-2 text-gray-500">Manage your posted jobs and applicants.</p>
            </div>
            <Link href="/hr/post-job" className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
              <Plus size={18} /> Post Job
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            <StatCard label="Jobs Posted" value={jobs.length} icon={Briefcase} />
            <StatCard label="Total Applicants" value={totalApplications} icon={FileText} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4 font-semibold text-gray-900">Your Jobs</div>
            <div className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">
                      {job.company} • {job.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      job.approvalStatus === "approved"
                        ? "bg-green-50 text-green-700"
                        : job.approvalStatus === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}>
                      {job.approvalStatus}
                    </span>
                    <p className="text-sm text-gray-600">{job._count.applications} applicants</p>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && <p className="px-6 py-8 text-sm text-gray-500">No jobs posted yet.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
