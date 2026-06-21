import { createFileRoute } from "@tanstack/react-router";
import {
  Wind,
  Cloud,
  CloudRain,
  Gauge as GaugeIcon,
  Droplets,
  Sun,
  ShieldAlert,
} from "lucide-react";
import { useWeather } from "@/lib/sensor-context";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather Monitoring · Cricket Ground Control" },
      { name: "description", content: "Live atmospheric data from Firebase Realtime Database." },
    ],
  }),
  component: Weather,
});

type Risk = { level: "Low" | "Medium" | "High"; tone: string; message: string };

function assessRisk(precip_mm: number): Risk {
  if (precip_mm > 5)
    return {
      level: "High",
      tone: "bg-destructive/15 text-destructive border-destructive/40",
      message: "Heavy rainfall expected — suspend play and engage drainage systems.",
    };
  if (precip_mm >= 1)
    return {
      level: "Medium",
      tone: "bg-warning/15 text-warning border-warning/40",
      message: "Moderate precipitation — monitor conditions closely.",
    };
  return {
    level: "Low",
    tone: "bg-success/15 text-success border-success/40",
    message: "Minimal precipitation — conditions favorable for play.",
  };
}

function Weather() {
  const { data, error, usingMock } = useWeather();
  if (!data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  const risk = assessRisk(data.precip_mm);
  const updated = data.last_updated ?? data.timestamp;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Atmospheric</div>
          <h1 className="font-display text-3xl md:text-4xl font-black">Weather Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Source: Firebase /cricket_ground/weather {usingMock && "· simulated"}
          </p>
        </div>
        {updated && (
          <div className="text-xs text-muted-foreground">
            Updated {new Date(updated).toLocaleString()}
          </div>
        )}
      </header>

      {/* Risk Assessment */}
      <div className={`glass-strong rounded-3xl p-6 md:p-8 border ${risk.tone}`}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6" />
          <div className="text-xs uppercase tracking-[0.2em] font-semibold">Weather Risk</div>
        </div>
        <div className="font-display text-4xl md:text-5xl font-black mt-2">{risk.level} Risk</div>
        <p className="mt-2 text-sm md:text-base opacity-90">{risk.message}</p>
        <div className="mt-3 text-xs opacity-80">Rainfall: {data.precip_mm.toFixed(1)} mm</div>
      </div>

      {/* Weather metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <WeatherCard icon={Wind} label="Wind Speed" value={data.wind_kph.toFixed(1)} unit="km/h"
          tone={data.wind_kph > 25 ? "warning" : "info"} />
        <WeatherCard icon={Cloud} label="Cloud Cover" value={data.cloud.toFixed(0)} unit="%"
          tone="info" />
        <WeatherCard icon={CloudRain} label="Rainfall" value={data.precip_mm.toFixed(1)} unit="mm"
          tone={data.precip_mm > 5 ? "danger" : data.precip_mm >= 1 ? "warning" : "success"} />
        <WeatherCard icon={GaugeIcon} label="Pressure" value={data.pressure_mb.toFixed(0)} unit="mb"
          tone="info" />
        <WeatherCard icon={Droplets} label="Dew Point" value={data.dewpoint_c.toFixed(1)} unit="°C"
          tone="info" />
        <WeatherCard icon={Sun} label="UV Index" value={data.uv.toFixed(1)} unit=""
          tone={data.uv > 8 ? "danger" : data.uv > 6 ? "warning" : "success"} />
      </div>
    </div>
  );
}

function WeatherCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: typeof Wind;
  label: string;
  value: string;
  unit: string;
  tone: "success" | "danger" | "warning" | "info";
}) {
  const toneCls = {
    success: "text-success",
    danger: "text-destructive",
    warning: "text-warning",
    info: "text-info",
  }[tone];
  return (
    <div className="glass rounded-2xl p-5 hover:shadow-lg transition-shadow">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${toneCls}`}>
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="font-display text-3xl font-black mt-2">
        {value} <span className="text-base font-bold text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
