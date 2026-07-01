"use client";

import React, { useEffect, useState } from "react";
import { Shield, Home, Users, MapPin, Phone, Edit, Plus, CheckCircle, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export default function SheltersPage() {
  const [user, setUser] = useState<any>(null);
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOccupancy, setEditOccupancy] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form fields
  const [name, setName] = useState("");
  const [locationDesc, setLocationDesc] = useState("");
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.006);
  const [capacity, setCapacity] = useState(150);
  const [contactInfo, setContactInfo] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
    }
    loadShelters();
  }, []);

  const loadShelters = async () => {
    try {
      const data = await api.getShelters();
      setShelters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateShelterOccupancy(id, editOccupancy);
      setEditingId(null);
      setSuccess("Shelter occupancy updated successfully.");
      loadShelters();
    } catch (err) {
      setError("Failed to update shelter occupancy.");
    }
  };

  const handleAddShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.createShelter({
        name,
        location_desc: locationDesc,
        latitude,
        longitude,
        capacity,
        current_occupancy: 0,
        contact_info: contactInfo
      });
      setSuccess("New emergency shelter added to grid.");
      setShowAddForm(false);
      setName("");
      setLocationDesc("");
      setContactInfo("");
      loadShelters();
    } catch (err) {
      setError("Failed to register shelter.");
    }
  };

  const totalCap = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalOcc = shelters.reduce((acc, s) => acc + s.current_occupancy, 0);
  const totalAvail = totalCap - totalOcc;

  return (
    <div className="space-y-8 max-w-6xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Home className="h-8 w-8 text-amber-500" />
            Emergency Safe Shelters
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time occupancy tracking for active storm havens and community crisis points.
          </p>
        </div>

        {user?.role !== "citizen" && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold shadow-md shadow-amber-950/20 transition-all flex items-center justify-center gap-1.5 shrink-0 border border-amber-500/20"
          >
            <Plus className="h-4.5 w-4.5" />
            Add New Shelter
          </button>
        )}
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Grid Capacity</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCap} beds</p>
        </div>
        <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Currently Occupied</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totalOcc} occupants</p>
        </div>
        <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Available Spots</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totalAvail} spots left</p>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-lg text-emerald-300 text-xs">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/30 border border-rose-900/30 rounded-lg text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Add New Shelter Modal-like block */}
      {showAddForm && (
        <div className="bg-[#0b0c10] border border-amber-500/20 rounded-2xl p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Register New Emergency Safe Zone</h2>
          <form onSubmit={handleAddShelter} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Shelter Facility Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oak Street Secondary Gym"
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Location / Directions Description</label>
              <input
                type="text"
                required
                value={locationDesc}
                onChange={(e) => setLocationDesc(e.target.value)}
                placeholder="e.g. Corner of Oak and 4th, entrance facing east"
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Maximum Capacity</label>
              <input
                type="number"
                required
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact / Agency Helpline</label>
              <input
                type="text"
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. +1 (555) 123-9900"
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2 pt-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold shadow-md transition-all"
              >
                Register Safe Haven
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-900 border border-white/10 text-slate-300 rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shelters Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shelters.map((shelter) => {
          const occPercent = Math.min(100, Math.round((shelter.current_occupancy / shelter.capacity) * 100));
          const isHigh = occPercent >= 80;
          const isFull = occPercent >= 100;

          return (
            <div 
              key={shelter.id} 
              className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 flex flex-col justify-between gap-5 relative group hover:border-white/10 transition-colors"
            >
              
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-white text-base truncate pr-2" title={shelter.name}>
                    {shelter.name}
                  </h3>
                  {isFull ? (
                    <span className="shrink-0 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase">
                      At Capacity
                    </span>
                  ) : isHigh ? (
                    <span className="shrink-0 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase">
                      Near Limit
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                      Spots Open
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>{shelter.location_desc}</span>
                </p>
                {shelter.contact_info && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>{shelter.contact_info}</span>
                  </p>
                )}
              </div>

              {/* Progress/Capacity Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Beds booked:</span>
                  <span className="font-bold text-white">{shelter.current_occupancy} / {shelter.capacity} ({occPercent}%)</span>
                </div>
                <div className="w-full h-2 rounded bg-white/[0.04] overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? "bg-rose-500" : isHigh ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${occPercent}%` }}
                  />
                </div>
              </div>

              {/* Responder Editing Operations */}
              {user?.role !== "citizen" && (
                <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between">
                  {editingId === shelter.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        min="0"
                        max={shelter.capacity}
                        value={editOccupancy}
                        onChange={(e) => setEditOccupancy(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 rounded bg-white/[0.04] border border-white/10 text-white text-xs"
                      />
                      <button
                        onClick={() => handleUpdate(shelter.id)}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase hover:bg-emerald-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 bg-slate-900 border border-white/10 text-slate-400 rounded text-[10px] font-bold uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(shelter.id);
                        setEditOccupancy(shelter.current_occupancy);
                      }}
                      className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Update Occupancy
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
