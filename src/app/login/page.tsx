"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/layout/auth-context";
import { Shield, Lock, Mail, Terminal, AlertTriangle, Cpu, Radio, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "Console access denied.");
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden bg-background scanlines">
      {/* Decorative cosmic glow backdrops */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full filter blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full filter blur-[120px] animate-pulse delay-1000 pointer-events-none"></div>

      {/* Decorative technical console indicators */}
      <div className="absolute top-4 left-6 hidden md:flex items-center gap-3 text-[10px] text-slate-500 font-mono tracking-widest pointer-events-none select-none">
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping"></span>
        <span>SYS_STATUS: OPERATIONAL</span>
        <span className="text-slate-700">|</span>
        <span>NODE: LOCALHOST:3001</span>
      </div>
      
      <div className="absolute bottom-4 right-6 hidden md:flex items-center gap-4 text-[10px] text-slate-600 font-mono pointer-events-none select-none">
        <span>LATENCY: ~12ms</span>
        <span>SEC_LEVEL: CLASS-4</span>
      </div>

      <div className="w-full max-w-[440px] p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/65 backdrop-blur-xl p-8 shadow-2xl"
        >
          {/* Top glowing boundary accent */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"></div>

          {/* Technical Corner Marks */}
          <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-slate-800 pointer-events-none"></div>
          <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-slate-800 pointer-events-none"></div>
          <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-slate-800 pointer-events-none"></div>
          <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-slate-800 pointer-events-none"></div>

          {/* Header */}
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex relative p-4 bg-accent/5 border border-accent/15 rounded-full text-accent shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              {/* Outer scanning circle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute inset-0 border border-dashed border-accent/20 rounded-full m-1"
              ></motion.div>
              <Shield className="h-6 w-6 relative z-10" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-widest text-slate-100 uppercase font-display bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
                Orbital Command
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-medium">
                Mission Operations Control Gateway
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 border border-red-500/25 bg-red-950/15 rounded-lg text-red-400 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[10px]">Access Blocked</span>
                      {error}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider font-sans">
                Operator Uplink Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@orbital.command"
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-accent focus:ring-2 focus:ring-accent/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider font-sans">
                Security Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-accent focus:ring-2 focus:ring-accent/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-accent/95 active:scale-[0.99] text-white font-semibold uppercase rounded-lg text-xs tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Terminal className="h-4 w-4" />
                  <span>Initialize Terminal Link</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Fills */}
          <div className="mt-8 border-t border-slate-800/80 pt-5">
            <span className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest block mb-3 text-center">
              Authorization Preset Profiles
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickFill("admin@orbital.command", "adminpassword123")}
                className="py-2 px-1 border border-slate-800 hover:border-accent/40 bg-slate-900/30 hover:bg-accent/5 rounded-lg text-[10px] text-slate-400 hover:text-accent font-sans transition-all text-center flex flex-col items-center justify-center gap-1"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Director</span>
              </button>
              <button
                onClick={() => handleQuickFill("operator@orbital.command", "operatorpassword123")}
                className="py-2 px-1 border border-slate-800 hover:border-accent/40 bg-slate-900/30 hover:bg-accent/5 rounded-lg text-[10px] text-slate-400 hover:text-accent font-sans transition-all text-center flex flex-col items-center justify-center gap-1"
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Controller</span>
              </button>
              <button
                onClick={() => handleQuickFill("viewer@orbital.command", "viewerpassword123")}
                className="py-2 px-1 border border-slate-800 hover:border-accent/40 bg-slate-900/30 hover:bg-accent/5 rounded-lg text-[10px] text-slate-400 hover:text-accent font-sans transition-all text-center flex flex-col items-center justify-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Observer</span>
              </button>
            </div>
          </div>

          {/* Footer Register Link */}
          <div className="mt-6 text-center text-xs text-slate-500 font-sans">
            Need to register a new operator profile?{" "}
            <a href="/register" className="text-accent hover:text-accent/90 font-medium transition-all underline">
              Sign Up
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
