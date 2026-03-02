import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  timezone: string;
  xp: number;
  level: number;
  onboardingComplete: boolean;
  createdAt: Timestamp | Date;
}
