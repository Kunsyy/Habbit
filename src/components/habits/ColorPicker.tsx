"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export const colors = [
  { name: "violet", class: "bg-violet-500 hover:bg-violet-600" },
  { name: "fuchsia", class: "bg-fuchsia-500 hover:bg-fuchsia-600" },
  { name: "rose", class: "bg-rose-500 hover:bg-rose-600" },
  { name: "orange", class: "bg-orange-500 hover:bg-orange-600" },
  { name: "amber", class: "bg-amber-500 hover:bg-amber-600" },
  { name: "green", class: "bg-green-500 hover:bg-green-600" },
  { name: "cyan", class: "bg-cyan-500 hover:bg-cyan-600" },
  { name: "blue", class: "bg-blue-500 hover:bg-blue-600" },
] as const

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => onChange(color.name)}
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-sm",
            color.class,
            value === color.name ? "ring-2 ring-offset-2 ring-ring scale-110" : ""
          )}
          aria-label={`Select ${color.name}`}
        >
          {value === color.name && <Check className="h-5 w-5 text-white" />}
        </button>
      ))}
    </div>
  )
}
