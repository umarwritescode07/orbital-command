"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Bot,
  User,
  Send,
  HelpCircle,
  Terminal,
  Activity,
  Cpu,
  BrainCircuit,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function AIFlightDirectorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: `System Uplink Established. 
AI Flight Director **Flight-D1** initialized.
Accessing real-time satellite telemetry databases. All network segments are loaded.

Operator, you can query telemetry health, request failure predictions, or analyze conjunction vectors.
*Select a quick command from the panel or type a custom natural language query.*`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [engineSource, setEngineSource] = useState("Local Diagnostic Core");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat box when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send message handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/flight-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const payload = await res.json();
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: payload.message || "Diagnostic core failure: empty response.",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setEngineSource(payload.source === "openai" ? "GPT-4o API" : "Local Diagnostic Core");
    } catch (e) {
      console.error("AI completed request failure", e);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: "❌ Error: Failed to articulate telemetry link. Check OpenAI API server state.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const presetQueries = [
    { title: "Why is battery dropping?", query: "Analyze SAT-001 battery status. Why is the battery charge decreasing?" },
    { title: "Why is temperature increasing?", query: "Read thermal core telemetry. Why is satellite temperature increasing?" },
    { title: "Predict mission risks.", query: "Run conjunction screening and predict active collision risks for the fleet." },
    { title: "Review fleet status.", query: "Provide a quick operational health breakdown of all 100 satellites." },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 flex-shrink-0">
        <div>
          <div className="text-xs font-mono uppercase text-accent tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            ACOC Cognitive Analysis Deck
          </div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100 uppercase mt-0.5">
            AI Flight Director (Flight-D1)
          </h1>
        </div>
      </div>

      {/* Main split workdeck */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Left Side: Preset Prompts & HUD metrics */}
        <div className="flex flex-col gap-6 lg:col-span-1 flex-shrink-0 font-mono text-xs">
          {/* AI Engine Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-accent" /> Engine Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Core Node:</span>
                <span className="text-slate-200">FLIGHT-D1</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Active Mappings:</span>
                <span className="text-accent">100 Satellites</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cognitive Hub:</span>
                <span className="text-accent font-bold uppercase">{engineSource}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Command list */}
          <Card className="flex-1 overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Terminal className="h-4 w-4 text-accent" /> Presets commands
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2 flex flex-col">
              {presetQueries.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.query)}
                  className="w-full text-left p-2.5 bg-slate-950/60 hover:bg-slate-900/50 border border-slate-800 rounded transition-all text-[11px] text-slate-350 hover:text-accent font-bold leading-normal"
                >
                  {p.title}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Chat terminal */}
        <Card className="lg:col-span-3 flex-1 flex flex-col min-h-0 border-accent/20 shadow-[0_0_15px_#3B82F605]">
          <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Bot className="h-4.5 w-4.5 text-accent" /> flight-d1@acoc.space
              </CardTitle>
              <CardDescription>Cognitive Diagnostic console log</CardDescription>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-550">
              <Activity className="h-3 w-3 text-accent animate-pulse" /> LATENCY: 24ms
            </div>
          </CardHeader>

          {/* Chat log body */}
          <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 font-mono text-xs scroll-smooth bg-slate-950/20">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3 max-w-[85%] rounded p-3 border",
                  m.role === "assistant"
                    ? "bg-slate-900/60 border-slate-850 text-slate-200 mr-auto"
                    : "bg-accent-muted/10 border-accent/15 text-slate-200 ml-auto flex-row-reverse"
                )}
              >
                {/* Role Icon */}
                <div className="flex-shrink-0">
                  {m.role === "assistant" ? (
                    <div className="w-6 h-6 rounded bg-accent/20 border border-accent/35 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-accent" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 leading-relaxed">
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-2">
                    <span className="uppercase">{m.role === "assistant" ? "AI Flight Director" : "Console Operator"}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-wrap select-text text-slate-200 selection:bg-accent selection:text-background">{m.content}</p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3 max-w-[80%] bg-slate-900/60 border border-slate-850 rounded p-3 text-slate-200 mr-auto animate-pulse">
                <div className="w-6 h-6 rounded bg-accent/20 border border-accent/35 flex items-center justify-center">
                  <RefreshCw className="h-3.5 w-3.5 text-accent animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-550">AI FLIGHT DIRECTOR DIAGNOSIS</div>
                  <p className="text-slate-450 italic">Analyzing ECI coordinates, compiling telemetry logs...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input control footer */}
          <CardFooter className="border-t border-slate-800 p-3 bg-slate-950/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex w-full gap-3"
            >
              <input
                type="text"
                placeholder="Query spacecraft anomalies, ask battery/temp predictions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded px-3 py-2 font-mono text-xs text-slate-200 placeholder-slate-650 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2 bg-accent text-background font-bold text-xs uppercase tracking-wider rounded hover:bg-slate-100 disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(59, 130, 246,0.2)] flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Transmit
              </button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
