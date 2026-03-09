import { auth } from "@/auth"
import { AdminSidebar } from "@/components/AdminSidebar"
import { db } from "@/lib/db"
import { isTpoRole } from "@/lib/rbac"
import { ArrowLeft, CheckCircle2, FileText, Mail, UserX } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

function dateLabel(value: Date | null | undefined) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value)
}

function numberLabel(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) return "-"
  return Number(value).toFixed(digits)
}

function verificationClass(status: string | null | undefined) {
  if (status === "Approved") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "Rejected") return "border-red-200 bg-red-50 text-red-700"
  return "border-amber-200 bg-amber-50 text-amber-700"
}

function statusClass(status: string) {
  if (status === "Selected") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "Rejected") return "border-red-200 bg-red-50 text-red-700"
  if (status === "Interview Scheduled") return "border-indigo-200 bg-indigo-50 text-indigo-700"
  if (status === "Shortlisted") return "border-blue-200 bg-blue-50 text-blue-700"
  return "border-amber-200 bg-amber-50 text-amber-700"
}

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role)) redirect("/login")

  const { studentId } = await params

  const student = await db.user.findFirst({
    where: {
      id: studentId,
      role: "student",
      collegeId: session.user.collegeId,
    },
    include: {
      profile: {
        include: {
          projects: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
      applications: {
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              salary: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
        take: 20,
      },
    },
  })

  if (!student) {
    redirect("/admin/students")
  }

  const profile = student.profile
  const studentName = profile?.fullName || student.email.split("@")[0]

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin/students" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                <ArrowLeft size={16} />
                Back to Students
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Student Details</h1>
            </div>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 place-content-center rounded-full bg-gray-100 text-lg font-bold text-gray-700">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{studentName}</h2>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-gray-600">
                    <Mail size={14} />
                    {student.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {profile?.branch || "Branch not set"}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      CGPA: {numberLabel(profile?.cgpa)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${verificationClass(
                        profile?.verificationStatus
                      )}`}
                    >
                      Verification: {profile?.verificationStatus || "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {profile?.resumeUrl ? (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <FileText size={16} />
                    View Resume
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-500">
                    <UserX size={16} />
                    Resume not uploaded
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <Detail label="Full Name" value={profile?.fullName} />
                <Detail label="Course" value={profile?.course} />
                <Detail label="Branch" value={profile?.branch} />
                <Detail label="Current Year" value={profile?.currentYear} />
                <Detail label="Current CGPA" value={numberLabel(profile?.cgpa)} />
                <Detail label="Backlogs" value={profile?.backlogs} />
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">School and Diploma</h3>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <Detail label="10th Board" value={profile?.board10th} />
                <Detail label="10th Percentage" value={numberLabel(profile?.percent10th)} />
                <Detail label="12th Board" value={profile?.board12th} />
                <Detail label="12th Percentage" value={numberLabel(profile?.percent12th)} />
                <Detail label="Diploma Course" value={profile?.diplomaCourse} />
                <Detail label="Diploma Percentage" value={numberLabel(profile?.percentDiploma)} />
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">College Details</h3>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <Detail label="University" value={profile?.university} />
                <Detail label="Graduation Year" value={profile?.yearOfPassing} />
                <Detail label="Current Semester" value={profile?.currentSemester} />
                <Detail label="University Roll No" value={profile?.universityRollNo} />
                <Detail label="Preferred Location" value={profile?.preferredLocation} />
                <Detail label="Verified At" value={dateLabel(profile?.verifiedAt)} />
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Skills and Links</h3>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <Detail label="Technical Skills" value={profile?.technicalSkills} />
                <Detail label="Soft Skills" value={profile?.softSkills} />
                <Detail label="Certifications" value={profile?.certifications} />
                <Detail label="Internship Experience" value={profile?.internshipExperience} />
                <Detail label="LinkedIn" value={profile?.linkedinUrl} isLink />
                <Detail label="GitHub" value={profile?.githubUrl} isLink />
                <Detail label="Coding Profile" value={profile?.codingProfileUrl} isLink />
                <Detail label="Portfolio" value={profile?.portfolioUrl} isLink />
              </dl>
            </section>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
            {profile?.projects && profile.projects.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {profile.projects.map((project) => (
                  <article key={project.id} className="rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900">{project.title}</h4>
                    <p className="mt-1 text-sm text-gray-600">{project.description || "-"}</p>
                    <p className="mt-2 text-xs text-gray-500">Tech Stack: {project.techStack || "-"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      {project.projectUrl && (
                        <a href={project.projectUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">
                          Project URL
                        </a>
                      )}
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">
                          GitHub
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No projects added.</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Application History</h3>
            {student.applications.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Applied On</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {student.applications.map((application) => (
                      <tr key={application.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{application.job.title}</td>
                        <td className="px-4 py-3 text-gray-600">{application.job.company}</td>
                        <td className="px-4 py-3 text-gray-600">{dateLabel(application.appliedAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(application.status)}`}>
                            {application.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No applications found for this student.</p>
            )}
          </section>

          {profile?.verificationComment ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CheckCircle2 size={18} />
                Verification Note
              </h3>
              <p className="mt-3 text-sm text-gray-600">{profile.verificationComment}</p>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}

function Detail({
  label,
  value,
  isLink = false,
}: {
  label: string
  value: string | number | null | undefined
  isLink?: boolean
}) {
  const isEmpty = value === null || value === undefined || String(value).trim().length === 0
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900">
        {isEmpty ? (
          "-"
        ) : isLink ? (
          <a href={String(value)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
            {String(value)}
          </a>
        ) : (
          String(value)
        )}
      </dd>
    </div>
  )
}
