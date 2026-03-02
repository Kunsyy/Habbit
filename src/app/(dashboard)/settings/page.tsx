"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFCM } from "@/hooks/useFCM";
import { subscribeToUserProfile, updateUserProfile } from "@/lib/firestore/users";
import { updateProfile } from "firebase/auth";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { UserProfile } from "@/types/user";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BadgeGrid } from "@/components/habits/BadgeGrid";
import { toast } from "sonner";
import { Moon, Sun, Monitor, Bell, BellOff, LogOut, CheckCircle2, User, Globe, AlertTriangle } from "lucide-react";

const commonTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { requestToken } = useFCM();
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  
  const [timezone, setTimezone] = useState("");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Initialize
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(ios);
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone);
    }
  }, []);

  // Listen to profile
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserProfile(user.uid, (p) => {
      setProfile(p);
      if (!isEditingName) {
        setDisplayName(p.displayName || user.displayName || "");
      }
      if (!timezone && p.timezone) {
        setTimezone(p.timezone);
      }
    });
    return () => unsub();
  }, [user, isEditingName, timezone]);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await updateUserProfile(user.uid, { displayName: displayName.trim() });
      toast.success("Profile updated");
      setIsEditingName(false);
    } catch (err) {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleTimezoneChange = async (val: string) => {
    setTimezone(val);
    if (user) {
      await updateUserProfile(user.uid, { timezone: val });
      toast.success("Timezone updated");
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    try {
      await requestToken(); // this will save it internally and show a toast
      toast.success("Notifications enabled");
    } catch (err) {
      toast.error("Failed to enable notifications");
    }
  };

  const handleDisableNotifications = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { fcmToken: null } as any);
      toast.info("Notifications disabled");
    } catch (err) {
      toast.error("Failed to disable notifications");
    }
  };

  if (!user) return null; // Let middleware or protected route handle redirect

  // Ensure current timezone is in list
  const currentTzList = timezone && !commonTimezones.includes(timezone) 
    ? [timezone, ...commonTimezones] 
    : commonTimezones;

  const hasNotifications = !!(profile as any)?.fcmToken;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-12 sm:pt-16 pb-24 space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account, appearance, and preferences.</p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Profile Section */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="p-6 overflow-hidden relative group border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <Avatar className="w-20 h-20 border-2 border-primary/20 shadow-xl">
                <AvatarImage src={user.photoURL || undefined} alt="Profile" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4 w-full">
                <div className="grid gap-2">
                  <Label>Display Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditingName || savingName}
                      className="max-w-xs font-medium"
                    />
                    {!isEditingName ? (
                      <Button variant="outline" onClick={() => setIsEditingName(true)}>Edit</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleSaveName} disabled={savingName}>Save</Button>
                        <Button variant="ghost" onClick={() => {
                          setIsEditingName(false);
                          setDisplayName(profile?.displayName || user.displayName || "");
                        }}>Cancel</Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Email (Read-only)</Label>
                  <Input value={user.email || ""} disabled className="max-w-xs text-muted-foreground bg-muted/30" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Appearance Section */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full flex flex-col gap-4 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-5 h-5 text-violet-500" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              Customize the look and feel of your workspace.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="rounded-full flex-1 min-w-[100px]"
                onClick={() => setTheme("light")}
              >
                <Sun className="w-4 h-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="rounded-full flex-1 min-w-[100px]"
                onClick={() => setTheme("dark")}
              >
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className="rounded-full flex-1 min-w-[100px]"
                onClick={() => setTheme("system")}
              >
                <Monitor className="w-4 h-4 mr-2" />
                System
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full flex flex-col gap-4 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              {hasNotifications ? <Bell className="w-5 h-5 text-violet-500" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              Get reminded about your daily habits.
            </p>
            
            {isIOS && !isStandalone && (
              <div className="flex gap-2 items-start p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-sm border border-amber-500/20 mb-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>On iOS, you must add this app to your home screen via Share {'>'} Add to Home Screen to receive notifications.</p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                {hasNotifications ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Notifications enabled</span>
                  </>
                ) : (
                  <span className="font-medium text-muted-foreground">Notifications disabled</span>
                )}
              </div>
              
              {!hasNotifications ? (
                <Button onClick={handleEnableNotifications} size="sm" variant="default" className="rounded-full">
                  Enable
                </Button>
              ) : (
                <Button onClick={handleDisableNotifications} size="sm" variant="destructive" className="rounded-full">
                  Disable
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Timezone Section */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full flex flex-col gap-4 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-violet-500" />
              <h2 className="text-xl font-semibold">Timezone</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Used to accurately reset your daily habit progress.
            </p>
            
            <Select value={timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {currentTzList.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </motion.div>

        {/* Account Section */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full flex flex-col gap-4 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <LogOut className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              Sign out of your account on this device.
            </p>
            <Button variant="destructive" className="w-full sm:w-auto self-start rounded-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </motion.div>
        
        {/* Badges Section */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="p-6 overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">My Badges</h2>
                <p className="text-sm text-muted-foreground">Achievements earned through consistency.</p>
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-violet-500/10 text-violet-500 border-violet-500/20">
                Level {profile?.level || 1}
              </Badge>
            </div>
            
            <BadgeGrid />
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
}
