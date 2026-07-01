"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LayoutDashboard, AlertTriangle, Home, Activity, Users, Package, UserCircle, LogOut, Sparkles, Map, Camera, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { ThemeToggle } from "./theme-toggle";

interface SidebarProps {
  onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    router.push("/");
    if (onMobileClose) onMobileClose();
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Emergency Copilot", href: "/dashboard/copilot", icon: Sparkles, highlight: true },
    { name: "Live Rescue Map", href: "/dashboard/map", icon: Map },
    { name: "Hazard Lens (AI)", href: "/dashboard/analyzer", icon: Camera },
    { name: "SOS Requests", href: "/dashboard/requests", icon: AlertTriangle, highlight: true },
    { name: "Shelters", href: "/dashboard/shelters", icon: Home },
    { name: "Hospitals", href: "/dashboard/hospitals", icon: Activity },
    { name: "Volunteers", href: "/dashboard/volunteers", icon: Users },
    { name: "Aid Resources", href: "/dashboard/resources", icon: Package },
    { name: "Profile & Contacts", href: "/dashboard/profile", icon: UserCircle },
  ];

  const roleColor = user?.role === "admin" 
    ? "bg-rose-500/10 text-rose-400 border border-rose-500/25" 
    : user?.role === "responder" 
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
      : "bg-blue-500/10 text-blue-400 border border-blue-500/25";

  return (
    <div className="w-64 h-full flex flex-col bg-[#0b0c10] border-r border-white/5 text-slate-300">
      
      {/* Sidebar Header Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-950/20">
          <Shield className="h-4.5 w-4.5 text-white stroke-[2.5]" />
        </div>
        <span className="font-extrabold text-lg tracking-tight text-white">
          LifeBridge<span className="text-rose-500">AI</span>
        </span>
      </div>

      {/* User Information Profile widget */}
      {user && (
        <div className="p-4 mx-3 my-4 bg-white/[0.02] border border-white/[0.04] rounded-xl shrink-0">
          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-500 truncate mb-2">{user.email}</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>
            {user.role}
          </span>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 py-2 overflow-y-auto">
        {[
          ...navItems,
          ...(user?.role === "admin" ? [{ name: "Admin Operations", href: "/dashboard/admin", icon: ShieldAlert, highlight: true }] : [])
        ].map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/[0.07] text-white border-l-2 border-rose-500"
                  : item.highlight
                    ? "text-rose-400 hover:bg-rose-950/20 hover:text-rose-300"
                    : "hover:bg-white/[0.03] text-slate-400 hover:text-slate-100"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${
                isActive 
                  ? "text-white" 
                  : item.highlight 
                    ? "text-rose-500" 
                    : "text-slate-400"
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer Controls */}
      <div className="p-4 border-t border-white/5 flex items-center justify-between gap-3 shrink-0">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 hover:bg-white/[0.04] rounded-lg text-slate-400 hover:text-rose-400 transition-colors text-sm font-medium"
          title="Sign Out"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

    </div>
  );
}
