import { SatelliteStatus, OrbitType, AlertType, AlertSeverity, AlertStatus } from "./prisma-enums";

export interface Satellite {
  id: string;
  name: string;
  status: SatelliteStatus;
  orbit: OrbitType;
  velocity: number;
  altitude: number;
  inclination: number;
  fuel: number;
  battery: number;
  temperature: number;
  signalStrength: number;
  cpuUsage: number;
  solarOutput: number;
  constellationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Constellation {
  id: string;
  name: string;
  healthScore: number;
}

export interface GroundStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  latency: number;
  throughput: number;
}

export interface Alert {
  id: string;
  satelliteId: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  createdAt: Date;
}

// 1. Generate 10 Constellations
export const constellations: Constellation[] = [
  { id: "starlink-g3", name: "StarLink Gen-3 Broadband", healthScore: 97.4 },
  { id: "gps-aegis", name: "GPS Aegis Navigation", healthScore: 99.2 },
  { id: "helios-core", name: "Helios Solar Orbiter Core", healthScore: 92.0 },
  { id: "apex-comms", name: "Apex Commercial Telephony", healthScore: 98.1 },
  { id: "eos-observ", name: "Eos Environmental Scanner", healthScore: 94.6 },
  { id: "milstar-net", name: "Milstar Tactical Defence", healthScore: 100.0 },
  { id: "iridium-pro", name: "Iridium Global Satellite Telephony", healthScore: 96.8 },
  { id: "one-web-s", name: "OneWeb Enterprise Transmitters", healthScore: 95.2 },
  { id: "landsat-eo", name: "LandSat Earth Observational Grid", healthScore: 94.0 },
  { id: "copernicus", name: "Copernicus Atmosphere Scanner", healthScore: 98.9 },
];

// 2. Generate 20 Ground Stations
export const groundStations: GroundStation[] = [
  { id: "MCC-HOU", name: "MCC Houston (USA)", latitude: 29.76, longitude: -95.36, status: "ONLINE", latency: 12, throughput: 850 },
  { id: "MCC-CAN", name: "Canberra Station (AUS)", latitude: -35.28, longitude: 149.13, status: "ONLINE", latency: 45, throughput: 620 },
  { id: "MCC-MAD", name: "Madrid Station (ESP)", latitude: 40.41, longitude: -3.7, status: "MAINTENANCE", latency: 120, throughput: 150 },
  { id: "MCC-ANC", name: "Alaska Uplink Node (USA)", latitude: 61.21, longitude: -149.9, status: "ONLINE", latency: 18, throughput: 780 },
  { id: "MCC-TKO", name: "Tokyo Ground Center (JPN)", latitude: 35.67, longitude: 139.65, status: "ONLINE", latency: 32, throughput: 900 },
  { id: "MCC-SUL", name: "Svalbard Satellite Station (NOR)", latitude: 78.22, longitude: 15.65, status: "ONLINE", latency: 28, throughput: 1100 },
  { id: "MCC-JOH", name: "Johannesburg Terminal (ZAF)", latitude: -26.2, longitude: 28.04, status: "ONLINE", latency: 74, throughput: 450 },
  { id: "MCC-RIO", name: "Rio de Janeiro Uplink (BRA)", latitude: -22.9, longitude: -43.17, status: "OFFLINE", latency: 0, throughput: 0 },
  { id: "MCC-BLR", name: "Bengaluru ISR Terminal (IND)", latitude: 12.97, longitude: 77.59, status: "ONLINE", latency: 24, throughput: 950 },
  { id: "MCC-HAR", name: "Hartebeesthoek Radio Obs (ZAF)", latitude: -25.88, longitude: 27.7, status: "ONLINE", latency: 68, throughput: 400 },
  { id: "MCC-NGB", name: "Neumayer Antenna Array (ATA)", latitude: -70.66, longitude: -8.26, status: "ONLINE", latency: 210, throughput: 90 },
  { id: "MCC-FAL", name: "Falkland Islands Terminal (GBR)", latitude: -51.69, longitude: -57.85, status: "ONLINE", latency: 145, throughput: 180 },
  { id: "MCC-SIN", name: "Singapore Equator Relay (SGP)", latitude: 1.35, longitude: 103.81, status: "ONLINE", latency: 15, throughput: 1200 },
  { id: "MCC-MAU", name: "Mauritius Deep Downlink (MUS)", latitude: -20.34, longitude: 57.55, status: "ONLINE", latency: 98, throughput: 310 },
  { id: "MCC-HIH", name: "Hawaii Tracking Station (USA)", latitude: 21.3, longitude: -157.85, status: "ONLINE", latency: 22, throughput: 920 },
  { id: "MCC-KOU", name: "Kourou Launch Range (GUF)", latitude: 5.15, longitude: -52.64, status: "ONLINE", latency: 34, throughput: 740 },
  { id: "MCC-ASC", name: "Ascension Island Node (SHN)", latitude: -7.94, longitude: -14.35, status: "ONLINE", latency: 85, throughput: 280 },
  { id: "MCC-REK", name: "Reykjavik Earth Node (ISL)", latitude: 64.14, longitude: -21.9, status: "ONLINE", latency: 38, throughput: 540 },
  { id: "MCC-DUB", name: "Dubai Aerospace Gateway (ARE)", latitude: 25.2, longitude: 55.27, status: "ONLINE", latency: 19, throughput: 1050 },
  { id: "MCC-RAR", name: "Rarotonga Pacific Uplink (COK)", latitude: -21.21, longitude: -159.78, status: "ONLINE", latency: 160, throughput: 120 },
];

// 3. Generate 1000 Satellites programmatically
export const satellites: Satellite[] = Array.from({ length: 1000 }).map((_, index) => {
  const id = `SAT-${String(index + 1).padStart(3, "0")}`;
  const constellationIndex = index % constellations.length;
  const constellation = constellations[constellationIndex];
  
  // Distribute orbits: 60% LEO, 30% MEO, 10% GEO
  const r = Math.random();
  const orbit: OrbitType = r < 0.6 ? "LEO" : r < 0.9 ? "MEO" : "GEO";

  // Altitude & velocity parameters depending on orbit
  let altitude = 500;
  let velocity = 7.6;
  if (orbit === "LEO") {
    altitude = Math.floor(350 + Math.random() * 550);
    velocity = parseFloat((7.4 + Math.random() * 0.4).toFixed(2));
  } else if (orbit === "MEO") {
    altitude = Math.floor(10000 + Math.random() * 12000);
    velocity = parseFloat((3.8 + Math.random() * 1.5).toFixed(2));
  } else {
    altitude = 35786;
    velocity = 3.07;
  }

  // Set status: 80% ACTIVE, 10% ANOMALOUS, 5% INACTIVE, 5% DECOMMISSIONED
  const statusRoll = Math.random();
  let status: SatelliteStatus = "ACTIVE";
  if (statusRoll < 0.1) status = "ANOMALOUS";
  else if (statusRoll < 0.15) status = "INACTIVE";
  else if (statusRoll < 0.2) status = "DECOMMISSIONED";

  // Telemetry metrics
  const battery = status === "DECOMMISSIONED" ? 0 : Math.floor(15 + Math.random() * 85);
  const fuel = status === "DECOMMISSIONED" ? 0 : parseFloat((5 + Math.random() * 95).toFixed(1));
  const temperature = status === "DECOMMISSIONED" ? -270 : parseFloat((10 + Math.random() * 80).toFixed(1));
  const signalStrength = status === "DECOMMISSIONED" ? -140 : Math.floor(-115 + Math.random() * 55);
  const cpuUsage = status === "DECOMMISSIONED" ? 0 : parseFloat((5 + Math.random() * 90).toFixed(1));
  const solarOutput = status === "DECOMMISSIONED" ? 0 : Math.floor(200 + Math.random() * 1200);

  // Orbit plane inclination
  const inclination = orbit === "LEO" ? parseFloat((35 + Math.random() * 25).toFixed(1)) : orbit === "MEO" ? parseFloat((50 + Math.random() * 15).toFixed(1)) : 0;

  return {
    id,
    name: `${constellation.name.split(" ")[0]} Node-${index + 1}`,
    status,
    orbit,
    velocity,
    altitude,
    inclination,
    fuel,
    battery,
    temperature,
    signalStrength,
    cpuUsage,
    solarOutput,
    constellationId: constellation.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

// 4. Generate 100 Initial Alerts
const alertTypes = [
  AlertType.COMMUNICATION_FAILURE,
  AlertType.FUEL_LEAK,
  AlertType.BATTERY_FAILURE,
  AlertType.THERMAL_ANOMALY,
  AlertType.SOLAR_PANEL_FAILURE,
  AlertType.COLLISION_RISK,
];

export const alerts: Alert[] = Array.from({ length: 250 }).map((_, index) => {
  const satIndex = index % satellites.length;
  const sat = satellites[satIndex];
  const type = alertTypes[index % alertTypes.length];
  
  const severityRoll = Math.random();
  const severity = severityRoll < 0.1 ? AlertSeverity.CRITICAL : severityRoll < 0.4 ? AlertSeverity.HIGH : severityRoll < 0.7 ? AlertSeverity.MEDIUM : AlertSeverity.LOW;
  
  const statusRoll = Math.random();
  const status = statusRoll < 0.3 ? AlertStatus.ACTIVE : statusRoll < 0.7 ? AlertStatus.ACKNOWLEDGED : AlertStatus.RESOLVED;

  let message = "";
  switch (type) {
    case "COMMUNICATION_FAILURE":
      message = "Uplink transceiver lost carrier lock.";
      break;
    case "FUEL_LEAK":
      message = "Pressure drop detected in fuel propellant lines.";
      break;
    case "BATTERY_FAILURE":
      message = "Cell voltage imbalance detected on Battery Pack B.";
      break;
    case "THERMAL_ANOMALY":
      message = "Thermal core exceeds max operational ceiling.";
      break;
    case "SOLAR_PANEL_FAILURE":
      message = "Photovoltaic panel actuator articulation fault.";
      break;
    case "COLLISION_RISK":
      message = "NORAD tracking vector reports proximity warning with space debris object.";
      break;
  }

  return {
    id: `ALRT-${String(index + 1).padStart(3, "0")}`,
    satelliteId: sat.id,
    type,
    severity,
    status,
    message,
    createdAt: new Date(Date.now() - index * 3600000), // Increments of hours
  };
});
