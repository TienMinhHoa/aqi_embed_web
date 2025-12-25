"use client"

import { Search, MapPin, Sun } from "lucide-react"

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Sun className="h-6 w-6 text-amber-500" />
          <span className="font-semibold text-lg text-slate-700">Thời Tiết 24/7</span>
        </div>
      </div>

    </header>
  )
}
