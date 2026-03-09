import { auth } from "@/auth"
import { AdminSidebar } from "@/components/AdminSidebar"
import { db } from "@/lib/db"
import { isTpoRole } from "@/lib/rbac"
import { Building2, Briefcase, Mail } from "lucide-react"
import { redirect } from "next/navigation"

export default async function CompaniesPage() {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role)) redirect("/login")

  const companies = await db.user.findMany({
    where: {
      collegeId: session.user.collegeId,
      role: "hr",
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      createdAt: true,
      planStatus: true,
      _count: {
        select: {
          postedJobs: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Companies (HR Accounts)</h1>
            <p className="mt-2 text-gray-500">Manage recruiter accounts and monitor company participation.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">HR Contact</th>
                  <th className="px-6 py-4">Jobs Posted</th>
                  <th className="px-6 py-4">Plan Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        <Building2 size={16} className="text-gray-500" />
                        {company.companyName || "Company not set"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-500" />
                        {company.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        <Briefcase size={12} />
                        {company._count.postedJobs}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                        {company.planStatus || "none"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {companies.length === 0 && <div className="p-10 text-center text-gray-500">No HR/company accounts found.</div>}
          </div>
        </div>
      </main>
    </div>
  )
}
