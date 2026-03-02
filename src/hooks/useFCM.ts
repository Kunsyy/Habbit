import { toast } from "sonner";

export function useFCM() {
  const requestToken = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      
      const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
      const { firebaseApp } = await import("@/lib/firebase/config");
      
      const messaging = getMessaging(firebaseApp);
      const token = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
      });
      
      if (token) {
        // Save to Firestore + call /api/fcm/token
        await fetch("/api/fcm/token", { 
          method: "POST", 
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, device: getDeviceInfo() })
        });
        
        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          // Show sonner toast instead of system notification (app is in foreground)
          toast(`🔔 ${payload.data?.habitName || "Notification"}`, { 
            description: payload.data?.body || "Time for your habit!" 
          });
        });
      }
    } catch (error) {
      console.error("Error requesting FCM token:", error);
    }
  };
  
  return { requestToken };
}

function getDeviceInfo(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "ios-safari";
  if (/Android/.test(ua)) return "android-chrome";
  return "web-" + (ua.includes("Chrome") ? "chrome" : "other");
}
