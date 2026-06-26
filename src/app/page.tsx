import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full p-8 glass-card border border-accent/20 rounded-lg relative overflow-hidden scanlines">
        {/* Glow effect decorative element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-accent shadow-[0_0_20px_#3B82F6]"></div>

        <header className="mb-8">
          <div className="text-xs uppercase tracking-[0.4em] text-accent mb-2 font-mono">
            System Initialization
          </div>
          <h1 className="text-4xl font-extrabold tracking-wider font-mono text-slate-100 uppercase">
            Orbital Command
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            Aerospace Constellation Operations Center (ACOC)
          </p>
        </header>

        <section className="my-8 py-6 border-y border-border flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 font-mono text-sm bg-accent-muted/10 border border-accent/10 px-4 py-2 rounded">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
            <span className="text-slate-300">All Systems Nominal</span>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full text-left font-mono text-xs text-slate-400 mt-2">
            <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
              <span className="text-slate-500">INGEST DAEMON:</span> <span className="text-accent">ONLINE</span>
            </div>
            <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
              <span className="text-slate-500">WEBSOCKET BRIDGE:</span> <span className="text-accent">ACTIVE</span>
            </div>
          </div>
        </section>

        <footer>
          <Link
            href="/dashboard"
            className="inline-block w-full py-3 bg-accent text-background font-bold tracking-widest uppercase text-sm rounded hover:bg-slate-100 transition-colors shadow-[0_0_15px_rgba(59, 130, 246,0.4)]"
          >
            Access Dashboard
          </Link>
          <div className="text-[10px] text-slate-600 font-mono mt-4">
            CONFIDENTIAL // FOR INTERNAL OPERATIONS ONLY
          </div>
        </footer>
      </div>
    </main>
  );
}
