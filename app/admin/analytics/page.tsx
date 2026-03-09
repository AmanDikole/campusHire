import { db } from "@/lib/db"
import { auth } from "@/auth"
import { AdminSidebar } from "@/components/AdminSidebar"
import { AnalyticsCharts } from "@/components/AnalyticsCharts"
import { isTpoRole } from "@/lib/rbac"
import { getCollegePlanUsage } from "@/lib/saas"
import { TrendingUp, Users, CheckCircle } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

async function getAnalyticsData(collegeId: string) {
  const applications = await db.application.findMany({
    where: {
      collegeId,
    },
    include: {
      student: {
        include: {
          profile: {
            select: { branch: true },
          },
        },
      },
    },
  })

  const branchCounts: Record<string, number> = {}
  applications.forEach((app) => {
    const branch = app.student?.profile?.branch || "Unknown"
    branchCounts[branch] = (branchCounts[branch] || 0) + 1
  })

  const branchStats = Object.keys(branchCounts).map((branch) => ({
    name: branch,
    applications: branchCounts[branch],
  }))

  const statusCounts: Record<string, number> = {
    Pending: 0,
    Shortlisted: 0,
    "Interview Scheduled": 0,
    Rejected: 0,
    Selected: 0,
  }

  applications.forEach((app) => {
    const status = app.status || "Pending"
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  const statusStats = Object.keys(statusCounts).map((status) => ({
    name: status,
    value: statusCounts[status],
  }))

  return { branchStats, statusStats, total: applications.length }
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role)) redirect("/login")

  const planUsage = await getCollegePlanUsage(session.user.collegeId)
  if (!planUsage.limits.analyticsAccess) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 font-sans lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Locked on Current Plan</h1>
            <p className="mt-2 text-gray-600">
              Your <span className="font-semibold">{planUsage.subscription.plan.name}</span> plan does not include analytics.
              Upgrade to Basic, Pro, or Enterprise to access placement charts.
            </p>
            <Link href="/admin/billing" className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
              Upgrade Plan
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const { branchStats, statusStats, total } = await getAnalyticsData(session.user.collegeId)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Placement Analytics</h1>
            <p className="mt-2 text-gray-500">Real-time insights into student performance and hiring trends.</p>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-blue-100">Total Applications</p>
                  <h3 className="mt-2 text-4xl font-bold">{total}</h3>
                </div>
                <div className="rounded-lg bg-white/20 p-2">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-500">Shortlisted</p>
                  <h3 className="mt-2 text-4xl font-bold">{statusStats.find((s) => s.name === "Shortlisted")?.value || 0}</h3>
                </div>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <CheckCircle size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-500">Participation</p>
                  <h3 className="mt-2 text-4xl font-bold">
                    {branchStats.length} <span className="text-lg font-normal text-gray-400">Branches</span>
                  </h3>
                </div>
                <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                  <Users size={24} />
                </div>
              </div>
            </div>
          </div>

          <AnalyticsCharts branchData={branchStats} statusData={statusStats} />
        </div>
      </main>
    </div>
  )
}
