"use client";

import React, { useEffect, useState } from "react";
import { Activity, MapPin, Phone, Edit, Plus, AlertCircle, Heart } from "lucide-react";
import { api } from "@/lib/api";

export default function HospitalsPage() {
  const [user, setUser] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBeds, setEditBeds] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.006);
  const [contactInfo, setContactInfo] = useState("");
  const [totalBeds, setTotalBeds] = useState(100);
  const [availableBeds, setAvailableBeds] = useState(100);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
    }
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      const data = await api.getHospitals();
      setHospitals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateHospitalBeds(id, editBeds);
      setEditingId(null);
      setSuccess("Hospital bed status updated successfully.");
      loadHospitals();
    } catch (err) {
      setError("Failed to update bed status.");
    }
  };

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.createHospital({
        name,
        address,
        latitude,
        longitude,
        contact_info: contactInfo,
        total_beds: totalBeds,
        available_beds: availableBeds
      });
      setSuccess("New trauma hospital registered to rescue network.");
      setShowAddForm(false);
      setName("");
      setAddress("");
      setContactInfo("");
      loadHospitals();
    } catch (err) {
      setError("Failed to register hospital.");
    }
  };

  const totalTraumaBeds = hospitals.reduce((acc, h) => acc + h.total_beds, 0);
  const availTraumaBeds = hospitals.reduce((acc, h) => acc + h.available_beds, 0);

  return (
    <div className="space-y-8 max-w-6xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-emerald-500" />
            Trauma Beds &amp; Clinics
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time ER vacancies and medical facility availability index across active disaster sectors.
          </p>
        </div>

        {user?.role !== "citizen" && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-1.5 shrink-0 border border-emerald-500/20"
          >
            <Plus className="h-4.5 w-4.5" />
            Register Hospital
          </button>
        )}
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Emergency Beds</p>
          <p className="text-2xl font-bold text-white mt-1">{totalTraumaBeds} beds</p>
        </div>
        <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Available Trauma/ICU Openings</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{availTraumaBeds} vacant beds</p>
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

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#0b0c10] border border-emerald-500/20 rounded-2xl p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Register New Medical Facility</h2>
          <form onSubmit={handleAddHospital} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Hospital Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. City General Trauma"
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 100 Main St, Suite B"
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Beds</label>
              <input
                type="number"
                required
                value={totalBeds}
                onChange={(e) => setTotalBeds(parseInt(e.target.value) || 0)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Beds</label>
              <input
                type="number"
                required
                value={availableBeds}
                onChange={(e) => setAvailableBeds(parseInt(e.target.value) || 0)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Hospital Helpline Contact</label>
              <input
                type="text"
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. +1 (555) 911-0100"
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2 pt-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-md transition-all"
              >
                Register Clinic
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

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map((hospital) => {
          const availPercent = Math.round((hospital.available_beds / hospital.total_beds) * 100);
          const isLow = hospital.available_beds <= 15;

          return (
            <div 
              key={hospital.id} 
              className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 flex flex-col justify-between gap-5 relative group hover:border-white/10 transition-colors"
            >
              
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-white text-base truncate pr-2" title={hospital.name}>
                    {hospital.name}
                  </h3>
                  {isLow ? (
                    <span className="shrink-0 px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase animate-pulse">
                      Critical Beds
                    </span>
                  ) : (
                    <span className="shrink-0 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                      Open Slots
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>{hospital.address}</span>
                </p>
                {hospital.contact_info && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>{hospital.contact_info}</span>
                  </p>
                )}
              </div>

              {/* Beds Available indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Beds Available:</span>
                  <span className={`font-bold ${isLow ? "text-rose-400" : "text-white"}`}>
                    {hospital.available_beds} / {hospital.total_beds} ({availPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-white/[0.04] overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLow ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${availPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Bar */}
              {user?.role !== "citizen" && (
                <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between">
                  {editingId === hospital.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        min="0"
                        max={hospital.total_beds}
                        value={editBeds}
                        onChange={(e) => setEditBeds(parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 rounded bg-white/[0.04] border border-white/10 text-white text-xs"
                      />
                      <button
                        onClick={() => handleUpdate(hospital.id)}
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
                        setEditingId(hospital.id);
                        setEditBeds(hospital.available_beds);
                      }}
                      className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Update Beds
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
