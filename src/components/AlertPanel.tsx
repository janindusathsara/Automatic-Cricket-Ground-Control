import { AlertTriangle, CloudRain, Droplets, Sun, Wind, Waves } from "lucide-react";
import type { EnrichedSensor } from "@/lib/useSensorData";
import type { WeatherData } from "@/lib/sensor-types";

type Priority = "critical" | "warning" | "info";
type Alert = {
  id: string;
  icon: typeof AlertTriangle;
  priority: Priority;
  title: string;
  msg: string;
  time: number;
};

const toneMap: Record<Priority, string> = {
  critical: "text-destructive bg-destructive/10 border-destructive/30",
  warning: "text-warning bg-warning/10 border-warning/30",
  info: "text-info bg-info/10 border-info/30",
};

export function AlertPanel({
  data,
  weather,
}: {
  data: EnrichedSensor;
  weather?: WeatherData | null;
}) {
  const now = Date.now();
  const alerts: Alert[] = [];

  if (data.rain)
    alerts.push({ id: "rain", icon: CloudRain, priority: "critical", title: "Rain Alert", msg: "Active rainfall detected on ground.", time: now });
  if (data.humidity > 85)
    alerts.push({ id: "hum", icon: Droplets, priority: "warning", title: "High Humidity", msg: `Humidity at ${data.humidity}% — exceeds 85%.`, time: now });
  if (data.soilMoisture > 80)
    alerts.push({ id: "wet", icon: Droplets, priority: "warning", title: "Excess Soil Moisture", msg: `Soil moisture at ${data.soilMoisture}% — exceeds 80%.`, time: now });
  if (data.temperature > 40)
    alerts.push({ id: "heat", icon: Sun, priority: "critical", title: "Extreme Heat", msg: `Temperature at ${data.temperature}°C.`, time: now });
  if (data.rain && data.soilMoisture > 75)
    alerts.push({ id: "drain", icon: Waves, priority: "info", title: "Drainage Recommended", msg: "Rain + high soil moisture — engage drainage pump.", time: now });

  if (weather) {
    if (weather.uv > 8)
      alerts.push({ id: "uv", icon: Sun, priority: "warning", title: "UV Warning", msg: `UV index ${weather.uv.toFixed(1)} — sun protection advised.`, time: now });
    if (weather.wind_kph > 25)
      alerts.push({ id: "wind", icon: Wind, priority: "warning", title: "High Wind", msg: `Wind ${weather.wind_kph.toFixed(1)} km/h.`, time: now });
    if (weather.precip_mm > 5)
      alerts.push({ id: "precip", icon: CloudRain, priority: "critical", title: "Heavy Precipitation", msg: `${weather.precip_mm.toFixed(1)} mm rainfall.`, time: now });
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-bold">Alerts</h3>
        <span className="text-xs text-muted-foreground">{alerts.length} active</span>
      </div>
      {alerts.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          ✓ All systems nominal — no active alerts.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 ${toneMap[a.priority]}`}>
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm">{a.title}</div>
                    <span className="text-[10px] uppercase tracking-wider opacity-80">{a.priority}</span>
                  </div>
                  <div className="text-xs opacity-90">{a.msg}</div>
                  <div className="text-[10px] opacity-70 mt-1">{new Date(a.time).toLocaleTimeString()}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
