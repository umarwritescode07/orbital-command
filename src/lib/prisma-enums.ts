export const Role = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  VIEWER: "VIEWER"
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const SatelliteStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  DECOMMISSIONED: "DECOMMISSIONED",
  ANOMALOUS: "ANOMALOUS"
} as const;
export type SatelliteStatus = (typeof SatelliteStatus)[keyof typeof SatelliteStatus];

export const OrbitType = {
  LEO: "LEO",
  MEO: "MEO",
  GEO: "GEO"
} as const;
export type OrbitType = (typeof OrbitType)[keyof typeof OrbitType];

export const AlertType = {
  COMMUNICATION_FAILURE: "COMMUNICATION_FAILURE",
  FUEL_LEAK: "FUEL_LEAK",
  BATTERY_FAILURE: "BATTERY_FAILURE",
  THERMAL_ANOMALY: "THERMAL_ANOMALY",
  SOLAR_PANEL_FAILURE: "SOLAR_PANEL_FAILURE",
  COLLISION_RISK: "COLLISION_RISK"
} as const;
export type AlertType = (typeof AlertType)[keyof typeof AlertType];

export const AlertSeverity = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
} as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const AlertStatus = {
  ACTIVE: "ACTIVE",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  RESOLVED: "RESOLVED"
} as const;
export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];

export const MissionStatus = {
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED"
} as const;
export type MissionStatus = (typeof MissionStatus)[keyof typeof MissionStatus];

export const AnomalyStatus = {
  OPEN: "OPEN",
  INVESTIGATING: "INVESTIGATING",
  RESOLVED: "RESOLVED"
} as const;
export type AnomalyStatus = (typeof AnomalyStatus)[keyof typeof AnomalyStatus];
