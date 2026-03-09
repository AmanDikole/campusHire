'use client'

import { reviewJobPosting } from "@/actions/review-job-posting"
import { toggleJobStatus } from "@/actions/toggle-job-status"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { Calendar, Check, Eye, Power, Users, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useTransition } from "react"

type JobControlCardData = {
  id: string
  title: string
  company: string
  createdAt: Date | string
  isActive: boolean
  approvalStatus: "pending" | "approved" | "rejected"
}

export function JobControlCard({ job, applicantCount }: { job: JobControlCardData; applicantCount: number }) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleJobStatus(job.id, job.isActive)
      if (result.success) {
        toast.success(job.isActive ? "Drive closed." : "Drive activated.")
      } else {
        toast.error(toUserFriendlyError(result.error || "Failed to update status."))
      }
    })
  }

  const handleReview = (decision: "approved" | "rejected") => {
    startTransition(async () => {
      const result = await reviewJobPosting(job.id, decision)
      if (result.success) {
        toast.success(decision === "approved" ? "Job approved." : "Job rejected.")
      } else {
        toast.error(toUserFriendlyError(result.error || "Failed to review job."))
      }
    })
  }

  const approvalBadge =
    job.approvalStatus === "approved"
      ? "bg-green-50 text-green-700 border-green-200"
      : job.approvalStatus === "rejected"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-amber-50 text-amber-700 border-amber-200"

  return (
    <div className={`group rounded-3xl border bg-white p-6 transition-all ${job.isActive ? 'border-gray-200 shadow-sm hover:shadow-md' : 'border-gray-100'}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-lg font-bold text-gray-900">
            {job.company.charAt(0)}
          </div>
          <div>
            <h3 className="leading-tight font-bold text-gray-900">{job.title}</h3>
            <p className="text-sm font-medium text-gray-500">{job.company}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`rounded-full border px-3 py-1 text-xs font-bold ${approvalBadge}`}>
            {job.approvalStatus}
          </div>
          <div className={`rounded-full border px-3 py-1 text-xs font-bold ${job.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {job.isActive ? "active" : "closed"}
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4 rounded-xl bg-gray-50/50 p-3 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Users size={16} className="text-blue-500" />
          <span className="font-bold text-gray-700">{applicantCount}</span>
          <span className="text-xs">Applicants</span>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <Calendar size={16} />
          <span className="text-xs">{new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link href={`/admin/students?jobId=${job.id}`} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-black text-sm font-bold text-white transition hover:bg-zinc-800">
          <Eye size={16} /> View Applicants
        </Link>

        {job.approvalStatus === "pending" && (
          <>
            <button
              onClick={() => handleReview("approved")}
              disabled={isPending}
              className="h-10 rounded-xl border border-green-200 bg-green-50 px-3 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => handleReview("rejected")}
              disabled={isPending}
              className="h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </>
        )}

        {job.approvalStatus === "approved" && (
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${
              job.isActive
                ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            <Power size={16} />
            {job.isActive ? "Close" : "Open"}
          </button>
        )}
      </div>
    </div>
  )
}
