import { createFileRoute } from "@tanstack/react-router";
import { Brain, Activity, Clock, Sprout } from "lucide-react";
import { usePrediction } from "@/lib/sensor-context";
import type { PredictionData } from "@/lib/sensor-types";

export const Route = createFileRoute("/pitch")({
  head: () => ({
    meta: [
      { title: "AI Pitch Analysis · Cricket Ground Control" },
      { name: "description", content: "AI pitch prediction sourced from Firebase Realtime Database." },
    ],
  }),
  component: PitchPage,
});

function PitchPage() {
  const { data, error, loading } = usePrediction();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold flex items-center gap-2">
          <Brain className="h-3.5 w-3.5" /> AI Insight
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black">AI Pitch Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Prediction data sourced from Firebase /cricket_ground/prediction.
        </p>
      </header>

      {loading && <div className="h-64 rounded-3xl bg-muted animate-pulse" />}

      {!loading && !data && (
        <div className="glass rounded-3xl p-8 text-center">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold">No prediction available</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error ?? "Waiting for AI model to publish prediction data to Firebase."}
          </p>
        </div>
      )}

      {data && <PredictionView data={data} />}

      {/* History section */}
      <section className="glass rounded-2xl p-5">
        <h3 className="font-display font-bold flex items-center gap-2 mb-3">
          <Sprout className="h-4 w-4 text-success" /> Prediction History
        </h3>
        <p className="text-sm text-muted-foreground">No historical prediction data available.</p>
      </section>
    </div>
  );
}

function PredictionView({ data }: { data: PredictionData }) {
  const confidencePct = Math.round((data.confidence > 1 ? data.confidence : data.confidence * 100));
  const summary = `AI Model predicts a ${data.pitch_type} pitch with ${confidencePct}% confidence. ${data.bounce} bounce, ${data.spin} spin assistance and ${data.seam_movement} seam movement expected.`;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-strong rounded-3xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-br from-primary/20 via-info/10 to-success/10">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Activity className="h-3.5 w-3.5" /> AI Summary
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="font-display text-4xl md:text-5xl font-black">{data.pitch_type}</div>
              <ClassBadge value={data.pitch_type} />
            </div>
            <div className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
              {summary}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <Metric label="Pitch Type" value={data.pitch_type} />
              <Metric label="Bounce" value={data.bounce} />
              <Metric label="Spin Assistance" value={data.spin} />
              <Metric label="Seam Movement" value={data.seam_movement} />
              <Metric label="Confidence" value={`${confidencePct}%`} />
              {data.generated_at && (
                <Metric label="Generated" value={new Date(data.generated_at).toLocaleTimeString()} />
              )}
            </div>
            {data.generated_at && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(data.generated_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 flex flex-col items-center justify-center gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Confidence</div>
          <ConfidenceRing value={confidencePct} />
          <div className="text-center text-sm text-muted-foreground max-w-[220px]">
            Model certainty reported by the AI prediction engine.
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold leading-tight truncate">{value}</div>
    </div>
  );
}

function ClassBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const cls = v.includes("batting")
    ? "bg-warning/20 text-warning border-warning/40"
    : v.includes("bowling")
      ? "bg-info/20 text-info border-info/40"
      : "bg-success/20 text-success border-success/40";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
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
  const color = value >= 90 ? "var(--success)" : value >= 70 ? "var(--warning)" : "var(--destructive)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl font-black" style={{ color }}>{value}%</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Certainty</div>
      </div>
    </div>
  );
}
