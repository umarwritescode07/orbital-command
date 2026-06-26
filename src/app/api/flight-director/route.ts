import { NextResponse } from "next/server";
import { satellites } from "@/lib/mock-data";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    const apiKey = process.env.OPENAI_API_KEY;
    const isMockKey = !apiKey || apiKey === "sk-proj-placeholderkey" || apiKey.trim() === "";

    // Build current telemetry snapshot context to inject into system prompt
    const anomalousSats = satellites.filter((s) => s.status === "ANOMALOUS");
    const telemetryContext = satellites.slice(0, 10).map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      battery: s.battery,
      fuel: s.fuel,
      temp: s.temperature,
      cpu: s.cpuUsage,
      sig: s.signalStrength,
    }));

    const systemPrompt = `You are the AI Flight Director (Flight-D1) for the ACOC Aerospace Mission Operations Center.
You possess deep knowledge of orbital mechanics, spacecraft telemetry, and anomaly diagnostics.
Here is the current operational telemetry snapshot of key satellites:
${JSON.stringify(telemetryContext, null, 2)}
Active Anomalous Satellites:
${JSON.stringify(anomalousSats, null, 2)}

Provide logical, highly technical, and concise diagnostics. Limit your answers to clear paragraphs.
Always include:
- DIAGNOSIS: Root cause analysis of the query.
- CONFIDENCE: Estimation of diagnostic confidence (0-100%).
- ACTION REQUIRED: Bulleted mitigation protocols.`;

    if (!isMockKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const completion = await response.json();
          const reply = completion.choices[0]?.message?.content || "";
          return NextResponse.json({
            source: "openai",
            message: reply,
          });
        } else {
          console.warn("⚠️ OpenAI connection returned non-200. Falling back to local diagnostic core.");
        }
      } catch (e) {
        console.warn("⚠️ OpenAI connection failed. Falling back to local diagnostic core.");
      }
    }

    // Local Diagnostic Core Fallback (Intelligent keyword matcher)
    const query = lastMessage.toLowerCase();
    let answer = "";

    if (query.includes("battery") || query.includes("charge") || query.includes("power")) {
      answer = `### 📡 FLIGHT DIRECTOR DIAGNOSIS
**DIAGNOSIS:** Telemetry indicates that **SAT-001 (Orbit-X12)** is undergoing an intense thermal spike (78.4°C) combined with maximum processor cycle loops (94% CPU). This suggests a bus control microcode loop is preventing the solar regulators from charging the batteries.

**CONFIDENCE:** 92%

**ACTION REQUIRED:**
1. Send telemetry command **CMD-SYS-SAFE-MODE** to bypass CPU lock.
2. Articulate Solar Array Panels +15° relative to solar vector to optimize panel cell temperatures.
3. Deploy backup Battery B cell heater circuit.`;
    } else if (query.includes("temp") || query.includes("heat") || query.includes("thermal")) {
      answer = `### 🌡️ FLIGHT DIRECTOR DIAGNOSIS
**DIAGNOSIS:** Thermal core on satellite **SAT-001 (Orbit-X12)** is reporting 78.4°C (maximum nominal constraint: 85°C). Close approach analysis matches this with payload processor load spikes. There is a secondary warning of solar array axis rotation failure, locking the heat radiator panels in direct alignment with the Sun.

**CONFIDENCE:** 88%

**ACTION REQUIRED:**
1. Re-orient spacecraft attitude yaw angles by 35° to shade the radiator deck.
2. Shed non-essential transponder power loads.
3. Initiate radiator gimbal motor diagnostic checks.`;
    } else if (query.includes("risk") || query.includes("debris") || query.includes("collision")) {
      answer = `### ☄️ FLIGHT DIRECTOR DIAGNOSIS
**DIAGNOSIS:** NORAD conjunction tracking systems predict two close approach events in the LEO quadrant. Specifically, **SAT-001 (Orbit-X12)** has an active conjunction risk with **DEB-240 (Fengyun 1C debris)**. Closest approach is 0.5km with a collision probability of 5.4%. Time to impact: 14m 12s.

**CONFIDENCE:** 99% (Radar tracked)

**ACTION REQUIRED:**
1. Prepare **Orbital Maneuver Command (OMC-01)**.
2. Fire thruster thr-A for a delta-V burn of +0.15 m/s to raise perigee by 2.4 km.
3. Acknowledge and notify Houston tracking nodes of collision vector shifts.`;
    } else {
      answer = `### 🛰️ FLIGHT DIRECTOR DIAGNOSIS
**DIAGNOSIS:** All fleet nodes are currently being queried. Fleet-wide average orbit health is stable at 98.4%. One anomalous unit (SAT-001) is experiencing CPU/power fluctuations. Communication signal logs are healthy.

**CONFIDENCE:** 85%

**ACTION REQUIRED:**
* Check satellite tracker console for anomalous alerts.
* Monitor live battery capacity drops in the Telemetry analysis deck.
* If querying specific systems, input "battery", "temperature", or "risk" to parse ECI variables.`;
    }

    return NextResponse.json({
      source: "local_diagnostic_core",
      message: answer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
