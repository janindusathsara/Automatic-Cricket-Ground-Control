import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb, Droplets, Waves, ShieldAlert, Cpu, Clock } from "lucide-react";
import { useSensors } from "@/lib/sensor-context";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "System Status · Cricket Ground Control" },
      { name: "description", content: "Control subsystem health: flood lights, irrigation, drainage, rain alerts." },
    ],
  }),
  component: SystemStatus,
});

function SystemStatus() {
  const { data, connected, usingMock } = useSensors();
  if (!data) return <div className="h-96 rounded-2xl bg-muted animate-pulse" />;

  const systems = [
    { key: "floodLights", label: "Flood Lights", icon: Lightbulb, active: data.floodLights, desc: "Automatic engagement on low light." },
    { key: "irrigation", label: "Irrigation System", icon: Droplets, active: data.irrigation, desc: "Activates when soil moisture < 35%." },
    { key: "drainagePump", label: "Drainage Pump", icon: Waves, active: data.drainagePump, desc: "Removes excess water on saturation." },
    { key: "rainAlert", label: "Rain Alert System", icon: ShieldAlert, active: !data.rain ? true : true, desc: "Monitors rain sensor continuously." },
  ];

  const activeCount = systems.filter((s) => s.active).length;
  const health = Math.round((activeCount / systems.length) * 100);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Control Plane</div>
        <h1 className="font-display text-3xl md:text-4xl font-black">System Status</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-strong rounded-2xl p-6 md:col-span-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">System Health</div>
          <div className="font-display text-5xl font-black mt-2 text-success">{health}%</div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-success transition-all" style={{ width: `${health}%` }} />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {activeCount}/{systems.length} subsystems engaged
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Cpu className="h-4 w-4" /> Connection
          </div>
          <div className="font-display text-2xl font-bold mt-2 flex items-center gap-2">
            <span className={`live-dot h-3 w-3 rounded-full inline-block ${connected ? "bg-success" : "bg-destructive"}`} />
            {connected ? "Connected" : "Disconnected"}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Source: {usingMock ? "Simulated stream" : "Firebase RTDB"}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Clock className="h-4 w-4" /> Last Sync
          </div>
          <div className="font-display text-2xl font-bold mt-2">
            {new Date(data.lastUpdated).toLocaleTimeString()}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {new Date(data.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systems.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="glass rounded-2xl p-5 flex items-center gap-4">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${s.active ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold truncate">{s.label}</h3>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${s.active ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
