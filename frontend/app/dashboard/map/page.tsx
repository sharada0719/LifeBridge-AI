"use client";

import React, { useState, useEffect } from "react";
import { 
  Map, Eye, EyeOff, Info, AlertTriangle, ShieldAlert, Plus, 
  CheckCircle, Landmark, Shield, Home, Activity, Users, Flame, 
  MapPin, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface MapMarker {
  id: string;
  name: string;
  type: "hospital" | "shelter" | "police" | "relief_camp" | "volunteer" | "blocked_road" | "flood_zone" | "fire_zone";
  x: number; // percentage coordinate on map canvas (0-100)
  y: number; // percentage coordinate on map canvas (0-100)
  details: string;
  contact?: string;
}

export default function LiveDisasterMap() {
  const [markers, setMarkers] = useState<MapMarker[]>([
    // Hospitals
    { id: "h1", name: "Metro General Trauma Hospital", type: "hospital", x: 25, y: 35, details: "48 available trauma beds. ICU operational.", contact: "+1 (555) 911-0100" },
    { id: "h2", name: "Hope Medical Emergency Center", type: "hospital", x: 72, y: 18, details: "12 available beds. Specialized burn ward active.", contact: "+1 (555) 911-0200" },
    
    // Shelters
    { id: "s1", name: "Community Safe Haven - West Wing", type: "shelter", x: 15, y: 65, details: "45 / 250 occupancy. Drinking water & power available.", contact: "+1 (555) 123-4567" },
    { id: "s2", name: "St. Jude Emergency Center", type: "shelter", x: 80, y: 75, details: "110 / 150 occupancy. Running low on water rations.", contact: "+1 (555) 987-6543" },
    
    // Police Stations
    { id: "p1", name: "Central Police Precinct", type: "police", x: 45, y: 48, details: "Search & rescue response dispatch headquarters.", contact: "+1 (555) 111-2222" },
    { id: "p2", name: "North Police Outpost", type: "police", x: 55, y: 15, details: "Patrol teams active. Coordinating roadblocks.", contact: "+1 (555) 111-3333" },

    // Relief Camps
    { id: "rc1", name: "Red Cross Water & Food Camp A", type: "relief_camp", x: 38, y: 80, details: "Supplying MRE meals, blankets and fresh water.", contact: "+1 (555) 011-2233" },
    
    // Volunteers
    { id: "v1", name: "Rescue Volunteer - Marcus (First Aid)", type: "volunteer", x: 22, y: 45, details: "Active. Equipped with medical kit & thermal blankets." },
    { id: "v2", name: "Rescue Volunteer - Priya (Water Rescue)", type: "volunteer", x: 18, y: 58, details: "Active. Operating inflatable raft near West Wing." },
    { id: "v3", name: "Rescue Volunteer - David (Driving)", type: "volunteer", x: 62, y: 42, details: "Active. Operating emergency transport truck." },

    // Hazards (Initial)
    { id: "hz1", name: "West Wing Coastal Flood Zone", type: "flood_zone", x: 12, y: 60, details: "Pulsing animated flood waters up to 4ft. Avoid low-lying grounds." },
    { id: "hz2", name: "Industrial District Fire Zone", type: "fire_zone", x: 68, y: 52, details: "Structural warehouse fire. Avoid inhaling smoke fumes." },
    { id: "hz3", name: "Blocked Route: River Delta Highway", type: "blocked_road", x: 42, y: 32, details: "Roadway fully blocked due to landslide debris." }
  ]);

  // Filters state
  const [filters, setFilters] = useState({
    hospitals: true,
    shelters: true,
    police: true,
    relief_camps: true,
    volunteers: true,
    hazards: true
  });

  // Selected Marker for detail panel
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Custom Report state
  const [reportMode, setReportMode] = useState(false);
  const [reportX, setReportX] = useState<number | null>(null);
  const [reportY, setReportY] = useState<number | null>(null);
  const [reportType, setReportType] = useState<"flood_zone" | "fire_zone" | "blocked_road">("blocked_road");
  const [reportName, setReportName] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  // Sync state (Online check)
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!reportMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setReportX(Math.round(x));
    setReportY(Math.round(y));
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName || !reportDesc || reportX === null || reportY === null) return;

    const newMarker: MapMarker = {
      id: "user-hz-" + Math.random().toString(36).substring(4),
      name: reportName,
      type: reportType,
      x: reportX,
      y: reportY,
      details: reportDesc
    };

    setMarkers((prev) => [...prev, newMarker]);

    // Send warning trigger request to authority database
    try {
      await api.createRequest({
        emergency_type: reportType === "flood_zone" ? "flood" : reportType === "fire_zone" ? "fire" : "landslide",
        severity: "high",
        description: `Map reported hazard: ${reportName}. ${reportDesc}`,
        latitude: 40.7128 + (reportY - 50) * 0.001, // Convert percentage to dummy coordinates
        longitude: -74.0060 + (reportX - 50) * 0.001
      });
    } catch (err) {
      console.error("Failed to post reported hazard to backend requests queue:", err);
    }

    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setReportMode(false);
      setReportX(null);
      setReportY(null);
      setReportName("");
      setReportDesc("");
    }, 2000);
  };

  const isVisible = (marker: MapMarker) => {
    if (marker.type === "hospital" && !filters.hospitals) return false;
    if (marker.type === "shelter" && !filters.shelters) return false;
    if (marker.type === "police" && !filters.police) return false;
    if (marker.type === "relief_camp" && !filters.relief_camps) return false;
    if (marker.type === "volunteer" && !filters.volunteers) return false;
    if (["flood_zone", "fire_zone", "blocked_road"].includes(marker.type) && !filters.hazards) return false;
    return true;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Map className="h-8 w-8 text-rose-500" />
            Live Disaster Rescue Map
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time interactive control panel detailing hazard zones, blocked routes, operational shelters, and emergency support.
          </p>
        </div>

        {/* Offline Badge */}
        {!isOnline && (
          <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/35 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-bold animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span>Map Offline Mode Active (Cached Data Loaded)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Map Canvas Grid */}
        <div className="xl:col-span-3 flex flex-col bg-[#0b0c10]/70 border border-white/5 rounded-2xl overflow-hidden relative">
          
          {/* Top Panel Instructions */}
          <div className="px-4 py-2 border-b border-white/5 bg-slate-950/20 text-xs text-slate-400 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-400" />
              <span>
                {reportMode 
                  ? "Click anywhere on the map grid to place a hazard marker." 
                  : "Hover or click on markers to view operational details and contacts."}
              </span>
            </div>
            {reportMode && (
              <button 
                onClick={() => { setReportMode(false); setReportX(null); setReportY(null); }}
                className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold uppercase text-[9px]"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Map Grid Container */}
          <div 
            onClick={handleMapClick}
            className={`w-full aspect-[16/9] relative bg-[#07080b] overflow-hidden cursor-pointer selection:bg-none ${
              reportMode ? "cursor-crosshair border-2 border-rose-500/40" : ""
            }`}
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          >
            {/* Draw Roads Map Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              {/* Main Expressway */}
              <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="6" />
              <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#475569" strokeWidth="2" strokeDasharray="5,5" />
              
              {/* North-South Freeway */}
              <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#1e293b" strokeWidth="6" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#475569" strokeWidth="2" strokeDasharray="5,5" />

              {/* Blocked Delta Freeway */}
              <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="#b91c1c" strokeWidth="4" strokeDasharray="3,3" />
            </svg>

            {/* Pulsing Hazard Zones */}
            {filters.hazards && (
              <>
                {/* Coastal Flood area */}
                <div 
                  className="absolute rounded-full bg-blue-500/10 border-2 border-blue-500/25 blur-sm pointer-events-none animate-pulse"
                  style={{ left: "6%", top: "45%", width: "24%", height: "30%" }}
                />
                {/* Industrial Fire area */}
                <div 
                  className="absolute rounded-full bg-red-500/10 border-2 border-red-500/25 blur-sm pointer-events-none animate-pulse"
                  style={{ left: "58%", top: "40%", width: "18%", height: "26%", animationDuration: "1.5s" }}
                />
              </>
            )}

            {/* Render Active Markers */}
            <AnimatePresence>
              {markers.filter(isVisible).map((m) => {
                let colorClass = "bg-slate-700 border-slate-500 text-white";
                let Icon = HelpCircle;

                if (m.type === "hospital") {
                  colorClass = "bg-blue-600/90 border-blue-400 text-white shadow-lg shadow-blue-500/20";
                  Icon = Activity;
                } else if (m.type === "shelter") {
                  colorClass = "bg-emerald-600/90 border-emerald-400 text-white shadow-lg shadow-emerald-500/20";
                  Icon = Home;
                } else if (m.type === "police") {
                  colorClass = "bg-slate-800 border-slate-600 text-slate-300";
                  Icon = Shield;
                } else if (m.type === "relief_camp") {
                  colorClass = "bg-amber-600/90 border-amber-400 text-white shadow-lg shadow-amber-500/20";
                  Icon = Landmark;
                } else if (m.type === "volunteer") {
                  colorClass = "bg-orange-500 border-orange-350 text-white animate-bounce";
                  Icon = Users;
                } else if (m.type === "flood_zone") {
                  colorClass = "bg-blue-950/70 border-blue-500 text-blue-400 animate-pulse";
                  Icon = ShieldAlert;
                } else if (m.type === "fire_zone") {
                  colorClass = "bg-red-950/70 border-red-500 text-red-500 animate-pulse";
                  Icon = Flame;
                } else if (m.type === "blocked_road") {
                  colorClass = "bg-orange-950/80 border-orange-600 text-orange-500";
                  Icon = AlertTriangle;
                }

                const isSelected = selectedMarker?.id === m.id;

                return (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    key={m.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!reportMode) setSelectedMarker(m);
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border flex items-center justify-center transition-all z-10 hover:scale-125 ${colorClass} ${
                      isSelected ? "ring-2 ring-white scale-125 z-20" : ""
                    }`}
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                    title={m.name}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {/* Custom Report Mode Temp Marker */}
            {reportMode && reportX !== null && reportY !== null && (
              <div 
                className="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-rose-600 border border-rose-400 text-white animate-ping z-20"
                style={{ left: `${reportX}%`, top: `${reportY}%` }}
              >
                <MapPin className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Map Controls, Filters & Details */}
        <div className="space-y-6">
          
          {/* 1. Selected Marker Details */}
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-5 min-h-[160px] flex flex-col justify-between">
            {selectedMarker ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">
                    {selectedMarker.type.replace("_", " ")} info
                  </span>
                  <h3 className="font-extrabold text-white text-sm mt-0.5">{selectedMarker.name}</h3>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed">{selectedMarker.details}</p>
                
                {selectedMarker.contact && (
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-slate-500">Emergency Line:</span>
                    <a 
                      href={`tel:${selectedMarker.contact}`}
                      className="flex items-center gap-1 text-xs text-rose-400 font-bold hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {selectedMarker.contact}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500 flex-grow">
                <HelpCircle className="h-8 w-8 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold">No details active</p>
                <p className="text-[10px] mt-0.5">Click any coordinate marker on the map board.</p>
              </div>
            )}
          </div>

          {/* 2. Layer Toggle Filters */}
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Map Layer Filters</h3>
            <div className="space-y-2 text-xs">
              
              <button 
                onClick={() => toggleFilter("hospitals")}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  filters.hospitals 
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-300 font-bold" 
                    : "bg-white/[0.01] border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Trauma Hospitals</span>
                </div>
                <span>{filters.hospitals ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</span>
              </button>

              <button 
                onClick={() => toggleFilter("shelters")}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  filters.shelters 
                    ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-300 font-bold" 
                    : "bg-white/[0.01] border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Designated Shelters</span>
                </div>
                <span>{filters.shelters ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</span>
              </button>

              <button 
                onClick={() => toggleFilter("police")}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  filters.police 
                    ? "bg-slate-800 border-slate-700 text-slate-350 font-bold" 
                    : "bg-white/[0.01] border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Police Stations</span>
                </div>
                <span>{filters.police ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</span>
              </button>

              <button 
                onClick={() => toggleFilter("relief_camps")}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  filters.relief_camps 
                    ? "bg-amber-600/10 border-amber-500/30 text-amber-300 font-bold" 
                    : "bg-white/[0.01] border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  <span>Relief Camps</span>
                </div>
                <span>{filters.relief_camps ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</span>
              </button>

              <button 
                onClick={() => toggleFilter("volunteers")}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  filters.volunteers 
                    ? "bg-orange-600/10 border-orange-500/30 text-orange-350 font-bold" 
                    : "bg-white/[0.01] border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Rescue Volunteers</span>
                </div>
                <span>{filters.volunteers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</span>
              </button>

              <button 
                onClick={() => toggleFilter("hazards")}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  filters.hazards 
                    ? "bg-rose-600/10 border-rose-500/30 text-rose-350 font-bold animate-pulse" 
                    : "bg-white/[0.01] border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Active Hazard Zones</span>
                </div>
                <span>{filters.hazards ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</span>
              </button>

            </div>
          </div>

          {/* 3. Report Hazard mode selector */}
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-5 space-y-4">
            {!reportMode ? (
              <button 
                onClick={() => setReportMode(true)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Report Hazard Coordinate
              </button>
            ) : (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Report mode active</span>
                {reportX === null || reportY === null ? (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Please click anywhere on the vector grid map to specify the hazard coordinates.
                  </p>
                ) : (
                  <form onSubmit={handleCreateReport} className="space-y-3 text-xs">
                    {reportSuccess && (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/25 rounded-lg text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>Hazard registered.</span>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-slate-500">Placement: x={reportX}%, y={reportY}%</p>
                    </div>
                    <div>
                      <label className="block text-slate-500 uppercase tracking-wide text-[9px] font-bold">Hazard Type</label>
                      <select 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as any)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded bg-white/[0.02] border border-white/10 text-white text-xs"
                      >
                        <option value="blocked_road" className="bg-[#0b0c10]">Blocked Road</option>
                        <option value="flood_zone" className="bg-[#0b0c10]">Flood Zone</option>
                        <option value="fire_zone" className="bg-[#0b0c10]">Fire Zone</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 uppercase tracking-wide text-[9px] font-bold">Title Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Broken Bridge roadblock" 
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded bg-white/[0.02] border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 uppercase tracking-wide text-[9px] font-bold">Hazard Details</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. East branch bridge collapsed under weight of water."
                        value={reportDesc}
                        onChange={(e) => setReportDesc(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded bg-white/[0.02] border border-white/10 text-white text-xs resize-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                    >
                      Transmit Warning
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
