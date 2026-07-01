"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Users,
  Home,
  ClipboardList,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  Trash2,
  HelpCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface AdminStats {
  requests_by_status: Record<string, number>;
  requests_by_type: Record<string, number>;
  total_requests: number;
  volunteers_active: number;
  volunteers_total: number;
  shelters: {
    total_capacity: number;
    total_occupancy: number;
    occupancy_rate: number;
  };
  hospitals: {
    total_beds: number;
    available_beds: number;
    utilization_rate: number;
  };
  inventory: Array<{ name: string; type: string; quantity: number; status: string }>;
  incident_trends: Array<{ day: string; incidents: number }>;
  average_response_time_min: number;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}

export default function AdminOperationsDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  
  // Custom Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastType, setBroadcastType] = useState("alert");
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u.role !== "admin") {
          router.push("/dashboard");
          return;
        }
      }
    }
    loadData();
  }, []);

  const loadData = async () => {
    setError("");
    try {
      const sData = await api.getAdminStats();
      const aLogs = await api.getAuditLogs();
      const allRequests = await api.getRequests();
      
      setStats(sData);
      setAuditLogs(aLogs);
      setRequests(allRequests.slice(0, 10)); // Top 10 requests
    } catch (err: any) {
      setError(err.message || "Failed to load admin analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateRequestStatus(id, newStatus);
      // Auto-refresh metrics
      loadData();
    } catch (err) {
      setError("Failed to update incident status.");
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;

    try {
      await api.broadcastAlert({
        title: broadcastTitle,
        message: broadcastMsg,
        type: broadcastType
      });
      setBroadcastSuccess(true);
      setBroadcastTitle("");
      setBroadcastMsg("");
      loadData(); // refresh audit log and stats
      setTimeout(() => setBroadcastSuccess(false), 3000);
    } catch (err) {
      setError("Failed to broadcast warning notice.");
    }
  };

  // Helper to draw SVG Line Chart path
  const getLinePath = (trends: Array<{ day: string, incidents: number }>) => {
    if (!trends || trends.length === 0) return "";
    const width = 500;
    const height = 150;
    const padding = 25;
    
    const maxVal = Math.max(...trends.map(t => t.incidents)) || 10;
    const xStep = (width - padding * 2) / (trends.length - 1);
    
    return trends.map((t, idx) => {
      const x = padding + idx * xStep;
      const y = height - padding - ((t.incidents / maxVal) * (height - padding * 2));
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-xs font-semibold animate-pulse">Assembling live operational statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-rose-500" />
            Admin Operations Command
          </h1>
          <p className="text-slate-400 mt-1">
            Production SaaS disaster management console. Live telemetry monitoring, incident audit logs, and resource metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-350 border border-white/10 flex items-center gap-1.5 text-xs transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-950/20 border border-rose-500/25 rounded-xl text-rose-350 text-xs">
          {error}
        </div>
      )}

      {/* operations counters */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute right-4 top-4 text-rose-500/10"><AlertTriangle className="h-10 w-10" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active SOS Incidents</p>
            <p className="text-3xl font-extrabold text-white mt-2">
              {stats.requests_by_status.pending + stats.requests_by_status.dispatched}
            </p>
            <span className="text-[10px] text-rose-400 font-semibold mt-1 inline-block">
              {stats.requests_by_status.pending} pending dispatch
            </span>
          </div>

          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute right-4 top-4 text-emerald-500/10"><Home className="h-10 w-10" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shelter Booking Rate</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats.shelters.occupancy_rate}%</p>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
              {stats.shelters.total_occupancy} / {stats.shelters.total_capacity} beds reserved
            </span>
          </div>

          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute right-4 top-4 text-blue-500/10"><Activity className="h-10 w-10" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trauma Bed Utilization</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats.hospitals.utilization_rate}%</p>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 inline-block">
              {stats.hospitals.available_beds} ICU beds operational
            </span>
          </div>

          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute right-4 top-4 text-amber-500/10"><Clock className="h-10 w-10" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Average Response Time</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats.average_response_time_min}m</p>
            <span className="text-[10px] text-amber-400 font-semibold mt-1 inline-block">
              Immediate satellite routing active
            </span>
          </div>

        </div>
      )}

      {/* Grid of charts & broad casting alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Analytics Line chart & Resource inventory */}
        {stats && (
          <div className="lg:col-span-2 space-y-8">
            
            {/* SVG Incident Trends line chart */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Incident Trends</h3>
              
              <div className="w-full h-44 relative bg-slate-950/20 rounded-xl overflow-hidden border border-white/5">
                <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="500" y2="25" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <line x1="0" y1="125" x2="500" y2="125" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                  {/* Trend Line */}
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                    d={getLinePath(stats.incident_trends)} 
                    fill="none" 
                    stroke="url(#lineGrad)" 
                    strokeWidth="3.5" 
                  />

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Day Labels Overlay */}
                <div className="absolute bottom-2 left-6 right-6 flex justify-between text-[9px] font-bold text-slate-500">
                  {stats.incident_trends.map(t => <span key={t.day}>{t.day}</span>)}
                </div>
              </div>
            </div>

            {/* Resource allocations bar chart */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Asset Allocations</h3>
              <div className="space-y-4">
                {stats.inventory.map((item, idx) => {
                  const maxQty = 5000;
                  const rate = Math.min((item.quantity / maxQty) * 100, 100);
                  return (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-350">
                        <span className="font-semibold text-slate-200">{item.name}</span>
                        <span>{item.quantity} Qty ({item.status})</span>
                      </div>
                      
                      <div className="w-full h-2 rounded bg-slate-900 border border-white/5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Broadcast warning controller (RBAC Admin panel) */}
        <div className="lg:col-span-1">
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-6 sticky top-24">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Broadcast Government Warning</h3>
              <p className="text-[10px] text-slate-500 mt-1">Transmit emergency alerts globally to all active citizens.</p>
            </div>

            {broadcastSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/25 rounded-xl text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                <span>Distress notice broadcasted.</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Alert Type</label>
                <select 
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-white"
                >
                  <option value="alert" className="bg-[#0b0c10]">🚨 Critical Alert</option>
                  <option value="weather" className="bg-[#0b0c10]">⛈️ Weather warning</option>
                  <option value="advisory" className="bg-[#0b0c10]">📢 Govt Advisory</option>
                  <option value="info" className="bg-[#0b0c10]">ℹ️ General Info</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Warning Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cyclone evacuation protocol active"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Incident Message Details</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="e.g. Cyclone advisory issued for coordinate grids. Residents advised to evacuate immediately..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                Transmit Public Warning
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* 2 columns for incident lists & live audit log terminal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Incident dispatcher panel */}
        <div className="xl:col-span-2 bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Incident Monitoring</h3>
          
          {requests.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No reported distress incidents at this time.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 capitalize">{r.emergency_type} Rescue Request</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        r.severity === "critical" ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-400"
                      }`}>
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed max-w-xl">{r.description}</p>
                    <p className="text-[10px] text-slate-500 pt-1">
                      Reported: {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions to dispatch or resolve */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, "dispatched")}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
                      >
                        Dispatch Responders
                      </button>
                    )}
                    {r.status === "dispatched" && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, "resolved")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {r.status === "resolved" && (
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time terminal log viewer */}
        <div className="xl:col-span-1 bg-black border border-white/10 rounded-2xl p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Terminal Audit Logs</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="flex-grow overflow-y-auto pt-4 space-y-3 font-mono text-[10px] text-slate-400 scrollbar-thin">
            {auditLogs.length === 0 ? (
              <p className="text-slate-650 italic">No terminal audit outputs recorded.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="space-y-0.5">
                  <p className="text-emerald-500 font-semibold">[ {log.action} ]</p>
                  <p className="text-slate-300">{log.details}</p>
                  <p className="text-slate-600 text-[8px]">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
