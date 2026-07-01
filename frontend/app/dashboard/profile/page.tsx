"use client";

import React, { useEffect, useState } from "react";
import { UserCircle, Shield, Phone, AlertCircle, Plus, Trash2, Heart, Save } from "lucide-react";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Form state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  
  // Emergency Contact Form state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isTrusted, setIsTrusted] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        const u = JSON.parse(uStr);
        setUser(u);
        setProfileName(u.name);
        setProfilePhone(u.phone || "");
        setProfileEmail(u.email);
      }
    }
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await api.getContacts();
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const updated = await api.updateProfile({
        name: profileName,
        phone: profilePhone,
        email: profileEmail
      });
      setSuccess("Profile settings updated.");
      if (typeof window !== "undefined") {
        localStorage.setItem("lb_user", JSON.stringify(updated));
      }
      setUser(updated);
    } catch (err) {
      setError("Failed to update profile.");
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone || !relationship) return;
    setError("");
    setSuccess("");

    try {
      await api.addContact({
        name: contactName,
        phone: contactPhone,
        relationship,
        is_trusted: isTrusted
      });
      setSuccess("Trusted emergency contact added successfully.");
      setContactName("");
      setContactPhone("");
      setRelationship("");
      loadContacts();
    } catch (err) {
      setError("Failed to register contact.");
    }
  };

  const handleDeleteContact = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      await api.deleteContact(id);
      setSuccess("Emergency contact deleted.");
      loadContacts();
    } catch (err) {
      setError("Failed to delete contact.");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-rose-500" />
          Profile &amp; Emergency Contacts
        </h1>
        <p className="text-slate-400 mt-1">
          Maintain your personal information and add emergency contacts to be reached instantly during critical SOS situations.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Edit Profile settings */}
        <div className="space-y-6">
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Security &amp; Profile Details</h2>
              <p className="text-xs text-slate-500 mt-1">Configure your personal rescue metadata.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Helpline Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="e.g. +1 (555) 123-4567"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Emergency Contact Management */}
        <div className="space-y-6">
          
          {/* Add Contact Card */}
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Add Trusted Rescue Contact
              </h2>
              <p className="text-xs text-slate-500 mt-1">This contact will be pinged immediately in case of critical warnings.</p>
            </div>

            <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Jane Connor"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Relationship</label>
                <input
                  type="text"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Spouse, Parent, Brother"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Helpline Contact Number</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 900-1122"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="trust-contact"
                  type="checkbox"
                  checked={isTrusted}
                  onChange={(e) => setIsTrusted(e.target.checked)}
                  className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-white/10 rounded bg-white/[0.03]"
                />
                <label htmlFor="trust-contact" className="text-xs font-semibold text-slate-400">
                  Trust implicitly (Enable automated SMS/Alert dispatches)
                </label>
              </div>

              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black hover:bg-slate-200 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Add Trusted Contact
                </button>
              </div>
            </form>
          </div>

          {/* List Contacts */}
          <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Your Primary Contacts</h2>
            
            {contacts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No rescue contacts added. Register at least 1 contact above.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{contact.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase">
                          {contact.relationship}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>{contact.phone}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="Remove Contact"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
