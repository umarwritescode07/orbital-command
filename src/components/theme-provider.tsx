"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeSettings {
  scanlines: boolean;
  gridlines: boolean;
  glowIntensity: "low" | "medium" | "high";
  refreshRate: number; // in milliseconds
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
}

const defaultSettings: ThemeSettings = {
  scanlines: true,
  gridlines: true,
  glowIntensity: "medium",
  refreshRate: 1000,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);

  // Load from localStorage on client side
  useEffect(() => {
    const saved = localStorage.getItem("orbital-theme-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse theme settings", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("orbital-theme-settings", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    // Dynamically apply classes to the html element
    const html = document.documentElement;
    if (settings.gridlines) {
      html.classList.add("grid-lines");
    } else {
      html.classList.remove("grid-lines");
    }
  }, [settings.gridlines]);

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      <div className={settings.scanlines ? "scanlines min-h-screen" : "min-h-screen"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useThemeSettings() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeSettings must be used within a ThemeProvider");
  }
  return context;
}
