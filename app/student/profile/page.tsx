import { db } from "@/lib/db"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { StudentSidebar } from "@/components/StudentSidebar"
import { ProfileForm } from "@/components/ProfileForm"

export const dynamic = "force-dynamic"

export default async function StudentProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "student") {
    redirect("/")
  }

  let profile = await db.profile.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  if (!profile) {
    profile = await db.profile.create({
      data: {
        userId: session.user.id,
      },
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <StudentSidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
            <p className="mt-2 text-gray-500">
              Keep your academic record updated for eligibility checks and faster recruiter shortlisting.
            </p>
          </div>

          <ProfileForm profile={profile} userEmail={session.user.email} />
        </div>
      </main>
    </div>
  )
}
