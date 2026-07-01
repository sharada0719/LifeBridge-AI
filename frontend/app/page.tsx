"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, AlertTriangle, MapPin, Activity, Heart, Users, ExternalLink, ArrowRight, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";

export default function LandingPage() {
  const [stats, setStats] = useState({
    activeAlerts: 2,
    shelterCapacity: "68%",
    hospitalBeds: 95,
    activeVolunteers: 18
  });

  useEffect(() => {
    // Load fresh data if API/localStorage mock has it
    const shelters = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("lb_shelters") || "[]") : [];
    const hospitals = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("lb_hospitals") || "[]") : [];
    const volunteers = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("lb_volunteers") || "[]") : [];
    const alerts = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("lb_notifications") || "[]") : [];

    const totalShelterCap = shelters.reduce((acc: number, curr: any) => acc + curr.capacity, 0) || 800;
    const totalShelterOcc = shelters.reduce((acc: number, curr: any) => acc + curr.current_occupancy, 0) || 170;
    const availBeds = hospitals.reduce((acc: number, curr: any) => acc + curr.available_beds, 0) || 95;

    const occupancyRate = totalShelterCap > 0 ? Math.round((totalShelterOcc / totalShelterCap) * 100) : 21;

    setStats({
      activeAlerts: alerts.length || 2,
      shelterCapacity: `${occupancyRate}%`,
      hospitalBeds: availBeds,
      activeVolunteers: volunteers.length || 2
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white relative overflow-hidden">
      
      {/* Radiant Glow Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-950/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-red-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-orange-950/15 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#060608]/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/30">
              <Shield className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                LifeBridge<span className="text-rose-500">AI</span>
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">Emergency Agents</a>
            <a href="#dashboard" className="hover:text-slate-100 transition-colors">Operations Control</a>
            <a href="#about" className="hover:text-slate-100 transition-colors">Network Shelters</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/login" 
              className="text-sm font-semibold hover:text-white text-slate-400 transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-semibold bg-white text-black hover:bg-slate-200 transition-all rounded-lg px-4 py-2 shadow-sm font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          
          {/* Active Alert Banner */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/40 border border-rose-900/30 text-rose-300 text-xs font-semibold tracking-wide mb-8 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <AlertTriangle className="h-3.5 w-3.5" />
            Active Warning: Flood Evacuation Protocol Level II Active
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-5xl mx-auto">
            Intelligent Disaster Response &amp; <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Emergency Assistance Network
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            LifeBridge AI coordinates disaster rescue efforts in real-time. Powering immediate SOS dispatches, shelter matching, hospital bed intelligence, and emergency medical guidelines.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/login?redirect=sos"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base transition-all hover:scale-[1.02] shadow-xl shadow-rose-950/45 flex items-center justify-center gap-2 group"
            >
              Initiate SOS Request
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-semibold text-base transition-all border border-slate-800 flex items-center justify-center gap-2"
            >
              Access Responders Portal
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Real-time Status Panel Widgets */}
          <div id="dashboard" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto mb-28">
            <div className="bg-[#0b0c10]/70 border border-white/5 rounded-2xl p-6 text-left relative overflow-hidden backdrop-blur-sm group hover:border-rose-950/40 transition-colors">
              <div className="absolute right-4 top-4 text-rose-500/20 group-hover:text-rose-500/30 transition-colors">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Broadcast Alerts</p>
              <p className="text-3xl font-extrabold text-white mt-2">{stats.activeAlerts}</p>
              <div className="flex items-center gap-1.5 mt-3 text-rose-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Active Alerts Area
              </div>
            </div>

            <div className="bg-[#0b0c10]/70 border border-white/5 rounded-2xl p-6 text-left relative overflow-hidden backdrop-blur-sm group hover:border-amber-950/40 transition-colors">
              <div className="absolute right-4 top-4 text-amber-500/20 group-hover:text-amber-500/30 transition-colors">
                <MapPin className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shelter Occupancy</p>
              <p className="text-3xl font-extrabold text-white mt-2">{stats.shelterCapacity}</p>
              <div className="flex items-center gap-1.5 mt-3 text-amber-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Capacity Reserved
              </div>
            </div>

            <div className="bg-[#0b0c10]/70 border border-white/5 rounded-2xl p-6 text-left relative overflow-hidden backdrop-blur-sm group hover:border-emerald-950/40 transition-colors">
              <div className="absolute right-4 top-4 text-emerald-500/20 group-hover:text-emerald-500/30 transition-colors">
                <Activity className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Hospital Beds</p>
              <p className="text-3xl font-extrabold text-white mt-2">{stats.hospitalBeds}</p>
              <div className="flex items-center gap-1.5 mt-3 text-emerald-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ICU/Emergency Open
              </div>
            </div>

            <div className="bg-[#0b0c10]/70 border border-white/5 rounded-2xl p-6 text-left relative overflow-hidden backdrop-blur-sm group hover:border-blue-950/40 transition-colors">
              <div className="absolute right-4 top-4 text-blue-500/20 group-hover:text-blue-500/30 transition-colors">
                <Users className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dispatched Volunteers</p>
              <p className="text-3xl font-extrabold text-white mt-2">{stats.activeVolunteers}</p>
              <div className="flex items-center gap-1.5 mt-3 text-blue-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Active Personnel
              </div>
            </div>
          </div>

          {/* Features / Agent Roles Grid */}
          <div id="features" className="max-w-6xl mx-auto pt-16">
            <div className="text-left mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-4">
                Multi-Agent Intelligence Network
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl">
                Our specialized systems act as co-responders, assisting with navigation, resource deployment, and medical instructions instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="p-8 rounded-2xl border border-white/5 bg-[#0b0c10]/40 backdrop-blur-sm text-left hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-orange-950/45 border border-orange-500/25 flex items-center justify-center text-orange-400 mb-6">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Safe Route Optimization</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Real-time mapping system calculates navigation routes bypassing active flood hazards, mudslides, or roadblocks to ensure safe transit.
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-white/5 bg-[#0b0c10]/40 backdrop-blur-sm text-left hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-red-950/45 border border-red-500/25 flex items-center justify-center text-red-400 mb-6">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Medical Guidance Agent</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Provides offline-capable first-aid instructions, toxic water safety rules, and triage workflows prior to responder arrival.
                </p>
              </div>

              <div className="p-8 rounded-2xl border border-white/5 bg-[#0b0c10]/40 backdrop-blur-sm text-left hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/45 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Resource Allocation</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Tracks medical kits, drinking water, meals, and blankets dynamically, routing relief materials to communities in high distress.
                </p>
              </div>

            </div>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#040406] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-rose-600 flex items-center justify-center text-[10px] font-bold text-white">
              LB
            </div>
            <span className="text-slate-300 font-bold text-sm tracking-wider">
              LifeBridge AI
            </span>
          </div>
          
          <p className="text-xs text-slate-500">
            &copy; 2026 LifeBridge AI. Built for disaster resilience and humanitarian aid coordination.
          </p>

          <div className="flex gap-6 text-xs text-slate-500 font-medium">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">GitHub Repository</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
