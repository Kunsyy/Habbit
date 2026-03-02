"use client"

import * as React from "react"
import Link from "next/link"
import { Reorder, AnimatePresence } from "framer-motion"
import { GripVertical, Pencil, Bell, Archive, ArrowRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Mock data
type Habit = {
  id: string
  name: string
  emoji: string
  category: string
  color: string
  reminderEnabled: boolean
  reminderTime: string | null
  archived: boolean
}

const initialHabits: Habit[] = [
  {
    id: "1",
    name: "Read 10 pages",
    emoji: "📚",
    category: "learning",
    color: "violet",
    reminderEnabled: true,
    reminderTime: "08:00",
    archived: false,
  },
  {
    id: "2",
    name: "Meditate",
    emoji: "🧘‍♂️",
    category: "mindfulness",
    color: "cyan",
    reminderEnabled: false,
    reminderTime: null,
    archived: false,
  },
]

export default function HabitsPage() {
  const [habits, setHabits] = React.useState(initialHabits)

  const toggleArchive = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, archived: !h.archived } : h))
    )
  }

  const activeHabits = habits.filter((h) => !h.archived)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            My Habits
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your daily routines and build momentum.
          </p>
        </div>
        <Link href="/habits/new">
          <Button className="h-12 px-6 rounded-full font-bold bg-foreground text-background hover:scale-105 hover:bg-foreground/90 transition-all shadow-xl shadow-violet-500/20">
            <Plus className="mr-2 h-5 w-5" />
            New Habit
          </Button>
        </Link>
      </header>

      {activeHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="relative mb-8 w-40 h-40 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center shadow-inner">
            <span className="text-6xl absolute z-10 animate-bounce">✨</span>
            <div className="absolute inset-0 border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-full animate-[spin_10s_linear_infinite]" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Start your first habit</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            You don&apos;t have any active habits yet. Create one to begin your journey.
          </p>
          <Link href="/habits/new">
            <Button size="lg" className="rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-600/30 font-semibold group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={activeHabits}
          onReorder={setHabits}
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {activeHabits.map((habit) => (
              <Reorder.Item
                key={habit.id}
                value={habit}
                className="group relative bg-card hover:bg-accent/50 border border-border/50 rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className={cn("flex items-center justify-center w-14 h-14 rounded-2xl shadow-inner text-3xl", 
                  habit.color === "violet" && "bg-violet-100 dark:bg-violet-900/30",
                  habit.color === "fuchsia" && "bg-fuchsia-100 dark:bg-fuchsia-900/30",
                  habit.color === "rose" && "bg-rose-100 dark:bg-rose-900/30",
                  habit.color === "orange" && "bg-orange-100 dark:bg-orange-900/30",
                  habit.color === "amber" && "bg-amber-100 dark:bg-amber-900/30",
                  habit.color === "green" && "bg-green-100 dark:bg-green-900/30",
                  habit.color === "cyan" && "bg-cyan-100 dark:bg-cyan-900/30",
                  habit.color === "blue" && "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  {habit.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-bold text-lg truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {habit.name}
                    </h3>
                    <Badge variant="secondary" className="capitalize text-xs rounded-full px-2.5">
                      {habit.category}
                    </Badge>
                  </div>

                  {habit.reminderEnabled && habit.reminderTime && (
                    <div className="flex items-center text-xs text-muted-foreground bg-muted w-fit px-2 py-1 rounded-md">
                      <Bell className="h-3 w-3 mr-1.5 text-orange-500" />
                      {habit.reminderTime}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="hidden sm:flex flex-col items-center mr-2">
                    <Switch
                      checked={!habit.archived}
                      onCheckedChange={() => toggleArchive(habit.id)}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <span className="text-[10px] mt-1 text-muted-foreground font-medium uppercase tracking-wider">Active</span>
                  </div>

                  <Link href={`/habits/${habit.id}/edit`}>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30 dark:hover:text-violet-400">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden rounded-full hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                    onClick={() => toggleArchive(habit.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  )
}
