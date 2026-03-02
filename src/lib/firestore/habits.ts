import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch, 
  getDocs,
  setDoc,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Habit, CreateHabitInput } from '@/types/habit';

export async function createHabit(userId: string, data: CreateHabitInput): Promise<string> {
  const habitsRef = collection(db, 'habits');
  const docRef = await addDoc(habitsRef, {
    ...data,
    userId,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateHabit(habitId: string, data: Partial<Habit>): Promise<void> {
  const habitRef = doc(db, 'habits', habitId);
  await updateDoc(habitRef, data);
}

export async function deleteHabit(habitId: string): Promise<void> {
  const habitRef = doc(db, 'habits', habitId);
  const completionsRef = collection(db, 'habits', habitId, 'completions');
  const completionsSnapshot = await getDocs(completionsRef);
  
  const docsToDelete = [habitRef, ...completionsSnapshot.docs.map(d => d.ref)];
  
  for (let i = 0; i < docsToDelete.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = docsToDelete.slice(i, i + 500);
    chunk.forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

export async function reorderHabits(habits: { id: string; order: number }[]): Promise<void> {
  const batch = writeBatch(db);
  habits.forEach(({ id, order }) => {
    const habitRef = doc(db, 'habits', id);
    batch.update(habitRef, { order });
  });
  await batch.commit();
}

export function subscribeToHabits(userId: string, callback: (habits: Habit[]) => void): Unsubscribe {
  const habitsRef = collection(db, 'habits');
  const q = query(
    habitsRef, 
    where('userId', '==', userId), 
    orderBy('order', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const habits = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Habit[];
    callback(habits);
  });
}
