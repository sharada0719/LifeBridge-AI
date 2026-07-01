"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Shield, AlertCircle, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen"); // citizen, responder
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Get latitude/longitude if geolocation is supported
      let latitude = 40.7128;
      let longitude = -74.0060;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
            await registerUser(latitude, longitude);
          },
          async () => {
            // Fallback to defaults
            await registerUser(latitude, longitude);
          }
        );
      } else {
        await registerUser(latitude, longitude);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.");
      setLoading(false);
    }
  };

  const registerUser = async (latitude: number, longitude: number) => {
    const signupData = {
      name,
      email,
      phone,
      password,
      role,
      latitude,
      longitude
    };

    try {
      await api.register(signupData);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-rose-950/15 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/20">
              <Shield className="h-6 w-6 text-white stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              LifeBridge<span className="text-rose-500">AI</span>
            </span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-rose-500 hover:text-rose-450 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#0b0c10]/80 border border-white/5 py-8 px-4 shadow-xl rounded-2xl sm:px-10 backdrop-blur-sm">
          
          {error && (
            <div className="mb-4 bg-rose-950/30 border border-rose-900/30 rounded-lg p-3.5 flex items-start gap-2.5 text-rose-300 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-3.5 flex items-start gap-2.5 text-emerald-300 text-sm">
              <Shield className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="mt-1.5">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="appearance-none block w-full px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="appearance-none block w-full px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
                Phone Number
              </label>
              <div className="mt-1.5">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="appearance-none block w-full px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-300">
                Register As
              </label>
              <div className="mt-1.5">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm"
                >
                  <option value="citizen" className="bg-[#0b0c10] text-white">Citizen (In need of assistance / general alerts)</option>
                  <option value="responder" className="bg-[#0b0c10] text-white">Responder / Volunteer (Can coordinate rescue operations)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3.5 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-slate-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-1.5"
              >
                {loading ? "Creating Account..." : "Create Account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
