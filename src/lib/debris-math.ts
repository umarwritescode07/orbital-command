export interface DebrisObject {
  id: string;
  name: string;
  orbit: "LEO" | "MEO" | "GEO";
  altitude: number; // km
  inclination: number; // degrees
  velocity: number; // km/s
  size: "SMALL" | "MEDIUM" | "LARGE"; // Small <10cm, Medium 10-50cm, Large >50cm
  origin: string; // e.g., "SL-16 R/B", "Fengyun 1C Fragment"
  phase: number;
}

export interface ConjunctionEvent {
  id: string;
  satelliteId: string;
  satelliteName: string;
  debrisId: string;
  debrisName: string;
  closestApproach: number; // km
  collisionProbability: number; // percentage (0 to 100)
  relativeVelocity: number; // km/s
  timeToImpactSeconds: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Pre-compiled list of space debris fragments
export const debrisCatalog: DebrisObject[] = Array.from({ length: 150 }).map((_, index) => {
  const id = `DEB-${String(index + 1).padStart(3, "0")}`;
  const r = Math.random();
  const orbit = r < 0.7 ? "LEO" : r < 0.95 ? "MEO" : "GEO";

  let altitude = 450;
  let velocity = 7.6;
  if (orbit === "LEO") {
    altitude = Math.floor(280 + Math.random() * 650);
    velocity = parseFloat((7.3 + Math.random() * 0.5).toFixed(2));
  } else if (orbit === "MEO") {
    altitude = Math.floor(8000 + Math.random() * 14000);
    velocity = parseFloat((3.6 + Math.random() * 1.8).toFixed(2));
  } else {
    altitude = 35786;
    velocity = 3.07;
  }

  const incl = parseFloat((Math.random() * 115).toFixed(1));
  const sizeRoll = Math.random();
  const size: "SMALL" | "MEDIUM" | "LARGE" = 
    sizeRoll < 0.6 ? "SMALL" : sizeRoll < 0.9 ? "MEDIUM" : "LARGE";

  const origins = [
    "SL-16 Rocket Body",
    "Fengyun 1C debris fragment",
    "Iridium 33 Collision bolt",
    "Delta 2 upper stage shroud",
    "Cosmos 2251 insulation blanket",
    "Titan 3C structural ring",
    "CZ-4B solar panel panel",
    "Ariane 5 fairing fragment",
    "H-IIA launch clamp adapter",
    "Pegasus cooling pipe connector",
  ];
  const origin = origins[index % origins.length] + ` [Part-${index + 100}]`;

  return {
    id,
    name: `${origin.split(" ")[0]} Fragment #${index + 240}`,
    orbit,
    altitude,
    inclination: incl,
    velocity,
    size,
    origin,
    phase: Math.random() * Math.PI * 2,
  };
});

/**
 * Calculates conjunction warnings between a list of satellites and the debris catalog
 */
export function calculateConjunctions(satellitesList: any[]): ConjunctionEvent[] {
  const conjunctions: ConjunctionEvent[] = [];
  let eventIndex = 1;

  satellitesList.forEach((sat) => {
    // Check space debris mapping to this satellite's orbit
    const orbitDebris = debrisCatalog.filter((deb) => deb.orbit === sat.orbit);

    orbitDebris.forEach((deb) => {
      // Find difference in altitude and inclination planes
      const altDiff = Math.abs(sat.altitude - deb.altitude);
      const inclDiff = Math.abs(sat.inclination - deb.inclination);

      // Conjunction check: similar orbital path envelopes (e.g. altitude within 18km, inclination within 3.5 degrees)
      if (altDiff < 18 && inclDiff < 3.5) {
        // Compute pseudo approach vector calculations
        const seedValue = (sat.id.charCodeAt(4) || 65) + parseInt(deb.id.substring(4), 10);
        // Approach distance varies between 0.1km to 16.5km
        const closestApproach = parseFloat((0.1 + (seedValue % 165) / 10).toFixed(2));
        
        // Time to close approach (varying from 10 seconds to 3600 seconds)
        const timeToImpactSeconds = Math.floor(10 + (seedValue * 17) % 3590);
        
        // Relative crossing velocity
        const relativeVelocity = parseFloat((4.5 + (seedValue % 120) / 10).toFixed(1));

        // Evaluate Risk Levels & Collision Probability
        let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
        let collisionProbability = 0;

        if (closestApproach < 0.8) {
          riskLevel = "CRITICAL";
          collisionProbability = parseFloat((5.0 + (seedValue % 80) / 10).toFixed(3));
        } else if (closestApproach < 2.5) {
          riskLevel = "HIGH";
          collisionProbability = parseFloat((0.5 + (seedValue % 45) / 10).toFixed(3));
        } else if (closestApproach < 7.0) {
          riskLevel = "MEDIUM";
          collisionProbability = parseFloat((0.02 + (seedValue % 15) / 100).toFixed(3));
        } else {
          riskLevel = "LOW";
          collisionProbability = parseFloat((0.001 + (seedValue % 5) / 1000).toFixed(4));
        }

        conjunctions.push({
          id: `CONJ-${String(eventIndex++).padStart(3, "0")}`,
          satelliteId: sat.id,
          satelliteName: sat.name,
          debrisId: deb.id,
          debrisName: deb.name,
          closestApproach,
          collisionProbability,
          relativeVelocity,
          timeToImpactSeconds,
          riskLevel,
        });
      }
    });
  });

  // Sort events so critical risks appear first
  const severityMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return conjunctions.sort((a, b) => severityMap[b.riskLevel] - severityMap[a.riskLevel]);
}
