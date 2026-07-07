"use client"

import { AeLogoAnimated } from "@/components/AeLogoAnimated"

export function AeLogoCorner() {
  return (
    <div className="fixed bottom-4 right-4 z-40 w-40 opacity-60 pointer-events-none select-none">
      <AeLogoAnimated animate={false} />
    </div>
  )
}
