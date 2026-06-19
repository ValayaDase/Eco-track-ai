"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard,
  CalendarRange,
  Cpu,
  Sparkles,
  Trophy,
  TrendingUp,
  Medal,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Leaf,
  ChevronRight,
} from "lucide-react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Activity Tracker", href: "/tracker", icon: CalendarRange },
  { label: "Carbon Simulator", href: "/simulator", icon: Cpu },
  { label: "AI Recommendations", href: "/recommendations", icon: Sparkles },
  { label: "Eco Challenges", href: "/challenges", icon: Trophy },
  { label: "Analytics Reports", href: "/reports", icon: TrendingUp },
  { label: "Leaderboard", href: "/leaderboard", icon: Medal },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; points: number } | null>(null);

  // Fetch active session info
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Layout load user error:", err);
      }
    }
    fetchUser();
  }, [pathname, router]);

  // Ensure dark class is not on document root
  useEffect(() => {
    window.document.documentElement.classList.remove("dark");
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/login");
        router.refresh();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-250">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border h-16 px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Menu className="size-5" />
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-wider text-[#042b44]">
            <span className="size-8 rounded-lg bg-gradient-to-tr from-[#096b90] to-[#71b7d5] flex items-center justify-center text-white">
              <Leaf className="size-5 fill-current" />
            </span>
            <span className="bg-gradient-to-r from-[#096b90] to-[#042b44] bg-clip-text text-transparent text-lg font-extrabold hidden sm:inline-block">
              EcoTrack AI
            </span>
          </Link>
        </div>

        {/* Action icons & Profile */}
        <div className="flex items-center gap-4">
          {/* Points Counter */}
          {user && (
            <div className="hidden xs:flex items-center gap-1.5 bg-[#096b90]/10 border border-[#dcecf3] px-3 py-1 rounded-full text-xs font-bold text-[#096b90]">
              <Trophy className="size-3.5 fill-current text-[#096b90] animate-pulse" />
              <span>{user.points} XP</span>
            </div>
          )}

          {/* Notifications bell */}
          <button
            onClick={() => toast.info("No new notifications")}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg bg-muted/40 border border-border relative cursor-pointer transition-colors"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent-blue animate-ping" />
          </button>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-full border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <div className="size-7 rounded-full bg-secondary-blue flex items-center justify-center font-bold text-white text-xs">
                {user ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="size-4" />}
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  {/* Backdrop Clicker */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 z-50 w-56 bg-card border border-border rounded-xl shadow-xl p-2"
                  >
                    <div className="px-3 py-2 border-b border-border/60 mb-2">
                      <p className="text-sm font-bold text-foreground leading-none">{user?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/settings"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserIcon className="size-4 text-muted-foreground" />
                      <span>My Profile Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="size-4" />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col p-4 space-y-2 select-none shrink-0">
          <div className="flex-1 space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all group ${
                    isActive
                      ? "bg-secondary-blue/15 border border-secondary-blue/30 text-accent-blue shadow-inner"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`size-4.5 transition-transform group-hover:scale-110 ${isActive ? "text-accent-blue" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="size-4" />}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 border-t border-border/60">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-bold text-red-400/90 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="size-4.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 z-50 bg-black md:hidden"
              />

              {/* Sidebar Menu */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border p-4 flex flex-col space-y-4 shadow-2xl md:hidden"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2 font-bold tracking-wider">
                    <Leaf className="size-5 text-accent-blue fill-current" />
                    <span className="bg-gradient-to-r from-accent-blue to-light-accent bg-clip-text text-transparent">
                      EcoTrack AI
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1 hover:bg-muted rounded cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-1">
                  {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          isActive
                            ? "bg-secondary-blue/15 border border-secondary-blue/30 text-accent-blue"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="size-4.5" />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="size-4" />}
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-border/60">
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-bold text-red-400/90 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-4.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Page Content Workspace */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
