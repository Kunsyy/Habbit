"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HabitForm, type HabitFormValues } from "@/components/habits/HabitForm"
import { toast } from "sonner"

export default function EditHabitPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // Mock initial data based on ID
  const initialData: Partial<HabitFormValues> = {
    name: "Read 10 pages",
    emoji: "📚",
    category: "learning",
    color: "violet",
    reminderEnabled: true,
    reminderTime: "08:00",
  }

  const handleSubmit = async (data: HabitFormValues) => {
    try {
      console.log("Updating habit:", id, data)
      toast.success("Habit updated successfully!")
      router.push("/habits")
    } catch (error) {
      toast.error("Failed to update habit")
    }
  }

  const handleDelete = async () => {
    try {
      console.log("Deleting habit:", id)
      toast.success("Habit deleted successfully!")
      router.push("/habits")
    } catch (error) {
      toast.error("Failed to delete habit")
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/habits">
          <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground group px-0 h-auto">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to habits
          </Button>
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Edit Habit
          </h1>
          <p className="text-lg text-muted-foreground">
            Fine-tune your routine for better results.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
        
        <div className="relative z-10">
          <HabitForm
            initialValues={initialData}
            isEditing
            onSubmit={handleSubmit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  )
}
