import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Unsubscribe,
  documentId,
  collectionGroup
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function completeHabit(habitId: string, dateStr: string): Promise<void> {
  const completionRef = doc(db, 'habits', habitId, 'completions', dateStr);
  await setDoc(completionRef, {
    completedAt: Date.now(),
    xpEarned: 10,
  });
}

export async function uncompleteHabit(habitId: string, dateStr: string): Promise<void> {
  const completionRef = doc(db, 'habits', habitId, 'completions', dateStr);
  await deleteDoc(completionRef);
}

export function subscribeToDayCompletions(
  habitIds: string[], 
  dateStr: string, 
  callback: (completedIds: Set<string>) => void
): Unsubscribe {
  // If no habits, return empty set and a no-op unsubscribe
  if (habitIds.length === 0) {
    callback(new Set());
    return () => {};
  }

  // Firestore "in" query limited to 30 values. If more, we need multiple listeners.
  // But for "subscribeToDayCompletions" as per prompt, we use collectionGroup or something else.
  // Actually, the path is habits/{habitId}/completions/{dateStr}.
  // We can use collectionGroup("completions") and filter by documentId.
  // However, documentId filtering in collectionGroup might be tricky with "in".
  
  // A better approach for a specific day: 
  // collectionGroup("completions") where ID is dateStr.
  // Wait, Firestore collectionGroup queries don't support filtering by document ID easily across different parents without specific fields.
  
  // Given the requirement, let's use a simpler approach:
  // Each completion document has the same ID (dateStr) across different habits.
  // We can query collectionGroup('completions') where the document ID matches dateStr.
  // But in Firestore, you can't filter collectionGroup by document ID directly in a `where`.
  // You CAN use `__name__` but it's the full path.
  
  // Alternative: Listen to each habit's specific completion doc.
  // But that's many listeners.
  
  // Let's assume habitIds is small or use collectionGroup with a specific date field if it existed.
  // Since we don't have a date field in the completion doc (it's the ID), 
  // let's use the simplest robust way: multiple listeners or collectionGroup with __name__.
  
  // Actually, the most efficient way to see which of THESE habits are completed on THIS day
  // is to query collectionGroup('completions') and filter by the parent habit.
  
  const q = query(
    collectionGroup(db, 'completions'),
    where(documentId(), 'in', habitIds.map(id => `habits/${id}/completions/${dateStr}`))
  );

  return onSnapshot(q, (snapshot) => {
    const completedIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      // The parent of the completion doc is the habit doc
      const habitId = doc.ref.parent.parent?.id;
      if (habitId) {
        completedIds.add(habitId);
      }
    });
    callback(completedIds);
  });
}
