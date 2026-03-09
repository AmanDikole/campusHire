"use client"

import { applyForJob } from "@/actions/apply-job"
import { toUserFriendlyError } from "@/lib/user-feedback"
import {
  Banknote,
  Calendar,
  CheckCircle,
  Loader2,
  MapPin,
  NotebookText,
  Sparkles,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

interface JobCardProps {
  job: {
    id: string
    title: string
    company: string
    location: string
    salary: string
    description: string
    createdAt: Date | string
    minCgpa: number
    min10thPercent: number
    min12thPercent: number
    minDiplomaPercent: number
    eligibleGender: string
    eligibleBranches?: string[]
  }
  userProfile: {
    cgpa?: number
    percent10th?: number
    percent12th?: number
    percentDiploma?: number
    branch?: string | null
    gender?: string | null
    verificationStatus?: string | null
  } | null
  hasApplied: boolean
  applicationStatus?: string | null
}

function getStatusStyles(status: string) {
  const styles: Record<string, string> = {
    Pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
    Shortlisted: "border-blue-200 bg-blue-50 text-blue-700",
    "Interview Scheduled": "border-indigo-200 bg-indigo-50 text-indigo-700",
    Selected: "border-green-200 bg-green-50 text-green-700",
    Rejected: "border-red-200 bg-red-50 text-red-700",
  }

  return styles[status] || "border-gray-200 bg-gray-100 text-gray-700"
}

export function JobCard({ job, userProfile, hasApplied, applicationStatus }: JobCardProps) {
  const [loading, setLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isApplied, setIsApplied] = useState(hasApplied)
  const [currentStatus, setCurrentStatus] = useState(applicationStatus || (hasApplied ? "Pending" : null))

  const eligibleBranches = useMemo(() => {
    if (!Array.isArray(job.eligibleBranches)) return []
    return job.eligibleBranches.map((branch) => branch.trim()).filter(Boolean)
  }, [job.eligibleBranches])

  const isEligible = () => {
    if (!userProfile) return false
    if (userProfile.verificationStatus !== "Approved") return false

    if ((userProfile.cgpa ?? 0) < job.minCgpa) return false
    if ((userProfile.percent10th ?? 0) < job.min10thPercent) return false
    if ((userProfile.percent12th ?? 0) < job.min12thPercent) return false
    if ((userProfile.percentDiploma ?? 0) < job.minDiplomaPercent) return false
    if (job.eligibleGender !== "Any" && (userProfile.gender || "Any") !== job.eligibleGender) return false

    if (eligibleBranches.length > 0) {
      const studentBranch = (userProfile.branch || "").trim().toLowerCase()
      const normalizedBranches = eligibleBranches.map((branch) => branch.toLowerCase())
      if (!normalizedBranches.includes(studentBranch)) return false
    }

    return true
  }

  const eligible = isEligible()

  const handleApply = async () => {
    setLoading(true)
    const result = await applyForJob(job.id)

    if (result.success) {
      toast.success(result.success)
      setIsApplied(true)
      setCurrentStatus("Pending")
    } else {
      toast.error(toUserFriendlyError(result.error))
    }

    setLoading(false)
  }

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setDetailsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setDetailsOpen(true)
          }
        }}
        className="flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-2xl font-bold text-gray-900">
              {job.company.charAt(0)}
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">
              {eligibleBranches.length > 0 ? eligibleBranches.join(", ") : "All Branches"}
            </span>
          </div>

          <h3 className="mb-1 text-xl font-bold text-gray-900">{job.title}</h3>
          <p className="mb-4 text-sm font-medium text-gray-500">{job.company}</p>

          <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {job.description}
          </p>

          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400" /> {job.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Banknote size={16} className="text-green-500" /> {job.salary}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-blue-500" /> Posted {new Date(job.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          {!isApplied ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                void handleApply()
              }}
              disabled={!eligible || loading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${
                eligible ? "bg-black text-white shadow-lg shadow-gray-200 hover:bg-zinc-800" : "cursor-not-allowed bg-gray-100 text-gray-400"
              }`}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {!eligible ? "Not Eligible" : loading ? "Applying..." : "Apply Now"}
            </button>
          ) : (
            <div
              className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-bold ${getStatusStyles(
                currentStatus || "Pending",
              )}`}
            >
              <CheckCircle size={18} />
              Applied {currentStatus ? `- ${currentStatus}` : ""}
            </div>
          )}

          {!isApplied && (
            <p className="mt-2 text-center text-xs font-medium text-gray-500">Click card to view full job description.</p>
          )}

          {!eligible && !isApplied && (
            <p className="mt-2 text-center text-xs font-medium text-red-500">
              {userProfile?.verificationStatus !== "Approved"
                ? "Profile verification pending with TPO"
                : "Criteria not met (CGPA / marks / branch)"}
            </p>
          )}
        </div>
      </article>

      {detailsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setDetailsOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{job.title}</h3>
                <p className="mt-1 text-sm font-medium text-gray-600">{job.company}</p>
              </div>
              <button
                onClick={() => setDetailsOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2">
                <MapPin size={15} className="text-gray-400" />
                {job.location}
              </p>
              <p className="inline-flex items-center gap-2">
                <Banknote size={15} className="text-green-600" />
                {job.salary}
              </p>
              <p className="inline-flex items-center gap-2">
                <Sparkles size={15} className="text-indigo-500" />
                Min CGPA: {job.minCgpa}
              </p>
              <p className="inline-flex items-center gap-2">
                <Sparkles size={15} className="text-indigo-500" />
                Gender: {job.eligibleGender}
              </p>
            </div>

            <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                <NotebookText size={16} />
                Job Description
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{job.description}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <p className="font-semibold text-gray-900">Eligibility</p>
              <div className="mt-2 space-y-1 text-gray-600">
                <p>Branches: {eligibleBranches.length > 0 ? eligibleBranches.join(", ") : "All Branches"}</p>
                <p>10th: {job.min10thPercent}% minimum</p>
                <p>12th: {job.min12thPercent}% minimum</p>
                <p>Diploma: {job.minDiplomaPercent}% minimum</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
