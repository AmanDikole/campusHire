"use client"

import { toUserFriendlyError } from "@/lib/user-feedback"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export type StudentProject = {
  id: string
  title: string
  description: string | null
  techStack: string | null
  projectUrl: string | null
  githubUrl: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

type ProjectsApiResponse = {
  projects?: StudentProject[]
  project?: StudentProject
  error?: string
}

type ProjectFormState = {
  title: string
  description: string
  techStack: string
  projectUrl: string
  githubUrl: string
  startDate: string
  endDate: string
}

const EMPTY_PROJECT_FORM: ProjectFormState = {
  title: "",
  description: "",
  techStack: "",
  projectUrl: "",
  githubUrl: "",
  startDate: "",
  endDate: "",
}

export function ProjectsManager({ onCountChange }: { onCountChange: (count: number) => void }) {
  const [projects, setProjects] = useState<StudentProject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProjectFormState>(EMPTY_PROJECT_FORM)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/student/projects", { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as ProjectsApiResponse

      if (!response.ok) {
        throw new Error(payload.error || "Failed to fetch projects.")
      }

      const list = payload.projects || []
      setProjects(list)
      onCountChange(list.length)
    } catch (error) {
      toast.error(toUserFriendlyError(error))
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_PROJECT_FORM)
  }

  const updateField = (key: keyof ProjectFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (form.title.trim().length < 2) {
      toast.error("Project title must be at least 2 characters.")
      return
    }

    setSaving(true)
    try {
      const endpoint = editingId ? `/api/student/projects/${editingId}` : "/api/student/projects"
      const method = editingId ? "PATCH" : "POST"
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = (await response.json().catch(() => ({}))) as ProjectsApiResponse
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save project.")
      }

      toast.success(editingId ? "Project updated." : "Project added.")
      resetForm()
      await loadProjects()
    } catch (error) {
      toast.error(toUserFriendlyError(error))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (project: StudentProject) => {
    setEditingId(project.id)
    setForm({
      title: project.title || "",
      description: project.description || "",
      techStack: project.techStack || "",
      projectUrl: project.projectUrl || "",
      githubUrl: project.githubUrl || "",
      startDate: project.startDate ? project.startDate.slice(0, 10) : "",
      endDate: project.endDate ? project.endDate.slice(0, 10) : "",
    })
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this project?")
    if (!confirmed) return

    try {
      const response = await fetch(`/api/student/projects/${id}`, { method: "DELETE" })
      const payload = (await response.json().catch(() => ({}))) as ProjectsApiResponse
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete project.")
      }

      toast.success("Project removed.")
      await loadProjects()
    } catch (error) {
      toast.error(toUserFriendlyError(error))
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Project Title">
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Campus Placement Portal"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Tech Stack">
            <input
              value={form.techStack}
              onChange={(event) => updateField("techStack", event.target.value)}
              placeholder="Next.js, Prisma, MySQL"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={3}
              placeholder="What the project does and your contribution"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Live URL">
            <input
              value={form.projectUrl}
              onChange={(event) => updateField("projectUrl", event.target.value)}
              placeholder="https://example.com"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="GitHub URL">
            <input
              value={form.githubUrl}
              onChange={(event) => updateField("githubUrl", event.target.value)}
              placeholder="https://github.com/user/repo"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Start Date">
            <input type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label="End Date">
            <input type="date" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} className={INPUT_CLASS} />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {editingId ? "Update Project" : "Add Project"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          <Loader2 size={14} className="animate-spin" /> Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No projects added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: StudentProject
  onEdit: (project: StudentProject) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-900">{project.title}</h4>
          {project.techStack ? <p className="mt-1 text-sm text-slate-600">{project.techStack}</p> : null}
          {project.description ? <p className="mt-2 text-sm text-slate-500">{project.description}</p> : null}
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {project.projectUrl ? (
              <a href={project.projectUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                Live Link
              </a>
            ) : null}
            {project.githubUrl ? (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                GitHub
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(project.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60"
