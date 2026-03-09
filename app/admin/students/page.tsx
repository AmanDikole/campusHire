import { db } from "@/lib/db"
import { auth } from "@/auth" // ✅ Import auth
import { AdminSidebar } from "@/components/AdminSidebar"
import { ApplicationRow } from "@/components/ApplicationRow"
import { AdminFilterBar } from "@/components/AdminFilterBar"
import { ExportButton } from "@/components/ExportButton"
import { ProfileVerificationRow } from "@/components/ProfileVerificationRow"
import { isTpoRole } from "@/lib/rbac"
import { redirect } from "next/navigation"
import type { Prisma } from "@prisma/client"

export default async function AdminStudents({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; status?: string }>
}) {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role)) redirect('/login')

  const params = await searchParams
  const { jobId, status } = params

  // 1. Fetch Jobs (Only from THIS college) for the filter dropdown
  const jobs = await db.job.findMany({
    where: { collegeId: session.user.collegeId }, // ✅ Filter
    select: { id: true, title: true, company: true }
  })

  // 2. Build Filter Object
  // We explicitly add collegeId to the where clause
  const whereClause: Prisma.ApplicationWhereInput = {
    collegeId: session.user.collegeId // ✅ Security Filter
  }
  
  if (jobId) whereClause.jobId = jobId
  if (status) whereClause.status = status

  // 3. Fetch Applications
  const applications = await db.application.findMany({
    where: whereClause,
    include: {
      job: {
        select: { title: true, company: true }
      },
      student: {
        include: {
          profile: true 
        }
      }
    },
    orderBy: { appliedAt: 'desc' }
  })

  const pendingProfiles = await db.profile.findMany({
    where: {
      verificationStatus: "Pending",
      user: {
        collegeId: session.user.collegeId,
        role: "student",
      },
    },
    include: {
      user: {
        select: { email: true },
      },
    },
    orderBy: { verificationRequestedAt: "desc" },
    take: 50,
  })

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 font-sans">
      <AdminSidebar />
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Applicant Review</h1>
            <ExportButton data={applications} />
          </div>

          <AdminFilterBar jobs={jobs} />

          <div className="mb-8 rounded-2xl border border-indigo-200 bg-white shadow-sm">
            <div className="border-b border-indigo-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Student Profile Verification Queue</h2>
              <p className="text-sm text-gray-500">Approve or reject profile updates submitted by students.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-indigo-50/50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">CGPA</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3">Comment</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingProfiles.map((profile) => (
                    <ProfileVerificationRow key={profile.id} profile={profile} />
                  ))}
                </tbody>
              </table>
            </div>
            {pendingProfiles.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No pending profile verification requests.</div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
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
                    <ApplicationRow key={app.id} app={app} enableStudentDetails />
                  ))}
                </tbody>
              </table>
            </div>
            {applications.length === 0 && (
              <div className="p-12 text-center text-gray-500">No applications found matching your filters.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
