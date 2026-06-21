import { createFileRoute } from "@tanstack/react-router";
import {
  Thermometer,
  Droplets,
  Sun,
  CloudRain,
  Sprout,
  Activity,
  Trophy,
  Lightbulb,
  Waves,
} from "lucide-react";
import { useSensors } from "@/lib/sensor-context";
import { KpiCard } from "@/components/KpiCard";
import { MatchStatusCard } from "@/components/MatchStatusCard";
import { AlertPanel } from "@/components/AlertPanel";
import type { GroundStatus } from "@/lib/sensor-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Cricket Ground Control" },
      { name: "description", content: "Live KPI dashboard of cricket ground conditions and match playability." },
    ],
  }),
  component: Dashboard,
});

const groundToneMap: Record<GroundStatus, "success" | "info" | "warning" | "danger"> = {
  Excellent: "success",
  Good: "info",
  Moderate: "warning",
  Poor: "danger",
};

function Dashboard() {
  const { data, weather } = useSensors();
  if (!data) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <header className="flex flex-col gap-1">
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Live Telemetry</div>
        <h1 className="font-display text-3xl md:text-4xl font-black">Ground Control Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Realtime sensor stream from LabVIEW DAQ via Firebase Realtime Database.
        </p>
      </header>

      <MatchStatusCard status={data.derivedMatch.status} message={data.derivedMatch.message} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard label="Temperature" value={data.temperature} unit="°C" icon={Thermometer}
          tone={data.temperature > 40 ? "danger" : data.temperature > 35 ? "warning" : "default"}
          hint={data.temperature > 40 ? "Extreme heat" : "Within range"}
          updatedAt={data.lastUpdated} />
        <KpiCard label="Humidity" value={data.humidity} unit="%" icon={Droplets}
          tone={data.humidity > 85 ? "warning" : "info"}
          hint={data.humidity > 85 ? "Very humid" : "Comfortable"}
          updatedAt={data.lastUpdated} />
        <KpiCard label="Light Intensity" value={data.light} unit="lux" icon={Sun}
          tone={data.light < 200 ? "warning" : "default"}
          hint={data.light < 200 ? "Low light" : data.light > 800 ? "Bright" : "Adequate"}
          updatedAt={data.lastUpdated} />
        <KpiCard label="Soil Moisture" value={data.soilMoisture} unit="%" icon={Sprout}
          tone={data.soilMoisture > 75 ? "danger" : data.soilMoisture < 25 ? "warning" : "success"}
          hint={data.soilMoisture > 75 ? "Saturated" : data.soilMoisture < 25 ? "Dry" : "Optimal"}
          updatedAt={data.lastUpdated} />
        <KpiCard label="Rain Status" value={data.rain ? "Detected" : "Clear"} icon={CloudRain}
          tone={data.rain ? "danger" : "success"}
          hint={data.rain ? "Active rainfall" : "No precipitation"}
          updatedAt={data.lastUpdated} />
        <KpiCard label="Match Status" value={data.matchStatus ?? data.derivedMatch.status} icon={Trophy}
          tone={data.derivedMatch.status === "PLAYABLE" ? "success" : data.derivedMatch.status === "NOT PLAYABLE" ? "danger" : "warning"}
          updatedAt={data.lastUpdated} />
        <KpiCard label="Ground Status" value={data.derivedGround} icon={Activity}
          tone={groundToneMap[data.derivedGround]}
          updatedAt={data.lastUpdated} />
        <KpiCard label="Weather" value={data.derivedWeather} icon={CloudRain}
          tone="info" updatedAt={data.lastUpdated} />
      </div>

      {/* Equipment status cards */}
      <section>
        <h2 className="font-display text-lg font-bold mb-3">Equipment Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EquipmentCard label="Flood Lights" active={data.floodLights} icon={Lightbulb} updated={data.lastUpdated} />
          <EquipmentCard label="Irrigation System" active={data.irrigation} icon={Droplets} updated={data.lastUpdated} />
          <EquipmentCard label="Drainage Pump" active={data.drainagePump} icon={Waves} updated={data.lastUpdated} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <h3 className="font-display text-lg font-bold mb-4">Pitch Visualization</h3>
          <PitchVisual moisture={data.soilMoisture} rain={data.rain} />
        </div>
        <AlertPanel data={data} weather={weather} />
      </div>
    </div>
  );
}

function EquipmentCard({
  label,
  active,
  icon: Icon,
  updated,
}: {
  label: string;
  active: boolean;
  icon: typeof Lightbulb;
  updated: number | string;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${active ? "bg-success/15 text-success" : "bg-muted/40 text-muted-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold truncate">{label}</h3>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
            {active ? "ON" : "OFF"}
          </span>
          {active && <span className="live-dot inline-block h-2 w-2 rounded-full bg-success" />}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Updated {new Date(updated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

function PitchVisual({ moisture, rain }: { moisture: number; rain: boolean }) {
  return (
    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border/60">
      <div className="absolute inset-0 pitch-stripes" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18%] h-[70%] bg-pitch rounded-sm shadow-2xl">
        <div className="absolute inset-x-0 top-[10%] h-px bg-white/70" />
        <div className="absolute inset-x-0 bottom-[10%] h-px bg-white/70" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[80%] rounded-full border-2 border-white/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[95%] rounded-full border-2 border-white/30" />
      <div
        className="absolute inset-0 bg-info/30 mix-blend-overlay transition-opacity"
        style={{ opacity: Math.min(moisture / 100, 0.7) }}
      />
      {rain && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="rain-drop absolute w-px h-6 bg-info/80"
              style={{ left: `${(i * 2.5) % 100}%`, top: `-10%`, animationDelay: `${(i % 12) * 0.1}s` }}
            />
          ))}
        </div>
      )}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="glass rounded-full px-3 py-1 font-medium">Moisture: {moisture}%</span>
        <span className={`rounded-full px-3 py-1 font-medium ${rain ? "bg-info text-info-foreground" : "bg-success text-success-foreground"}`}>
          {rain ? "Rain active" : "Dry conditions"}
        </span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
      <div className="h-40 rounded-3xl bg-muted animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
