"use client"

import React, { useState, useRef, useEffect } from "react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface EmojiPickerProps {
  value: string
  onChange: (value: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <Button
        type="button"
        variant="outline"
        className="h-20 w-20 text-4xl flex items-center justify-center p-0 rounded-2xl shadow-sm hover:bg-muted transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value || "😀"}
      </Button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 shadow-xl border rounded-lg bg-popover overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <Picker
            data={data}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            onEmojiSelect={(emoji: any) => {
              onChange(emoji.native)
              setIsOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
