'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckCircle, BarChart2, Settings, LogOut, User } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Habits', href: '/habits', icon: CheckCircle },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[240px] fixed inset-y-0 left-0 bg-card border-r border-border z-50 overflow-y-auto">
      {/* Logo Section */}
      <div className="p-6 h-20 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <CheckCircle className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
        <span className="text-2xl font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Habbit
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? 'bg-violet-500/10 text-violet-500 font-semibold' 
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-violet-500 rounded-r-full shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
              )}
              <Icon 
                className={`w-[22px] h-[22px] transition-transform duration-300 ${
                  isActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-110'
                }`} 
              />
              <span className="tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 mt-auto border-t border-border shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-secondary/30 border border-border/50 hover:border-border transition-colors">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-full blur opacity-50"></div>
            <div className="relative w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate tracking-tight text-foreground">Alex Doe</p>
            <p className="text-xs text-muted-foreground truncate font-medium">Pro Member</p>
          </div>
          <button 
            type="button"
            className="p-2.5 text-muted-foreground hover:text-destructive transition-colors rounded-xl hover:bg-destructive/10 shrink-0 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </aside>
  );
}
