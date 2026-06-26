// Earth constants
export const EARTH_RADIUS = 6371; // km
export const EARTH_MU = 398600.4418; // km^3 / s^2 (Standard gravitational parameter GM)

export interface OrbitCalculationInput {
  altitude: number; // km
  velocity: number; // km/s
  inclination: number; // degrees
  mass: number; // kg
}

export interface OrbitCalculationOutput {
  stable: boolean;
  status: "STABLE" | "ELLIPTICAL" | "DECAY" | "ESCAPE";
  eccentricity: number;
  semiMajorAxis: number;
  orbitalPeriod: number; // in seconds
  perigeeAltitude: number; // km
  apogeeAltitude: number; // km
  escapeVelocity: number; // km/s
  circularVelocity: number; // km/s
  lifetimeYears: number; // estimated atmospheric decay life
}

/**
 * Calculates Keplerian orbital parameters from initial values
 */
export function calculateOrbitalParameters(input: OrbitCalculationInput): OrbitCalculationOutput {
  const { altitude, velocity, inclination, mass } = input;

  const r = EARTH_RADIUS + altitude; // distance to Earth center
  
  // 1. Circular Velocity at this altitude
  const circularVelocity = Math.sqrt(EARTH_MU / r);

  // 2. Escape Velocity at this altitude
  const escapeVelocity = Math.sqrt((2 * EARTH_MU) / r);

  // Status checks
  if (velocity >= escapeVelocity) {
    return {
      stable: false,
      status: "ESCAPE",
      eccentricity: 1.0,
      semiMajorAxis: Infinity,
      orbitalPeriod: Infinity,
      perigeeAltitude: altitude,
      apogeeAltitude: Infinity,
      escapeVelocity,
      circularVelocity,
      lifetimeYears: Infinity,
    };
  }

  // 3. Semi-major axis from vis-viva equation: v^2 = mu * (2/r - 1/a)
  const invA = (2 / r) - (Math.pow(velocity, 2) / EARTH_MU);
  const semiMajorAxis = 1 / invA;

  // 4. Eccentricity: assumes launch is at apogee or perigee for simplicity
  const eccentricity = Math.abs(1 - (r / semiMajorAxis));

  const perigeeRadius = semiMajorAxis * (1 - eccentricity);
  const apogeeRadius = semiMajorAxis * (1 + eccentricity);

  const perigeeAltitude = perigeeRadius - EARTH_RADIUS;
  const apogeeAltitude = apogeeRadius - EARTH_RADIUS;

  // 5. Orbital Period: T = 2 * pi * sqrt(a^3 / mu)
  let orbitalPeriod = 0;
  if (semiMajorAxis > 0) {
    orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / EARTH_MU);
  }

  // 6. Orbital Lifetime (LEO atmospheric drag approximation)
  // Empirical decay model: scale factor dependent on ballistic coefficient
  let lifetimeYears = Infinity;
  if (perigeeAltitude < 120) {
    lifetimeYears = 0; // immediate decay
  } else if (perigeeAltitude < 900) {
    // Ballistic Coefficient BC = mass / (Cd * Area), assume Cd = 2.2, Area = 2.0 m^2 for typical satellite
    const area = 2.0;
    const Cd = 2.2;
    const BC = mass / (Cd * area);
    
    // Scale altitude lifetime
    lifetimeYears = (BC / 100) * Math.exp((perigeeAltitude - 180) / 48);
  }

  // Determine Orbit state
  let status: "STABLE" | "ELLIPTICAL" | "DECAY" | "ESCAPE" = "ELLIPTICAL";
  let stable = true;

  if (perigeeAltitude <= 100) {
    status = "DECAY";
    stable = false;
  } else if (eccentricity < 0.01) {
    status = "STABLE";
  }

  return {
    stable,
    status,
    eccentricity: parseFloat(eccentricity.toFixed(5)),
    semiMajorAxis: parseFloat(semiMajorAxis.toFixed(1)),
    orbitalPeriod: parseFloat(orbitalPeriod.toFixed(1)),
    perigeeAltitude: parseFloat(perigeeAltitude.toFixed(1)),
    apogeeAltitude: parseFloat(apogeeAltitude.toFixed(1)),
    escapeVelocity: parseFloat(escapeVelocity.toFixed(3)),
    circularVelocity: parseFloat(circularVelocity.toFixed(3)),
    lifetimeYears: parseFloat(lifetimeYears.toFixed(2)),
  };
}
