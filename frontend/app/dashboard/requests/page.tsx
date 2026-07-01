"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, MapPin, Loader2, CheckCircle2, Navigation, Send, ArrowRight, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

function RequestsContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  
  // Form State
  const [emergencyType, setEmergencyType] = useState("flood");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number>(40.7128);
  const [longitude, setLongitude] = useState<number>(-74.0060);
  const [fetchingGPS, setFetchingGPS] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // List State
  const [requests, setRequests] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
    }

    // Auto-detect if SOS was quick-triggered
    const action = searchParams.get("action");
    if (action === "trigger-sos") {
      getGPSLocation();
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      if (user?.role === "citizen") {
        const myReqs = await api.getMyRequests();
        setRequests(myReqs);
      } else {
        const allReqs = await api.getRequests();
        setRequests(allReqs);
      }
    } catch (err: any) {
      setError("Failed to fetch requests.");
    }
  };

  const getGPSLocation = () => {
    setFetchingGPS(true);
    setError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setFetchingGPS(false);
        },
        () => {
          setError("Failed to acquire GPS. Used default coordinates.");
          setFetchingGPS(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setFetchingGPS(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.createRequest({
        emergency_type: emergencyType,
        severity,
        description,
        latitude,
        longitude
      });
      setSuccess("Your Emergency SOS signal has been transmitted successfully. First Responders have been notified.");
      setDescription("");
      loadRequests();
    } catch (err: any) {
      setError(err.message || "Failed to transmit SOS signal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateRequestStatus(id, newStatus);
      loadRequests();
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const severityColor = (sev: string) => {
    switch (sev) {
      case "critical": return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "medium": return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default: return "bg-slate-500/10 text-slate-400 border-white/5";
    }
  };

  const statusColor = (stat: string) => {
    switch (stat) {
      case "resolved": return "text-emerald-400 bg-emerald-500/10";
      case "dispatched": return "text-blue-400 bg-blue-500/10";
      default: return "text-amber-400 bg-amber-500/10";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
          Emergency SOS Distress Hub
        </h1>
        <p className="text-slate-400 mt-1">
          {user?.role === "citizen" 
            ? "Submit distress signals instantly. Your physical coordinates will be mapped for rescue personnel."
            : "Review, filter and dispatch personnel to active distress locations."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOS Submission Form - Citizens get priority input */}
        <div className="lg:col-span-1">
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-6 sticky top-24">
            <div>
              <h2 className="text-lg font-bold text-white">Transmit Distress Signal</h2>
              <p className="text-xs text-slate-500 mt-1">Fill this out immediately for assistance.</p>
            </div>

            {error && (
              <div className="bg-rose-950/30 border border-rose-900/30 rounded-lg p-3 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-3 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Emergency Type</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="flood" className="bg-[#0b0c10]">Flood Assistance</option>
                  <option value="earthquake" className="bg-[#0b0c10]">Earthquake Rescue</option>
                  <option value="fire" className="bg-[#0b0c10]">Fire &amp; Hazards</option>
                  <option value="cyclone" className="bg-[#0b0c10]">Cyclone Relief</option>
                  <option value="landslide" className="bg-[#0b0c10]">Landslide / Roadblock</option>
                  <option value="medical" className="bg-[#0b0c10]">Medical Emergency</option>
                  <option value="other" className="bg-[#0b0c10]">Other Rescue Assistance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity Priority</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {["medium", "high", "critical"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`py-1.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                        severity === lvl
                          ? lvl === "critical"
                            ? "bg-rose-600 border-rose-500 text-white"
                            : lvl === "high"
                              ? "bg-orange-600 border-orange-500 text-white"
                              : "bg-amber-600 border-amber-500 text-white"
                          : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Describe Distress Situation</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="State number of people trapped, health conditions, water level height, immediate medical requirements, etc."
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-650 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Rescue Coordinates</label>
                  <button
                    type="button"
                    onClick={getGPSLocation}
                    disabled={fetchingGPS}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors flex items-center gap-1"
                  >
                    {fetchingGPS ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-3 w-3" />
                        Detect GPS
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <div>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      placeholder="Latitude"
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      placeholder="Longitude"
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-rose-950/20 transition-all flex items-center justify-center gap-1.5"
              >
                {submitting ? "Transmitting..." : "Broadcast Distress (SOS)"}
                {!submitting && <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* SOS Signals List - Responder view sees all, citizen sees own */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">
                {user?.role === "citizen" ? "Your Distress Transmissions" : "Active Regional Distress Board"}
              </h2>
              <span className="text-xs bg-white/[0.04] px-2.5 py-1 rounded text-slate-400 font-medium">
                {requests.length} Requests Total
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No distress signals registered.</p>
                <p className="text-xs text-slate-500 mt-1">Submit the SOS Form to request rescue assistance.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4 hover:border-white/10 transition-colors">
                    
                    {/* Top Row: Type, Severity, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white capitalize">{req.emergency_type} Support</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${severityColor(req.severity)}`}>
                          {req.severity}
                        </span>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-300 leading-relaxed bg-[#060608]/40 p-3 rounded-xl border border-white/[0.02]">
                      {req.description}
                    </p>

                    {/* GPS Coordinates */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>GPS: [{req.latitude.toFixed(5)}, {req.longitude.toFixed(5)}]</span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span>{new Date(req.created_at).toLocaleString()}</span>
                    </div>

                    {/* Responder Action Bar */}
                    {user?.role !== "citizen" && req.status !== "resolved" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.03]">
                        {req.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, "dispatched")}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            Dispatch Responders
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {req.status === "dispatched" && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, "resolved")}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
                          >
                            Mark as Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading SOS distress workspace...</div>}>
      <RequestsContent />
    </Suspense>
  );
}
