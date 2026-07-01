"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Home, Activity, Users, ShieldAlert, ArrowRight, CheckCircle2, Megaphone } from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardOverview() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    activeAlerts: 0,
    shelterCapacity: 0,
    hospitalBeds: 0,
    activeVolunteers: 0
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    // Load local state
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const shelters = await api.getShelters();
      const hospitals = await api.getHospitals();
      const volunteers = await api.getVolunteers();
      const notifs = await api.getNotifications();

      const totalCap = shelters.reduce((acc: number, curr: any) => acc + curr.capacity, 0) || 100;
      const totalOcc = shelters.reduce((acc: number, curr: any) => acc + curr.current_occupancy, 0) || 0;
      const occRate = Math.round((totalOcc / totalCap) * 100);

      const availableBeds = hospitals.reduce((acc: number, curr: any) => acc + curr.available_beds, 0) || 0;
      
      setSummary({
        activeAlerts: notifs.filter((n: any) => !n.is_read).length,
        shelterCapacity: occRate,
        hospitalBeds: availableBeds,
        activeVolunteers: volunteers.length
      });
      setNotifications(notifs.slice(0, 5));
    } catch (err) {
      console.error("Failed to load overview analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setBroadcasting(true);

    try {
      await api.broadcastAlert({
        title: "⚠️ " + broadcastTitle,
        message: broadcastMessage,
        type: "alert"
      });
      setBroadcastTitle("");
      setBroadcastMessage("");
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || "Citizen"}
          </h1>
          <p className="text-slate-400 mt-1">
            LifeBridge AI Operations Center is active. Real-time rescue data matched automatically.
          </p>
        </div>
        
        {/* Quick distress triggers */}
        <Link 
          href="/dashboard/requests?action=trigger-sos"
          className="px-5 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 text-sm shrink-0 border border-rose-500/20"
        >
          <ShieldAlert className="h-5 w-5 animate-pulse text-white" />
          Broadcast Quick SOS Distress
        </Link>
      </div>

      {/* Grid counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="p-6 bg-[#0b0c10] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-rose-950/50 transition-all">
          <div className="w-10 h-10 rounded-lg bg-rose-950/45 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-400">Unread Alert Logs</p>
          <p className="text-3xl font-extrabold text-white mt-1.5">{summary.activeAlerts}</p>
        </div>

        <div className="p-6 bg-[#0b0c10] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-amber-950/50 transition-all">
          <div className="w-10 h-10 rounded-lg bg-amber-950/45 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Home className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-400">Shelter Booking Rate</p>
          <p className="text-3xl font-extrabold text-white mt-1.5">{summary.shelterCapacity}%</p>
        </div>

        <div className="p-6 bg-[#0b0c10] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-emerald-950/50 transition-all">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/45 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <Activity className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-400">Available Trauma Beds</p>
          <p className="text-3xl font-extrabold text-white mt-1.5">{summary.hospitalBeds}</p>
        </div>

        <div className="p-6 bg-[#0b0c10] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-blue-950/50 transition-all">
          <div className="w-10 h-10 rounded-lg bg-blue-950/45 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-400">Registered Volunteers</p>
          <p className="text-3xl font-extrabold text-white mt-1.5">{summary.activeVolunteers}</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Broadcast alerts and responder tools */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Notifications feed */}
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-rose-500" />
              Latest Broadcast Notices &amp; Warnings
            </h2>
            
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No warnings or active notifications at this time.</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors ${
                      notif.is_read 
                        ? "bg-white/[0.01] border-white/5 text-slate-400" 
                        : "bg-rose-950/10 border-rose-500/20 text-slate-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{notif.title}</p>
                      <p className="text-xs leading-relaxed text-slate-400">{notif.message}</p>
                      <p className="text-[10px] text-slate-500 pt-1">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-300 text-[10px] font-bold uppercase transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#0b0c10]/40 backdrop-blur-sm">
            <h3 className="font-bold text-white mb-2 text-base">Disaster Safety Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Locate the nearest shelter and mark evacuation routes in advance.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Add at least 2 emergency contacts in your Profile configuration.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Keep clean drinking water and thermal blankets ready in dry storage.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Submit a detailed SOS Request if local rescue assistance is required.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Quick Action Widgets */}
        <div className="space-y-8">
          
          {/* Admin / Responder Broadcast Board */}
          {user?.role !== "citizen" && (
            <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Rescue Broadcast Console</h2>
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label htmlFor="b-title" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Alert Title
                  </label>
                  <input
                    id="b-title"
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g., Coastal Surge Advisory"
                    className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label htmlFor="b-msg" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Message Body
                  </label>
                  <textarea
                    id="b-msg"
                    rows={3}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Provide safety guidelines, locations to evacuate, etc."
                    className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold shadow-md shadow-rose-950/20 transition-all"
                >
                  {broadcasting ? "Broadcasting..." : "Dispatch Broadcast Warning"}
                </button>
              </form>
            </div>
          )}

          {/* Quick Contact Box */}
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white">National Disaster Helplines</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2.5">
                <span className="text-slate-400">Emergency Distress</span>
                <span className="font-bold text-rose-500">911</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2.5">
                <span className="text-slate-400">Red Cross Disaster Relief</span>
                <span className="font-bold text-slate-100">+1 (800) 733-2767</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-400">FEMA Support Helpline</span>
                <span className="font-bold text-slate-100">+1 (800) 621-3362</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
