"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Shield, AlertCircle, Chrome, ArrowRight } from "lucide-react";

  function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists, direct immediately to dashboard
    if (typeof window !== "undefined" && localStorage.getItem("lb_token") && localStorage.getItem("lb_token") !== "mock-jwt-token-val") {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.login({ email, password });
      if (response && response.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("lb_token", response.access_token);
        }
        
        // Fetch current user details
        const userData = await api.getMe();
        if (typeof window !== "undefined") {
          localStorage.setItem("lb_user", JSON.stringify(userData));
        }

        const redir = searchParams.get("redirect");
        if (redir === "sos") {
          router.push("/dashboard/requests?action=trigger-sos");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError("Failed to obtain token.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("");
    setLoading(true);
    setTimeout(async () => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("lb_token", "mock-google-token-xyz");
          localStorage.setItem("lb_user", JSON.stringify({
            id: "u-google",
            name: "Jane Google User",
            email: email || "jane.google@gmail.com",
            role: "citizen",
            phone: "+1 (555) 123-8899",
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: new Date().toISOString()
          }));
        }
        const redir = searchParams.get("redirect");
        if (redir === "sos") {
          router.push("/dashboard/requests?action=trigger-sos");
        } else {
          router.push("/dashboard");
        }
      } catch (err: any) {
        setError("Google authentication mock failed.");
      } finally {
        setLoading(false);
      }
    }, 800);
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{" "}
          <Link href="/signup" className="font-medium text-rose-500 hover:text-rose-450 transition-colors">
            create a new account
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-white/10 rounded-lg bg-white/[0.03] text-white placeholder-slate-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm"
                />
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-white/10 rounded-lg bg-white/[0.03] text-white placeholder-slate-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-white/10 rounded bg-white/[0.03]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-slate-400">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <span className="font-medium text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                  Forgot password?
                </span>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-1.5"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-[#0b0c10] text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-white/10 rounded-lg shadow-sm bg-white/[0.03] text-sm font-semibold text-slate-300 hover:bg-white/[0.08] transition-colors flex items-center gap-2"
              >
                <Chrome className="h-4 w-4 text-rose-500" />
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
