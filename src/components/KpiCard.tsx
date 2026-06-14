import { type LucideIcon } from "lucide-react";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
};

const toneBg: Record<Tone, string> = {
  default: "bg-muted/60 text-muted-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  danger: "bg-destructive/15 text-destructive",
  info: "bg-info/15 text-info",
};

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "default",
  hint,
  updatedAt,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  updatedAt?: number | string;
}) {
  const ts = updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—";
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 transition hover:translate-y-[-2px] hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${toneBg[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-display text-3xl font-bold ${toneStyles[tone]}`}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{hint ?? ""}</span>
        <span className="shrink-0">{ts}</span>
      </div>
    </div>
  );
}
