'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckCircle, BarChart2, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Habits', href: '/habits', icon: CheckCircle },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-300 ${
                isActive ? 'text-violet-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-1 -mt-[1px] bg-violet-500 rounded-b-full shadow-[0_4px_12px_rgba(139,92,246,0.6)] animate-in fade-in zoom-in duration-300" />
              )}
              
              <Icon 
                className={`w-6 h-6 transition-transform duration-300 ${
                  isActive ? 'scale-110 stroke-[2.5] text-violet-500' : 'scale-100'
                }`} 
              />
              <span 
                className={`text-[10px] tracking-tight ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
