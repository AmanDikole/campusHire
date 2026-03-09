import { auth } from "@/auth"
import { HrPostJobForm } from "@/components/HrPostJobForm"
import { HrSidebar } from "@/components/HrSidebar"
import { db } from "@/lib/db"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function HrPostJobPage() {
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
        <div className="mx-auto max-w-4xl">
          <Link href="/hr/dashboard" className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Link>
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Post New Job</h1>
          <HrPostJobForm initialCompanyName={user?.companyName} />
        </div>
      </main>
    </div>
  )
}
