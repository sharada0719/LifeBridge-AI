"use client";

import React, { useEffect, useState } from "react";
import { Users, Shield, Heart, Plus, Mail, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import { api } from "@/lib/api";

export default function VolunteersPage() {
  const [user, setUser] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVol, setIsVol] = useState(false);
  const [myVolProfile, setMyVolProfile] = useState<any>(null);

  // Form fields
  const [skillSet, setSkillSet] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
    }
    loadVolunteers();
  }, []);

  useEffect(() => {
    if (user && volunteers.length > 0) {
      const profile = volunteers.find((v: any) => v.user_id === user.id);
      if (profile) {
        setIsVol(true);
        setMyVolProfile(profile);
        setSkillSet(profile.skill_set);
      }
    }
  }, [user, volunteers]);

  const loadVolunteers = async () => {
    try {
      const data = await api.getVolunteers();
      setVolunteers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.registerVolunteer({ skill_set: skillSet });
      setSuccess("You have successfully registered as a First Responder volunteer.");
      loadVolunteers();
    } catch (err: any) {
      setError(err.message || "Failed to register as volunteer.");
    }
  };

  const handleToggleStatus = async () => {
    if (!myVolProfile) return;
    const newStatus = myVolProfile.status === "active" ? "inactive" : "active";
    try {
      await api.updateVolunteerStatus({
        status: newStatus,
        skill_set: myVolProfile.skill_set
      });
      setSuccess(`Volunteer status changed to: ${newStatus}`);
      loadVolunteers();
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-500" />
          First Responder Network
        </h1>
        <p className="text-slate-400 mt-1">
          Coordinate local volunteers, medical personnel, boat rescue squads, and emergency drivers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: registration / profile dashboard */}
        <div className="lg:col-span-1">
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-6 sticky top-24">
            
            {isVol ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-white">Your Volunteer Profile</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage your active rescue status.</p>
                </div>

                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rescue Status</span>
                    <button
                      onClick={handleToggleStatus}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      {myVolProfile?.status === "active" ? (
                        <>
                          <span className="text-emerald-400 font-bold uppercase">Active &amp; Ready</span>
                          <ToggleRight className="h-6 w-6 text-emerald-500" />
                        </>
                      ) : (
                        <>
                          <span className="text-slate-500 font-bold uppercase">Standby / Off</span>
                          <ToggleLeft className="h-6 w-6 text-slate-600" />
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registered Skills</span>
                    <p className="text-sm text-slate-200 mt-1">{myVolProfile?.skill_set}</p>
                  </div>
                </div>

                {success && <p className="text-xs text-emerald-400">{success}</p>}
                {error && <p className="text-xs text-rose-400">{error}</p>}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-white">Join Rescue Mission</h2>
                  <p className="text-xs text-slate-500 mt-1">Volunteer your skills to assist citizens in high danger.</p>
                </div>

                {success && (
                  <div className="bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-3 text-emerald-300 text-xs">
                    {success}
                  </div>
                )}

                {error && (
                  <div className="bg-rose-950/30 border border-rose-900/30 rounded-lg p-3 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Rescue Skills</label>
                    <textarea
                      required
                      rows={3}
                      value={skillSet}
                      onChange={(e) => setSkillSet(e.target.value)}
                      placeholder="e.g. CPR Certified, First Aid, Swiftwater rescue swimmer, Boat owner, Truck driver"
                      className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Heart className="h-4.5 w-4.5" />
                    Register as Responder
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>

        {/* Right column: directory listing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">Responder Directory</h2>
            
            {volunteers.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No responders registered in database yet.</p>
            ) : (
              <div className="space-y-4">
                {volunteers.map((vol) => (
                  <div key={vol.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{vol.user?.name || "Volunteer"}</span>
                        {vol.status === "active" ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[8px] font-extrabold uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 border border-white/5 text-[8px] font-extrabold uppercase">
                            Standby
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-normal">
                        <span className="text-slate-500 font-medium">Skills:</span> {vol.skill_set}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <a 
                        href={`mailto:${vol.user?.email}`}
                        className="p-2 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:text-white rounded-lg text-slate-400 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        Contact
                      </a>
                    </div>
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
