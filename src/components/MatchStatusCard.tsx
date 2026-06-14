import { CheckCircle2, XCircle, AlertTriangle, Wrench } from "lucide-react";
import type { MatchStatus } from "@/lib/sensor-types";

const map: Record<MatchStatus, { ring: string; bg: string; icon: typeof CheckCircle2; text: string }> = {
  PLAYABLE: { ring: "ring-success/40", bg: "bg-success text-success-foreground", icon: CheckCircle2, text: "text-success" },
  "NOT PLAYABLE": { ring: "ring-destructive/40", bg: "bg-destructive text-destructive-foreground", icon: XCircle, text: "text-destructive" },
  "WEATHER WARNING": { ring: "ring-warning/40", bg: "bg-warning text-warning-foreground", icon: AlertTriangle, text: "text-warning" },
  "GROUND MAINTENANCE": { ring: "ring-info/40", bg: "bg-info text-info-foreground", icon: Wrench, text: "text-info" },
};

export function MatchStatusCard({ status, message }: { status: MatchStatus; message: string }) {
  const m = map[status];
  const Icon = m.icon;
  return (
    <div className={`glass-strong rounded-3xl p-6 md:p-8 ring-2 ${m.ring} relative overflow-hidden`}>
      <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-30 blur-3xl pitch-stripes" aria-hidden />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className={`grid h-20 w-20 place-items-center rounded-2xl ${m.bg} shadow-lg shrink-0`}>
          <Icon className="h-10 w-10" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Match Status</div>
          <h2 className={`font-display text-4xl md:text-5xl font-black ${m.text}`}>{status}</h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">{message}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="live-dot h-2 w-2 rounded-full bg-success inline-block" />
          Live sensor feed
        </div>
      </div>
    </div>
  );
}
