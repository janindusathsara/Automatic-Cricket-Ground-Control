import { createFileRoute } from "@tanstack/react-router";
import { Sprout, CloudRain, Sun, MoonStar, Activity } from "lucide-react";
import { useSensors } from "@/lib/sensor-context";
import { AlertPanel } from "@/components/AlertPanel";

export const Route = createFileRoute("/ground")({
  head: () => ({
    meta: [
      { title: "Ground Monitoring · Cricket Ground Control" },
      { name: "description", content: "Visual ground monitoring with moisture, rain, lighting, and environmental alerts." },
    ],
  }),
  component: Ground,
});

function Ground() {
  const { data } = useSensors();
  if (!data) return <div className="h-96 rounded-2xl bg-muted animate-pulse" />;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Field</div>
        <h1 className="font-display text-3xl md:text-4xl font-black">Ground Monitoring</h1>
        <p className="text-sm text-muted-foreground">Live field map and environmental sensor overlay.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold">Field View</h3>
            <span className="text-xs text-muted-foreground">Status: {data.derivedGround}</span>
          </div>
          <FieldMap moisture={data.soilMoisture} rain={data.rain} light={data.light} />
        </div>

        <div className="flex flex-col gap-4">
          <Gauge label="Soil Moisture" value={data.soilMoisture} max={100} unit="%" tone={data.soilMoisture > 70 ? "danger" : "success"} icon={Sprout} />
          <Gauge label="Light Level" value={data.light} max={1200} unit="lux" tone={data.light < 200 ? "warning" : "info"} icon={Sun} />
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Activity className="h-4 w-4" /> Environmental
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Pill icon={CloudRain} label="Rain" value={data.rain ? "Active" : "None"} active={data.rain} />
              <Pill icon={Sprout} label="Ground" value={data.derivedGround} active={data.derivedGround !== "READY"} />
              <Pill icon={MoonStar} label="Floodlights" value={data.floodLights ? "On" : "Off"} active={data.floodLights} />
              <Pill icon={Sun} label="Weather" value={data.derivedWeather} active={false} />
            </div>
          </div>
        </div>
      </div>

      <AlertPanel data={data} />
    </div>
  );
}

function FieldMap({ moisture, rain, light }: { moisture: number; rain: boolean; light: number }) {
  return (
    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-border/60 bg-primary">
      <div className="absolute inset-0 pitch-stripes" />
      {/* Boundary */}
      <div className="absolute inset-4 rounded-full border-4 border-white/70" />
      {/* 30-yard circle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[70%] w-[55%] rounded-full border-2 border-white/50" />
      {/* Pitch */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[55%] w-[12%] bg-pitch rounded shadow-2xl">
        <div className="absolute inset-x-0 top-[8%] h-px bg-white" />
        <div className="absolute inset-x-0 bottom-[8%] h-px bg-white" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/70" />
      </div>
      {/* Moisture overlay */}
      <div
        className="absolute inset-0 bg-info/40 mix-blend-overlay"
        style={{ opacity: Math.min(moisture / 100, 0.75) }}
      />
      {/* Light overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: Math.max(0, 0.5 - light / 2000) }}
      />
      {/* Rain */}
      {rain && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <span key={i} className="rain-drop absolute w-px h-6 bg-info/80"
              style={{ left: `${(i*1.7)%100}%`, animationDelay: `${(i%12)*0.1}s` }} />
          ))}
        </div>
      )}
      {/* Corner sensors */}
      {[
        { top: "8%", left: "8%" },
        { top: "8%", right: "8%" },
        { bottom: "8%", left: "8%" },
        { bottom: "8%", right: "8%" },
      ].map((p, i) => (
        <div key={i} className="absolute" style={p as React.CSSProperties}>
          <span className="live-dot inline-block h-3 w-3 rounded-full bg-success border-2 border-white" />
        </div>
      ))}
    </div>
  );
}

function Gauge({ label, value, max, unit, tone, icon: Icon }: { label: string; value: number; max: number; unit: string; tone: "success" | "danger" | "warning" | "info"; icon: typeof Sun }) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = { success: "bg-success", danger: "bg-destructive", warning: "bg-warning", info: "bg-info" }[tone];
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
        <span>{value} {unit}</span>
      </div>
      <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Pill({ icon: Icon, label, value, active }: { icon: typeof Sun; label: string; value: string; active: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${active ? "border-primary/40 bg-primary/10" : "border-border/60 bg-muted/30"}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-semibold text-sm mt-0.5 truncate">{value}</div>
    </div>
  );
}
