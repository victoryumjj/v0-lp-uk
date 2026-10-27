"use client"

import { Flame, Eye } from "lucide-react"

export function SocialProofInlineUK() {
  return (
    <div className="flex gap-2 flex-wrap my-2">
      <span className="inline-flex items-center gap-1.5 bg-card border border-[#F5DFC0] rounded-full px-3 py-1 text-xs text-[#8B4513]">
        <Flame className="w-3.5 h-3.5 text-orange-500" />
        <strong>3,200+</strong> bought this month
      </span>
      <span className="inline-flex items-center gap-1.5 bg-card border border-[#F5DFC0] rounded-full px-3 py-1 text-xs text-[#8B4513]">
        <Eye className="w-3.5 h-3.5" />
        <strong>14 people</strong> viewing this
      </span>
    </div>
  )
}
