import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Activity,
  Gauge,
  Sprout,
  Wind,
  CloudSun,
  Droplets,
  Sun,
  CloudRain,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useSensors } from "@/lib/sensor-context";
import { fetchWeatherApi, type WeatherApiData } from "@/lib/weather-api";
import { predictPitch, type PitchPrediction } from "@/lib/pitch-prediction";
import { firebaseEnabled, subscribeSensorData } from "@/lib/firebase";

export const Route = createFileRoute("/pitch")({
  head: () => ({
    meta: [
      { title: "AI Pitch Analysis · Cricket Ground Control" },
      {
        name: "description",
        content:
          "AI-driven pitch prediction combining live ground sensors and atmospheric data for match insights.",
      },
    ],
  }),
  component: PitchPage,
});

type HistoryEntry = {
  t: number;
  confidence: number;
  expectedScore: number;
  pitchClass: string;
  pitchType: string;
};

function PitchPage() {
  const { data } = useSensors();
  const [weather, setWeather] = useState<WeatherApiData | null>(null);
  const [weatherErr, setWeatherErr] = useState<string | null>(null);
  const [override, setOverride] = useState<Partial<PitchPrediction> | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Weather API polling
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchWeatherApi()
        .then((w) => alive && (setWeather(w), setWeatherErr(null)))
        .catch((e) => alive && setWeatherErr(e.message));
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Firebase pitchPrediction node override
  useEffect(() => {
    if (!firebaseEnabled) return;
    const unsub = subscribeSensorData("/pitchPrediction", (val) => {
      if (val && typeof val === "object") setOverride(val as unknown as Partial<PitchPrediction>);
    });
    return () => unsub();
  }, []);

  const prediction = useMemo(
    () => (data ? predictPitch(data, weather, override) : null),
    [data, weather, override],
  );

  useEffect(() => {
    if (!prediction) return;
    setHistory((h) => {
      const last = h[h.length - 1];
      if (last && Date.now() - last.t < 8_000) return h;
      const next = [
        ...h,
        {
          t: Date.now(),
          confidence: prediction.confidence,
          expectedScore: prediction.expectedScore,
          pitchClass: prediction.pitchClass,
          pitchType: prediction.pitchType,
        },
      ];
      return next.length > 30 ? next.slice(next.length - 30) : next;
    });
  }, [prediction]);

  if (!data || !prediction) {
    return <div className="h-96 rounded-2xl bg-muted animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold flex items-center gap-2">
          <Brain className="h-3.5 w-3.5" /> AI Insight
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black">AI Pitch Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Live prediction from on-ground sensors fused with atmospheric data.
        </p>
      </header>

      {/* Main prediction card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-primary/20 via-info/10 to-success/10">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Activity className="h-3.5 w-3.5" /> Prediction
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="font-display text-4xl md:text-5xl font-black">
                {prediction.pitchClass}
              </div>
              <ClassBadge value={prediction.pitchClass} />
            </div>
            <div className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
              {prediction.explanation}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <Metric label="Pitch Type" value={prediction.pitchType} />
              <Metric label="Bounce" value={prediction.bounce} />
              <Metric label="Spin" value={prediction.spinAssistance} />
              <Metric label="Seam Movement" value={prediction.seamMovement} />
              <Metric
                label="Expected 1st Innings"
                value={`${prediction.expectedScore}`}
                suffix="runs"
              />
              <Metric label="Pitch Type Code" value={prediction.pitchType.split(" ")[0]} />
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 flex flex-col items-center justify-center gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Confidence
          </div>
          <ConfidenceRing value={prediction.confidence} />
          <div className="text-center text-sm text-muted-foreground max-w-[220px]">
            Model certainty based on sensor stability and atmospheric data availability.
          </div>
        </div>
      </div>

      {/* Weather API panel */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold flex items-center gap-2">
            <CloudSun className="h-4 w-4 text-info" /> Atmospheric Data
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {weather
              ? `Updated ${new Date(weather.fetchedAt).toLocaleTimeString()}`
              : weatherErr
                ? "API unavailable"
                : "Loading…"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <WeatherStat icon={Wind} label="Wind Speed" value={weather ? `${weather.windSpeed.toFixed(1)} km/h` : "—"} />
          <WeatherStat icon={Gauge} label="Pressure" value={weather ? `${weather.pressure.toFixed(0)} hPa` : "—"} />
          <WeatherStat icon={CloudSun} label="Cloud Cover" value={weather ? `${weather.cloudCover.toFixed(0)}%` : "—"} />
          <WeatherStat icon={Droplets} label="Dew Point" value={weather ? `${weather.dewPoint.toFixed(1)}°C` : "—"} />
          <WeatherStat icon={Sun} label="UV Index" value={weather ? weather.uvIndex.toFixed(1) : "—"} />
          <WeatherStat icon={CloudRain} label="Rain Probability" value={weather ? `${weather.rainProbability.toFixed(0)}%` : "—"} />
        </div>
      </section>

      {/* Sensor inputs */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SensorChip label="Temperature" value={`${data.temperature}°C`} />
        <SensorChip label="Humidity" value={`${data.humidity}%`} />
        <SensorChip label="Soil Moisture" value={`${data.soilMoisture}%`} />
        <SensorChip label="Light" value={`${data.light} lux`} />
        <SensorChip label="Rain" value={data.rain ? "Detected" : "None"} />
      </section>

      {/* Analytics */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-bold flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" /> Confidence Trend
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history.map((h) => ({ ...h, time: new Date(h.t).toLocaleTimeString() }))}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" hide />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="confidence" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="expectedScore" stroke="var(--success)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Confidence %</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Expected Score</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-bold flex items-center gap-2 mb-3">
            <Sprout className="h-4 w-4 text-success" /> Prediction History
          </h3>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">Collecting samples…</div>
          ) : (
            <ul className="divide-y divide-border/60 max-h-64 overflow-auto">
              {[...history].reverse().slice(0, 12).map((h) => (
                <li key={h.t} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClassBadge value={h.pitchClass as PitchPrediction["pitchClass"]} compact />
                    <span className="truncate text-muted-foreground">{h.pitchType}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs">{h.confidence}%</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.t).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold leading-tight">
        {value} {suffix && <span className="text-xs text-muted-foreground font-normal">{suffix}</span>}
      </div>
    </div>
  );
}

function WeatherStat({ icon: Icon, label, value }: { icon: typeof Wind; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-3 bg-background/40">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-display text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

function SensorChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function ClassBadge({
  value,
  compact = false,
}: {
  value: PitchPrediction["pitchClass"];
  compact?: boolean;
}) {
  const map: Record<string, string> = {
    "Batting Friendly": "bg-warning/20 text-warning border-warning/40",
    "Bowling Friendly": "bg-info/20 text-info border-info/40",
    "Balanced Pitch": "bg-success/20 text-success border-success/40",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 ${compact ? "py-0.5 text-[10px]" : "py-1 text-xs"} font-semibold ${map[value]}`}
    >
      {value}
    </span>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const size = 168;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--primary)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl font-black">{value}%</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Certainty</div>
      </div>
    </div>
  );
}
