"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleLoginResponse = async (idToken: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (response.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      throw new Error("Failed to set auth cookie");
    }
  };

  const createFirestoreUser = async (userId: string, email: string, displayName: string) => {
    await setDoc(doc(db, "users", userId), {
      email,
      displayName,
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    });
  };

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      
      const user = userCredential.user;

      // 2. Update Auth Profile with name
      await updateProfile(user, {
        displayName: values.name,
      });

      // 3. Create Firestore document
      await createFirestoreUser(user.uid, values.email, values.name);

      // 4. Set session cookie
      const idToken = await user.getIdToken();
      await handleLoginResponse(idToken);
      
      toast.success("Account created successfully");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already in use");
      } else if (error.code === "auth/network-request-failed") {
        toast.error("Network error");
      } else {
        toast.error(error.message || "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // For Google sign in, we also want to ensure the Firestore document exists
      // setDoc with merge: true or checking existence might be better, 
      // but here we just follow the register logic.
      await createFirestoreUser(user.uid, user.email!, user.displayName || "User");

      const idToken = await user.getIdToken();
      await handleLoginResponse(idToken);
      toast.success("Signed in with Google");
    } catch (error: any) {
      console.error(error);
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error("Google sign-in failed");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-violet-500/10 to-background p-4">
      <Card className="w-full max-w-md border-violet-500/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-4 shadow-lg shadow-violet-500/20">
            <span className="text-2xl font-bold text-white relative">
              H
              <Sparkles className="absolute -top-1 -right-3 w-4 h-4 text-yellow-300 fill-yellow-300" />
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-center">
            Start your journey to better habits today.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button
            variant="outline"
            type="button"
            disabled={isLoading || isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-11 rounded-xl bg-white text-black hover:bg-gray-50 border-gray-200 transition-all"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                disabled={isLoading || isGoogleLoading}
                className="h-11 rounded-xl focus-visible:ring-violet-500"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                disabled={isLoading || isGoogleLoading}
                className="h-11 rounded-xl focus-visible:ring-violet-500"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                disabled={isLoading || isGoogleLoading}
                className="h-11 rounded-xl focus-visible:ring-violet-500"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              disabled={isLoading || isGoogleLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium transition-all"
              type="submit"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-500 hover:text-violet-600 font-medium underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
