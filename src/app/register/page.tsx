"use client";

import React, { useState } from "react";
import { useAuth, UserRole } from "@/components/layout/auth-context";
import { ShieldAlert, User, Mail, Lock, ShieldCheck, Terminal, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("VIEWER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await register(name, email, password, role);
    if (!res.success) {
      setError(res.error || "Profile generation failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden bg-[#050B14] scanlines">
      {/* Glow Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full filter blur-[100px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md p-6 relative z-10 font-mono">
        <div className="border border-slate-800 bg-slate-950/80 backdrop-blur-md rounded-lg p-6 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex p-3 bg-warning/10 border border-warning/25 rounded-full text-warning shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-widest text-slate-100 uppercase">
              Operator Enrollment Registry
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Enlist Command Console Operators
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 border border-critical/30 bg-critical-muted/10 rounded text-critical text-[11px] flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase block">Enrollment Failed:</span>
                  {error}
                </div>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-500">Operator Name</label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Captain Miller"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded py-2 pl-9 pr-3 text-xs text-slate-350 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-500">Operator Email</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@orbital.command"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded py-2 pl-9 pr-3 text-xs text-slate-350 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-500">Security Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded py-2 pl-9 pr-3 text-xs text-slate-350 outline-none transition-all"
                />
              </div>
            </div>

            {/* Role Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-500">Console Authorization Role</label>
              <div className="relative">
                <ShieldCheck className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded py-2 pl-9 pr-3 text-xs text-slate-350 outline-none transition-all cursor-pointer"
                >
                  <option value="VIEWER">VIEWER (Read-Only Telemetry)</option>
                  <option value="OPERATOR">OPERATOR (Active Control Desk)</option>
                  <option value="ADMIN">ADMIN (Full Console Overrides)</option>
                </select>
              </div>
            </div>

            {/* Enroll Operator Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-warning/10 border border-warning/30 hover:border-warning/60 text-warning font-bold uppercase rounded text-xs tracking-wider transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border border-warning border-t-transparent rounded-full animate-spin"></div>
                  Generating Operator Profile...
                </>
              ) : (
                <>
                  <Terminal className="h-4 w-4" /> Enroll Console Profile
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-all"
            >
              <ArrowLeft className="h-3 w-3" /> Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
