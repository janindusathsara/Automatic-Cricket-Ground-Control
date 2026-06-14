import { AlertTriangle, CloudRain, Droplets, Sun, MoonStar } from "lucide-react";
import type { EnrichedSensor } from "@/lib/useSensorData";

export function AlertPanel({ data }: { data: EnrichedSensor }) {
  const alerts: { id: string; icon: typeof AlertTriangle; tone: string; title: string; msg: string }[] = [];
  if (data.rain) alerts.push({ id: "rain", icon: CloudRain, tone: "text-info bg-info/10 border-info/30", title: "Rain Alert", msg: "Active rainfall detected on ground." });
  if (data.soilMoisture > 70) alerts.push({ id: "wet", icon: Droplets, tone: "text-warning bg-warning/10 border-warning/30", title: "Wet Ground Alert", msg: `Soil moisture at ${data.soilMoisture}% — exceeds 70% threshold.` });
  if (data.temperature > 40) alerts.push({ id: "heat", icon: Sun, tone: "text-destructive bg-destructive/10 border-destructive/30", title: "Extreme Heat Alert", msg: `Temperature at ${data.temperature}°C.` });
  if (data.light < 200) alerts.push({ id: "lowlight", icon: MoonStar, tone: "text-info bg-info/10 border-info/30", title: "Low Light Alert", msg: "Flood lights may be required." });

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
              <li key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 ${a.tone}`}>
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{a.title}</div>
                  <div className="text-xs opacity-90">{a.msg}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
