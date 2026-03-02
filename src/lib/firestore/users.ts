import { User as FirebaseUser } from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  Timestamp,
  Unsubscribe 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile } from "@/types/user";

export async function createUserProfile(user: FirebaseUser): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  
  const defaultProfile: UserProfile = {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    xp: 0,
    level: 1,
    onboardingComplete: false,
    createdAt: Timestamp.now(),
  };

  await setDoc(userRef, defaultProfile, { merge: true });
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, data);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  
  return null;
}

export function subscribeToUserProfile(userId: string, callback: (profile: UserProfile) => void): Unsubscribe {
  const userRef = doc(db, "users", userId);
  
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserProfile);
    }
  });
}
