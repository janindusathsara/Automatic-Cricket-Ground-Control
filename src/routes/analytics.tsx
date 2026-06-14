import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Download } from "lucide-react";
import { useSensors } from "@/lib/sensor-context";
import { exportHistoryCSV } from "@/lib/csv";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Cricket Ground Control" },
      { name: "description", content: "Real-time charts for temperature, humidity, light intensity, and soil moisture." },
    ],
  }),
  component: Analytics,
});

const charts = [
  { key: "temperature", label: "Temperature", unit: "°C", color: "var(--destructive)" },
  { key: "humidity", label: "Humidity", unit: "%", color: "var(--info)" },
  { key: "light", label: "Light Intensity", unit: "lux", color: "var(--warning)" },
  { key: "soilMoisture", label: "Soil Moisture", unit: "%", color: "var(--success)" },
] as const;

function Analytics() {
  const { history } = useSensors();
  const data = history.map((h) => ({ ...h, time: new Date(h.t).toLocaleTimeString() }));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Time-Series</div>
          <h1 className="font-display text-3xl md:text-4xl font-black">Analytics</h1>
          <p className="text-sm text-muted-foreground">Updates every second · {history.length} samples retained</p>
        </div>
        <button
          onClick={() => exportHistoryCSV(history)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {charts.map((c) => (
          <div key={c.key} className="glass rounded-2xl p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-display font-bold">{c.label}</h3>
              <span className="text-xs text-muted-foreground">{c.unit}</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`g-${c.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.color} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={c.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="time" hide />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey={c.key}
                    stroke={c.color}
                    strokeWidth={2}
                    fill={`url(#g-${c.key})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
