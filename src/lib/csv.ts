import type { HistoryPoint } from "@/lib/useSensorData";

export function exportHistoryCSV(history: HistoryPoint[], filename = "cricket-ground-history.csv") {
  const header = "timestamp,temperature_c,humidity_pct,light_lux,soil_moisture_pct\n";
  const rows = history
    .map((h) =>
      [new Date(h.t).toISOString(), h.temperature, h.humidity, h.light, h.soilMoisture].join(",")
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
