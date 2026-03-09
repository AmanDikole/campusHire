import { auth } from "@/auth"
import { HrCompanyProfileForm } from "@/components/HrCompanyProfileForm"
import { HrSidebar } from "@/components/HrSidebar"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function HrCompanyProfilePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "hr") redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { companyName: true },
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <HrSidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          <p className="mt-2 mb-6 text-gray-500">Manage your recruiter company details used across postings.</p>
          <HrCompanyProfileForm initialCompanyName={user?.companyName} />
        </div>
      </main>
    </div>
  )
}
