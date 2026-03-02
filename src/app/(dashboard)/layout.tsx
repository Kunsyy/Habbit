import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { XPToast } from '@/components/gamification/XPToast';
import { PageTransition } from '@/components/layout/PageTransition';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground antialiased selection:bg-violet-500/30 selection:text-violet-200">
      <Sidebar />
      
      {/* 
        md:pl-[240px] reserves space for the fixed Sidebar on desktop.
        pb-[calc(4rem+env(safe-area-inset-bottom))] reserves space for BottomNav on mobile.
      */}
      <main className="flex-1 flex flex-col min-h-[100dvh] w-full md:pl-[240px] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 overflow-x-hidden transition-all duration-300">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      
      <BottomNav />
      <OnboardingWizard />
      <XPToast />
    </div>
  );
}
