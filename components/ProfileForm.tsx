"use client"

import { updateProfileAction } from "@/actions/update-profile"
import {
  NumberField,
  SectionCard,
  SelectField,
  StatCard,
  TextAreaField,
  TextField,
} from "@/components/student-profile/ProfileFormSections"
import { ProjectsManager } from "@/components/student-profile/ProjectsManager"
import { toUserFriendlyError } from "@/lib/user-feedback"
import {
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Mail,
  Upload,
  type LucideIcon,
} from "lucide-react"
import { useActionState, useCallback, useMemo, useRef, useState } from "react"
import { useFormStatus } from "react-dom"

type Profile = {
  fullName?: string | null
  course?: string | null
  branch?: string | null
  gender?: string | null
  currentYear?: number | null
  cgpa?: number | null
  board10th?: string | null
  percent10th?: number | null
  board12th?: string | null
  percent12th?: number | null
  diplomaCourse?: string | null
  percentDiploma?: number | null
  university?: string | null
  backlogs?: number | null
  yearOfPassing?: number | null
  universityRollNo?: string | null
  currentSemester?: number | null
  technicalSkills?: string | null
  softSkills?: string | null
  certifications?: string | null
  internshipExperience?: string | null
  resumeHeadline?: string | null
  githubUrl?: string | null
  codingProfileUrl?: string | null
  preferredLocation?: string | null
  resumeUrl?: string | null
  linkedinUrl?: string | null
  portfolioUrl?: string | null
  verificationStatus?: string | null
  verificationComment?: string | null
}

type TabKey = "overview" | "academic" | "skills" | "projects" | "resume"

const COMPLETION_FIELDS = [
  "fullName",
  "course",
  "branch",
  "gender",
  "currentYear",
  "cgpa",
  "board10th",
  "percent10th",
  "board12th",
  "percent12th",
  "diplomaCourse",
  "percentDiploma",
  "university",
  "backlogs",
  "yearOfPassing",
  "currentSemester",
  "universityRollNo",
  "technicalSkills",
  "softSkills",
  "resumeHeadline",
  "resumeUrl",
  "linkedinUrl",
  "githubUrl",
  "codingProfileUrl",
] as const

const BRANCH_OPTIONS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AI&DS", "ENTC"] as const
const GENDER_OPTIONS = ["Male", "Female", "Other"] as const

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: "overview", label: "Overview", icon: Layers },
  { key: "academic", label: "Academic", icon: GraduationCap },
  { key: "skills", label: "Skills", icon: BookOpen },
  { key: "projects", label: "Projects", icon: Briefcase },
  { key: "resume", label: "Resume", icon: FileText },
]

function getCompletionFromSource(source: Record<string, unknown>, hasProjects: boolean) {
  const filled = COMPLETION_FIELDS.filter((key) => {
    const value = source[key]
    if (typeof value === "number") return Number.isFinite(value)
    if (typeof value === "string") return value.trim().length > 0
    return Boolean(value)
  }).length

  const projectBonus = hasProjects ? 1 : 0
  const total = COMPLETION_FIELDS.length + 1
  return Math.round(((filled + projectBonus) / total) * 100)
}

function getCompletionFromFormData(formData: FormData, hasProjects: boolean) {
  const source: Record<string, unknown> = {}
  for (const key of COMPLETION_FIELDS) {
    source[key] = formData.get(key)
  }

  const resumeFile = formData.get("resumeFile")
  if (resumeFile instanceof File && resumeFile.size > 0) {
    source.resumeUrl = "uploaded"
  }

  return getCompletionFromSource(source, hasProjects)
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return "ST"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function formatCgpa(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A"
  return value.toFixed(2)
}

export function ProfileForm({ profile, userEmail }: { profile: Profile; userEmail?: string | null }) {
  const [state, formAction] = useActionState(updateProfileAction, null)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [hasProjects, setHasProjects] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const initialCompletion = useMemo(() => {
    return getCompletionFromSource(profile as Record<string, unknown>, false)
  }, [profile])

  const [completion, setCompletion] = useState(initialCompletion)

  const recomputeCompletion = useCallback(
    (projectsFlag = hasProjects) => {
      if (!formRef.current) return
      const formData = new FormData(formRef.current)
      setCompletion(getCompletionFromFormData(formData, projectsFlag))
    },
    [hasProjects]
  )

  const handleProjectsChange = (count: number) => {
    const projectFlag = count > 0
    setHasProjects(projectFlag)
    if (formRef.current) {
      const formData = new FormData(formRef.current)
      setCompletion(getCompletionFromFormData(formData, projectFlag))
    }
  }

  const displayName = profile.fullName?.trim() || userEmail?.split("@")[0] || "Student"

  return (
    <form
      ref={formRef}
      action={formAction}
      onInput={() => recomputeCompletion()}
      onReset={() => queueMicrotask(() => recomputeCompletion(hasProjects))}
      className="space-y-6"
    >
      <input type="hidden" name="resumeUrl" defaultValue={profile.resumeUrl || ""} />
      <input type="hidden" name="currentSemester" defaultValue={profile.currentSemester ?? ""} />
      <input type="hidden" name="universityRollNo" defaultValue={profile.universityRollNo || ""} />
      <input type="hidden" name="preferredLocation" defaultValue={profile.preferredLocation || ""} />
      <input id="resumeFileInput" name="resumeFile" type="file" accept="application/pdf" className="sr-only" />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-20 place-content-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold shadow-inner">
                {getInitials(displayName)}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-100">Student Profile Dashboard</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">{displayName}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">{profile.branch || "Branch not set"}</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1">CGPA {formatCgpa(profile.cgpa)}</span>
                </div>
                <p className="mt-3 inline-flex items-center gap-1 text-sm text-blue-100">
                  <Mail size={14} /> {userEmail || "No email"}
                </p>
                <VerificationBadge status={profile.verificationStatus || "Pending"} comment={profile.verificationComment || ""} />
              </div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 lg:w-72">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-100">Resume</p>
              <p className="mt-1 text-xs text-blue-100">Upload latest resume (PDF, max 5MB)</p>
              <label
                htmlFor="resumeFileInput"
                className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <Upload size={15} /> Upload Resume
              </label>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 md:px-8">
          <CompletionBar value={completion} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <TabPanel active={activeTab === "overview"}>
        <SectionCard title="Profile Overview" subtitle="A quick snapshot of your placement readiness.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="CGPA" value={formatCgpa(profile.cgpa)} />
            <StatCard label="Branch" value={profile.branch || "N/A"} />
            <StatCard label="Backlogs" value={String(profile.backlogs ?? 0)} />
            <StatCard label="Projects" value={hasProjects ? "Added" : "None"} />
          </div>
        </SectionCard>
      </TabPanel>

      <TabPanel active={activeTab === "academic"}>
        <SectionCard title="Academic Information" subtitle="Core profile details used by recruiters and placement filters.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextField label="Full Name" name="fullName" defaultValue={profile.fullName || ""} placeholder="Your full name" />
            <TextField label="Course" name="course" defaultValue={profile.course || ""} placeholder="B.Tech / B.E / MCA" />
            <SelectField label="Branch" name="branch" defaultValue={profile.branch || ""} options={BRANCH_OPTIONS.map((b) => ({ value: b, label: b }))} />
            <NumberField label="Current Year" name="currentYear" min={1} max={10} step="1" defaultValue={profile.currentYear ?? ""} placeholder="1 - 4" />
            <NumberField label="Current CGPA" name="cgpa" min={0} max={10} step="0.01" defaultValue={profile.cgpa ?? ""} placeholder="0 - 10" />
            <SelectField label="Gender" name="gender" defaultValue={profile.gender || "Male"} options={GENDER_OPTIONS.map((g) => ({ value: g, label: g }))} />
          </div>
        </SectionCard>
        <SectionCard title="School Education" subtitle="School board and percentage details.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="10th Board" name="board10th" defaultValue={profile.board10th || ""} placeholder="CBSE / ICSE / State Board" />
            <NumberField label="10th Percentage" name="percent10th" min={0} max={100} step="0.01" defaultValue={profile.percent10th ?? ""} placeholder="0 - 100" />
            <TextField label="12th Board" name="board12th" defaultValue={profile.board12th || ""} placeholder="CBSE / ICSE / State Board" />
            <NumberField label="12th Percentage" name="percent12th" min={0} max={100} step="0.01" defaultValue={profile.percent12th ?? ""} placeholder="0 - 100" />
          </div>
        </SectionCard>
        <SectionCard title="Diploma Details" subtitle="Add diploma details if applicable.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="Diploma Course" name="diplomaCourse" defaultValue={profile.diplomaCourse || ""} placeholder="Diploma in Computer Engineering" />
            <NumberField label="Diploma Percentage" name="percentDiploma" min={0} max={100} step="0.01" defaultValue={profile.percentDiploma ?? ""} placeholder="0 - 100" />
          </div>
        </SectionCard>
        <SectionCard title="College Details" subtitle="College and graduation information.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextField label="University" name="university" defaultValue={profile.university || ""} placeholder="VTU / Anna University / JNTU" />
            <NumberField label="Graduation Year" name="yearOfPassing" min={2000} max={2100} step="1" defaultValue={profile.yearOfPassing ?? ""} placeholder="2027" />
            <NumberField label="Backlogs" name="backlogs" min={0} max={100} step="1" defaultValue={profile.backlogs ?? 0} placeholder="0" />
          </div>
        </SectionCard>
      </TabPanel>

      <TabPanel active={activeTab === "skills"}>
        <SectionCard title="Skills" subtitle="Showcase technical strengths and communication skills.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextAreaField label="Technical Skills" name="technicalSkills" defaultValue={profile.technicalSkills || ""} placeholder="Java, React, Node, SQL..." />
            <TextAreaField label="Soft Skills" name="softSkills" defaultValue={profile.softSkills || ""} placeholder="Communication, teamwork, leadership..." />
            <TextAreaField label="Certifications" name="certifications" defaultValue={profile.certifications || ""} placeholder="AWS, GCP, Oracle..." />
            <TextAreaField label="Internship Experience" name="internshipExperience" defaultValue={profile.internshipExperience || ""} placeholder="Company, role, duration, achievements..." />
          </div>
        </SectionCard>
      </TabPanel>

      <TabPanel active={activeTab === "projects"}>
        <SectionCard title="Projects" subtitle="Add project work to strengthen your profile.">
          <ProjectsManager onCountChange={handleProjectsChange} />
        </SectionCard>
      </TabPanel>

      <TabPanel active={activeTab === "resume"}>
        <SectionCard title="Resume and Links" subtitle="Keep profile links and resume details up to date.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="Resume Headline" name="resumeHeadline" defaultValue={profile.resumeHeadline || ""} placeholder="Final-year CSE student..." />
            <TextField label="LinkedIn URL" name="linkedinUrl" defaultValue={profile.linkedinUrl || ""} placeholder="https://linkedin.com/in/username" />
            <TextField label="GitHub URL" name="githubUrl" defaultValue={profile.githubUrl || ""} placeholder="https://github.com/username" />
            <TextField label="LeetCode / CodeChef URL" name="codingProfileUrl" defaultValue={profile.codingProfileUrl || ""} placeholder="https://leetcode.com/u/username/" />
            <div className="md:col-span-2">
              <TextField label="Portfolio URL" name="portfolioUrl" defaultValue={profile.portfolioUrl || ""} placeholder="https://your-portfolio.com" />
            </div>
          </div>
        </SectionCard>
      </TabPanel>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm">
            {state?.error && <p className="font-medium text-red-600">{toUserFriendlyError(state.error)}</p>}
            {state?.success && <p className="font-medium text-emerald-700">{state.success}</p>}
          </div>
          <ActionButtons onCancel={() => recomputeCompletion(hasProjects)} />
        </div>
      </div>
    </form>
  )
}

function CompletionBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>Profile completion</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-300" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

function VerificationBadge({ status, comment }: { status: string; comment: string }) {
  const badgeClass =
    status === "Approved"
      ? "border-emerald-200 bg-emerald-100/80 text-emerald-900"
      : status === "Rejected"
      ? "border-red-200 bg-red-100/80 text-red-900"
      : "border-amber-200 bg-amber-100/80 text-amber-900"

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-full border px-3 py-1 font-semibold ${badgeClass}`}>Verification: {status}</span>
      {comment ? <span className="text-blue-100">{comment}</span> : null}
    </div>
  )
}

function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div className={active ? "space-y-4" : "hidden space-y-4"}>{children}</div>
}

function ActionButtons({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus()

  return (
    <div className="flex items-center gap-3">
      <button
        type="reset"
        disabled={pending}
        onClick={onCancel}
        className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Loader2 size={15} className="animate-spin" />}
        {pending ? "Saving..." : "Save Changes"}
      </button>
    </div>
  )
}
