'use client'

import Link from 'next/link'
import { signOut } from "next-auth/react"
import { Building2, LogOut } from 'lucide-react'

export function Navbar() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-slate-900">
          <span className="grid h-8 w-8 place-content-center rounded-lg bg-slate-900 text-white">
            <Building2 size={17} />
          </span>
          <span className="hidden sm:inline">CampusHire</span>
        </Link>
        <div className="h-6 w-px bg-slate-200"></div>
        <div className="flex gap-2 text-sm font-medium text-slate-500">
          <Link href="/" className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">
            Find Jobs
          </Link>
          <Link href="/student/profile" className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">
            My Profile
          </Link>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        <LogOut size={16} /> Logout
      </button>
    </nav>
  )
}
