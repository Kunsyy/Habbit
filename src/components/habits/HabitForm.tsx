"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog"

import { ColorPicker } from "./ColorPicker"
import { EmojiPicker } from "./EmojiPicker"

const habitSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  emoji: z.string().min(1, "Emoji is required"),
  category: z.enum(["health", "mindfulness", "learning", "productivity", "other"]),
  color: z.enum(["violet", "fuchsia", "rose", "orange", "amber", "green", "cyan", "blue"]),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().nullable().refine(
    (val) => !val || /^\d{2}:\d{2}$/.test(val),
    "Invalid time format"
  ),
})

export type HabitFormValues = z.infer<typeof habitSchema>

interface HabitFormProps {
  initialValues?: Partial<HabitFormValues>
  isEditing?: boolean
  onSubmit: (data: HabitFormValues) => void
  onDelete?: () => void
}

export function HabitForm({
  initialValues,
  isEditing = false,
  onSubmit,
  onDelete,
}: HabitFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: initialValues?.name || "",
      emoji: initialValues?.emoji || "✨",
      category: initialValues?.category || "health",
      color: initialValues?.color || "violet",
      reminderEnabled: initialValues?.reminderEnabled || false,
      reminderTime: initialValues?.reminderTime || "09:00",
    },
  })

  const reminderEnabled = watch("reminderEnabled")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      <div className="flex gap-6 items-end">
        <div className="flex flex-col space-y-2">
          <Label>Icon</Label>
          <Controller
            control={control}
            name="emoji"
            render={({ field }) => (
              <EmojiPicker value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.emoji && <p className="text-sm text-red-500">{errors.emoji.message}</p>}
        </div>

        <div className="flex-1 flex flex-col space-y-2">
          <Label htmlFor="name">Habit Name</Label>
          <Input
            id="name"
            placeholder="Read 10 pages, Drink water, etc."
            className="text-lg h-12"
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
          </div>

          <div className="space-y-3 pt-4">
            <Label>Theme Color</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <ColorPicker value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.color && <p className="text-sm text-red-500">{errors.color.message}</p>}
          </div>
        </div>

        <div className="space-y-4 p-5 border rounded-xl bg-card">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Daily Reminder</Label>
              <p className="text-sm text-muted-foreground">
                Get notified to complete your habit.
              </p>
            </div>
            <Controller
              control={control}
              name="reminderEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {reminderEnabled && (
            <div className="pt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label>Time</Label>
              <Input
                type="time"
                className="w-full"
                {...register("reminderTime")}
              />
              {errors.reminderTime && <p className="text-sm text-red-500">{errors.reminderTime.message}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        {isEditing ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive" className="font-semibold">
                Delete Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your habit
                  and all associated progress data.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={onDelete}>
                    Yes, delete habit
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <div /> // Placeholder for spacing
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold px-8 h-11"
        >
          {isEditing ? "Save Changes" : "Create Habit"}
        </Button>
      </div>
    </form>
  )
}
