"use client"

import { reviewProfileVerification } from "@/actions/review-profile-verification"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { Check, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type PendingProfile = {
  id: string
  userId: string
  fullName: string | null
  branch: string | null
  cgpa: number
  verificationRequestedAt: Date | null
  user: {
    email: string
  }
}

export function ProfileVerificationRow({ profile }: { profile: PendingProfile }) {
  const [isPending, startTransition] = useTransition()
  const [comment, setComment] = useState("")

  const handleReview = (decision: "Approved" | "Rejected") => {
    startTransition(async () => {
      const result = await reviewProfileVerification(profile.id, decision, comment)
      if (result.success) {
        toast.success(`Profile ${decision.toLowerCase()}.`)
      } else {
        toast.error(toUserFriendlyError(result.error || "Action failed"))
      }
    })
  }

  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-3">
        <Link href={`/admin/students/${profile.userId}`} className="font-semibold text-gray-900 hover:underline">
          {profile.fullName || "Unknown"}
        </Link>
        <p className="text-xs text-gray-500">{profile.user.email}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{profile.branch || "N/A"}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{profile.cgpa || 0}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {profile.verificationRequestedAt ? new Date(profile.verificationRequestedAt).toLocaleDateString() : "-"}
      </td>
      <td className="px-4 py-3">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional note"
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleReview("Approved")}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Approve
          </button>
          <button
            onClick={() => handleReview("Rejected")}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Reject
          </button>
        </div>
      </td>
    </tr>
  )
}
