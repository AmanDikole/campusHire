import { auth } from "@/auth"
import { createCollegeAction } from "@/actions/create-college"
import { deleteCollegeAction, setCollegeStatusAction } from "@/actions/platform-colleges"
import { db } from "@/lib/db"
import { Activity, Building2, Briefcase, Trash2, Users } from "lucide-react"
import { redirect } from "next/navigation"
import type React from "react"

export default async function SuperAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return redirect("/")
  }

  const colleges = await db.college.findMany({
    include: {
      _count: {
        select: {
          users: true,
          jobs: true,
          applications: true,
        },
      },
      subscriptions: {
        include: {
          plan: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      applications: {
        where: { status: "Selected" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const studentCounts = await db.user.groupBy({
    by: ["collegeId"],
    where: { role: "student" },
    _count: { _all: true },
  })
  const studentCountByCollege = new Map(studentCounts.map((entry) => [entry.collegeId, entry._count._all]))

  const totalColleges = colleges.length
  const totalUsers = colleges.reduce((acc, c) => acc + c._count.users, 0)
  const totalJobs = colleges.reduce((acc, c) => acc + c._count.jobs, 0)
  const totalPlacements = colleges.reduce((acc, c) => acc + c.applications.length, 0)

  const handleCreateCollege = async (formData: FormData) => {
    "use server"
    await createCollegeAction(formData)
  }

  const handleSetCollegeStatus = async (formData: FormData) => {
    "use server"
    await setCollegeStatusAction(formData)
  }

  const handleDeleteCollege = async (formData: FormData) => {
    "use server"
    await deleteCollegeAction(formData)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Platform Admin</h1>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">System Healthy</span>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard icon={Building2} label="Colleges" value={totalColleges} />
          <StatCard icon={Users} label="Users" value={totalUsers} />
          <StatCard icon={Briefcase} label="Jobs Posted" value={totalJobs} />
          <StatCard icon={Activity} label="Placements" value={totalPlacements} />
        </div>

        <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Onboard College Tenant</h2>
          <form action={handleCreateCollege} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input name="name" required placeholder="College Name" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" />
            <input name="subdomain" required placeholder="Subdomain" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" />
            <input name="location" placeholder="Location" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" />
            <input name="phone" required placeholder="Phone" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" />
            <input name="website" placeholder="Website (optional)" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" />
            <input name="adminEmail" type="email" required placeholder="TPO Email" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" />
            <input name="adminPassword" required placeholder="TPO Password" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" />
            <textarea name="details" placeholder="College details (optional)" className="md:col-span-2 h-12 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" />
            <button type="submit" className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800">Create Tenant</button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-4">College</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Usage</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {colleges.map((college) => {
                const subscription = college.subscriptions[0]
                return (
                  <tr key={college.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{college.name}</p>
                      <p className="text-xs text-gray-500">{college.subdomain}.campushire.com</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      <p className="font-medium capitalize">{subscription?.plan.name || "N/A"}</p>
                      <p className="text-xs text-gray-500 capitalize">{subscription?.status || "none"}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700 capitalize">{subscription?.paymentStatus || "none"}</td>
                    <td className="px-5 py-4 text-gray-700">
                      <p>Students: {studentCountByCollege.get(college.id) ?? 0}</p>
                      <p>Jobs: {college._count.jobs}</p>
                      <p>Placed: {college.applications.length}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        college.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {college.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <form action={handleSetCollegeStatus}>
                          <input type="hidden" name="collegeId" value={college.id} />
                          <input type="hidden" name="status" value={college.status === "active" ? "suspended" : "active"} />
                          <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">
                            {college.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        </form>
                        <form action={handleDeleteCollege}>
                          <input type="hidden" name="collegeId" value={college.id} />
                          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                            <span className="inline-flex items-center gap-1"><Trash2 size={12} />Delete</span>
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {colleges.length === 0 && <div className="p-12 text-center text-gray-500">No colleges onboarded yet.</div>}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number }>; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-xl bg-gray-100 p-2 text-gray-600">
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}
