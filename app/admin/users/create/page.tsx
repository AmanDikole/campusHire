import { auth } from "@/auth"
import { AdminSidebar } from "@/components/AdminSidebar"
import { CreateUserForm } from "@/components/CreateUserForm"
import { db } from "@/lib/db"
import { isTpoRole } from "@/lib/rbac"
import { redirect } from "next/navigation"

export default async function CreateUserPage() {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role)) redirect("/login")

  const college = await db.college.findUnique({
    where: { id: session.user.collegeId },
    select: { id: true, name: true },
  })

  if (!college) redirect("/admin/dashboard")

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Create User Account</h1>
          <p className="mb-6 text-gray-500">Create student, HR, or TPO accounts for your college tenant.</p>
          <CreateUserForm collegeId={college.id} collegeName={college.name} />
        </div>
      </main>
    </div>
  )
}
