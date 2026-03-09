'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ApplicationRow } from "@/components/ApplicationRow"
import type { ApplicationRowData } from "@/components/ApplicationRow"

export function StudentTable({ initialApplications }: { initialApplications: ApplicationRowData[] }) {
  const router = useRouter()

  useEffect(() => {
    // Poll periodically to keep table data reasonably fresh without realtime services.
    const intervalId = setInterval(() => {
      router.refresh()
    }, 20000)

    return () => {
      clearInterval(intervalId)
    }
  }, [router])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Candidate</th>
            <th className="px-6 py-4">Academics</th>
            <th className="px-6 py-4">Role Applied</th>
            <th className="px-6 py-4">Resume</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {initialApplications?.map((app) => (
            <ApplicationRow key={app.id} app={app} />
          ))}
        </tbody>
      </table>
      
      {(!initialApplications || initialApplications.length === 0) && (
        <div className="p-12 text-center text-gray-500">
          No applications found matching your filters.
        </div>
      )}
    </div>
  )
}
