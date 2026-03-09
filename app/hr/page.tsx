import { auth } from "@/auth"
import { getHrAccessState } from "@/lib/hr-billing"
import { redirect } from "next/navigation"

export default async function HrHomePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "hr") redirect("/login")

  const access = await getHrAccessState(session.user.id)
  if (!access.allowed) redirect(`/hr/billing?reason=${access.reason || "payment_required"}`)

  redirect("/hr/dashboard")
}
