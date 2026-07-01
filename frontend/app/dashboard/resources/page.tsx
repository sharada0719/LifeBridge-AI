"use client";

import React, { useEffect, useState } from "react";
import { Package, Plus, MapPin, Edit, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function ResourcesPage() {
  const [user, setUser] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>("available");
  
  // Add resource fields
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("water");
  const [quantity, setQuantity] = useState(100);
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.006);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("lb_user");
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
    }
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await api.getResources();
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateResourceQty(id, editQty, editStatus);
      setEditingId(null);
      setSuccess("Resource quantity & allocation status updated.");
      loadResources();
    } catch (err) {
      setError("Failed to update resource catalog.");
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.createResource({
        name,
        type,
        quantity,
        status: "available",
        latitude,
        longitude
      });
      setSuccess("New supply shipment logged to resource directory.");
      setShowAddForm(false);
      setName("");
      setQuantity(100);
      loadResources();
    } catch (err) {
      setError("Failed to log resource item.");
    }
  };

  const resourceBadge = (status: string) => {
    switch (status) {
      case "depleted": return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
      case "allocated": return "bg-blue-500/10 text-blue-400 border border-blue-500/25";
      default: return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-emerald-500" />
            Disaster Relief Resources
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time supply tracking for critical emergency assets including food, medical kits, and blankets.
          </p>
        </div>

        {user?.role !== "citizen" && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-1.5 shrink-0 border border-emerald-500/20"
          >
            <Plus className="h-4.5 w-4.5" />
            Log Shipments
          </button>
        )}
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
          <h2 className="text-lg font-bold text-white mb-4">Register Supply Shipment</h2>
          <form onSubmit={handleAddResource} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Item Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bottled Aquafina 1L Case"
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Resource Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="water" className="bg-[#0b0c10]">Drinking Water</option>
                <option value="food" className="bg-[#0b0c10]">Rations / Food Packets</option>
                <option value="medical_kit" className="bg-[#0b0c10]">Medical Triage Kits</option>
                <option value="blanket" className="bg-[#0b0c10]">Thermal Blanket</option>
                <option value="life_jacket" className="bg-[#0b0c10]">Life Jackets</option>
                <option value="power_bank" className="bg-[#0b0c10]">Power Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantity</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage Lat</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage Lng</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-md transition-all"
              >
                Log Supply Item
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

      {/* Supply Directory Catalog View */}
      <div className="bg-[#0b0c10] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Supply Directory Catalog</h2>
          <span className="text-xs bg-white/[0.04] px-2.5 py-1 rounded text-slate-400">
            {resources.length} Supply Types Registered
          </span>
        </div>

        {resources.length === 0 ? (
          <p className="text-sm text-slate-500 p-8 text-center">Supply directory is empty.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Resource Details</th>
                  <th className="px-6 py-4">Storage Depot Coordinate</th>
                  <th className="px-6 py-4">Quantity Stock</th>
                  <th className="px-6 py-4">Allocation Status</th>
                  {user?.role !== "citizen" && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] text-sm text-slate-300">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-white/[0.01] transition-colors">
                    
                    {/* Item */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          {res.type.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-normal">{res.name}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{res.type.replace("_", " ")}</p>
                        </div>
                      </div>
                    </td>

                    {/* Coordinates */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span>[{res.latitude?.toFixed(4) || "0.0000"}, {res.longitude?.toFixed(4) || "0.0000"}]</span>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4">
                      {editingId === res.id ? (
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 rounded bg-white/[0.04] border border-white/10 text-white text-xs"
                        />
                      ) : (
                        <span className="font-semibold text-white">{res.quantity} units</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {editingId === res.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="px-2 py-1 rounded bg-[#0b0c10] border border-white/10 text-white text-xs"
                        >
                          <option value="available">Available</option>
                          <option value="allocated">Allocated</option>
                          <option value="depleted">Depleted</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${resourceBadge(res.status)}`}>
                          {res.status}
                        </span>
                      )}
                    </td>

                    {/* Edit Actions */}
                    {user?.role !== "citizen" && (
                      <td className="px-6 py-4 text-right">
                        {editingId === res.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(res.id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase hover:bg-emerald-500"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 bg-slate-900 border border-white/10 text-slate-400 rounded text-[10px] font-bold uppercase"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(res.id);
                              setEditQty(res.quantity);
                              setEditStatus(res.status);
                            }}
                            className="text-xs text-slate-400 hover:text-white font-bold inline-flex items-center gap-1 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}
                      </td>
                    )}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
