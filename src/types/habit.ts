export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  order: number;
  createdAt: number;
  color?: string;
  icon?: string;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  order: number;
  color?: string;
  icon?: string;
}

export interface Completion {
  completedAt: number;
  xpEarned: number;
}
