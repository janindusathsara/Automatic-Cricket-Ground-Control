import { createFileRoute } from "@tanstack/react-router";
import { Sun, Cloud, CloudRain, CloudFog, Thermometer, Droplets } from "lucide-react";
import { useSensors } from "@/lib/sensor-context";

export const Route = createFileRoute("/weather")({
  head: () => ({
    meta: [
      { title: "Weather · Cricket Ground Control" },
      { name: "description", content: "Current weather conditions derived from on-ground sensors." },
    ],
  }),
  component: Weather,
});

const iconMap = { Sunny: Sun, Cloudy: Cloud, Overcast: CloudFog, Rainy: CloudRain };
const gradMap: Record<string, string> = {
  Sunny: "from-warning/40 to-warning/10",
  Cloudy: "from-info/30 to-muted/30",
  Overcast: "from-muted/60 to-muted/20",
  Rainy: "from-info/50 to-info/10",
};

function Weather() {
  const { data } = useSensors();
  if (!data) return <div className="h-64 rounded-2xl bg-muted animate-pulse" />;

  const Icon = iconMap[data.derivedWeather];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Atmospheric</div>
        <h1 className="font-display text-3xl md:text-4xl font-black">Weather Conditions</h1>
      </header>

      <div className={`glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden bg-gradient-to-br ${gradMap[data.derivedWeather]}`}>
        {data.derivedWeather === "Sunny" && (
          <div className="sun-spin absolute -top-20 -right-20 h-72 w-72 rounded-full bg-warning/40 blur-2xl" />
        )}
        {data.derivedWeather === "Rainy" && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 60 }).map((_, i) => (
              <span key={i} className="rain-drop absolute w-px h-8 bg-info/70" style={{ left: `${(i*1.7)%100}%`, animationDelay: `${(i%10)*0.12}s` }} />
            ))}
          </div>
        )}
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <Icon className="h-32 w-32 text-foreground drop-shadow-lg" />
          <div className="text-center md:text-left">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current</div>
            <div className="font-display text-6xl md:text-7xl font-black">{data.temperature}°C</div>
            <div className="font-display text-2xl font-bold mt-2">{data.derivedWeather}</div>
            <div className="text-muted-foreground mt-1 text-sm">
              {weatherDescription(data.derivedWeather)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Thermometer} label="Temperature" value={`${data.temperature}°C`} />
        <Stat icon={Droplets} label="Humidity" value={`${data.humidity}%`} />
        <Stat icon={Sun} label="Light" value={`${data.light} lux`} />
        <Stat icon={CloudRain} label="Rain" value={data.rain ? "Active" : "None"} />
      </div>
    </div>
  );
}

function weatherDescription(w: string) {
  switch (w) {
    case "Sunny": return "Clear skies and high ambient light — ideal playing visibility.";
    case "Cloudy": return "Diffuse light with elevated humidity. Comfortable for play.";
    case "Overcast": return "Heavy cloud cover. Flood lights may engage automatically.";
    case "Rainy": return "Active precipitation detected. Match paused for ground safety.";
    default: return "";
  }
}

function Stat({ icon: Icon, label, value }: { icon: typeof Sun; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="font-display text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}
