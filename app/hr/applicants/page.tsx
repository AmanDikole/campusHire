import { auth } from "@/auth"
import { ApplicationRow } from "@/components/ApplicationRow"
import { HrSidebar } from "@/components/HrSidebar"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function HrApplicantsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "hr") redirect("/login")

  const applications = await db.application.findMany({
    where: {
      collegeId: session.user.collegeId,
      job: {
        postedById: session.user.id,
      },
    },
    include: {
      job: {
        select: { title: true, company: true },
      },
      student: {
        include: { profile: true },
      },
    },
    orderBy: { appliedAt: "desc" },
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <HrSidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Applicants</h1>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Academics</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Resume</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app) => (
                    <ApplicationRow key={app.id} app={app} />
                  ))}
                </tbody>
              </table>
            </div>
            {applications.length === 0 && <div className="p-12 text-center text-gray-500">No applicants yet.</div>}
          </div>
        </div>
      </main>
    </div>
  )
}
