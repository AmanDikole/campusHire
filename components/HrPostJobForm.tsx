"use client"

import { postJobAction } from "@/actions/post-job"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { BookOpen, GraduationCap, Loader2, Percent, ScrollText, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type ComponentType, type InputHTMLAttributes } from "react"
import { toast } from "sonner"

export function HrPostJobForm({ initialCompanyName }: { initialCompanyName?: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [selectedGender, setSelectedGender] = useState<string>("Any")

  const branches = ["CSE", "IT", "ECE", "MECH", "CIVIL", "EEE", "AI&DS", "ENTC"]
  const genders = ["Any", "Male", "Female"]

  const toggleBranch = (branch: string) => {
    setSelectedBranches((prev) => (prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set("eligible_branches", JSON.stringify(selectedBranches))
    formData.set("eligible_gender", selectedGender)

    const result = await postJobAction(formData)

    if (result.error) {
      toast.error(toUserFriendlyError(result.error))
      setLoading(false)
      return
    }

    toast.success(result.success)
    router.push("/hr/dashboard")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input label="Job Title" name="title" placeholder="Graduate Trainee Engineer" required />
        <Input label="Salary (CTC)" name="salary" placeholder="8 LPA" required />
        <Input label="Company Name" name="company" placeholder="Microsoft" defaultValue={initialCompanyName || ""} required />
        <Input label="Location" name="location" placeholder="Bangalore / Remote" required />
      </div>

      <div className="space-y-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
        <h3 className="flex items-center gap-2 border-b border-indigo-100 pb-2 font-bold text-indigo-900">Eligibility</h3>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <BookOpen size={16} /> Eligible Branches
            </label>
            <div className="flex flex-wrap gap-2">
              {branches.map((branch) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => toggleBranch(branch)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedBranches.includes(branch)
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users size={16} /> Gender Preference
            </label>
            <div className="flex w-fit gap-2 rounded-xl border border-gray-200 bg-white p-1">
              {genders.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGender(g)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    selectedGender === g ? "bg-indigo-100 text-indigo-700" : "text-gray-500"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Percent size={16} /> Minimum Scores
          </label>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ScoreInput name="min_cgpa" label="CGPA" icon={GraduationCap} placeholder="6.5" />
            <ScoreInput name="min_10th" label="10th %" icon={ScrollText} placeholder="60" />
            <ScoreInput name="min_12th" label="12th %" icon={ScrollText} placeholder="60" />
            <ScoreInput name="min_diploma" label="Diploma %" icon={ScrollText} placeholder="Optional" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Job Description</label>
        <textarea
          name="description"
          required
          className="h-40 w-full resize-none rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Roles, responsibilities, and hiring process"
        />
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-black px-10 py-3.5 font-bold text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Posting..." : "Publish Job"}
        </button>
      </div>
    </form>
  )
}

function Input({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input {...props} className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-black/5" />
    </div>
  )
}

function ScoreInput({
  name,
  label,
  icon: Icon,
  placeholder,
}: {
  name: string
  label: string
  icon: ComponentType<{ className?: string; size?: number }>
  placeholder: string
}) {
  return (
    <div className="space-y-1">
      <span className="ml-1 text-xs font-medium text-gray-500">{label}</span>
      <div className="relative">
        <Icon className="absolute left-3 top-3 text-indigo-400" size={16} />
        <input
          name={name}
          type="number"
          step="0.01"
          className="w-full rounded-xl border border-indigo-100 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
