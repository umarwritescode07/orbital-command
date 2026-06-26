import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/theme-provider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Left navigation panel */}
        <Sidebar />

        {/* Right dashboard stack */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top telemetry control panel */}
          <Navbar />

          {/* Main workspace deck */}
          <main className="flex-1 overflow-y-auto bg-background/90 p-6 relative">
            {/* HUD border style line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-900"></div>
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
