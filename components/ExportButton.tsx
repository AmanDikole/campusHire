'use client'

import { Download } from "lucide-react"

type ExportApplication = {
  status: string
  appliedAt: string | Date
  student?: {
    email?: string | null
    profile?: {
      fullName?: string | null
      branch?: string | null
      cgpa?: number | null
    } | null
  } | null
  job?: {
    title?: string | null
    company?: string | null
  } | null
}

function toCsvCell(value: string | number | null | undefined) {
  const safe = String(value ?? "")
  return `"${safe.replace(/"/g, '""')}"`
}

export function ExportButton({ data }: { data: ExportApplication[] }) {
  
  const handleExport = () => {
    if (!data || data.length === 0) return alert("No data to export")

    // 1. Define CSV Headers
    const headers = ["Candidate Name", "Email", "Job Title", "Company", "Branch", "CGPA", "Status", "Applied Date"]
    
    // 2. Map Data to Rows
    const rows = data.map((app) => [
      app.student?.profile?.fullName || "Unknown",
      app.student?.email || "",
      app.job?.title || "",
      app.job?.company || "",
      app.student?.profile?.branch || "",
      app.student?.profile?.cgpa ?? "",
      app.status,
      new Date(app.appliedAt).toLocaleDateString()
    ])

    // 3. Convert to CSV String
    const csvContent = [
      headers.map((header) => toCsvCell(header)).join(","), 
      ...rows.map((row) => row.map((cell) => toCsvCell(cell as string | number | null | undefined)).join(","))
    ].join("\n")

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `applications_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
  }

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
    >
      <Download size={16} />
      Export CSV
    </button>
  )
}
