export type SensorData = {
  temperature: number;
  humidity: number;
  light: number;
  rain: boolean;
  soilMoisture: number;
  floodLights: boolean;
  irrigation: boolean;
  drainagePump: boolean;
  matchStatus?: string;
  lastUpdated: number | string;
};

export type WeatherData = {
  wind_kph: number;
  cloud: number;
  precip_mm: number;
  pressure_mb: number;
  dewpoint_c: number;
  uv: number;
  last_updated?: string;
  timestamp?: string;
};

export type PredictionData = {
  pitch_type: string;
  bounce: string;
  spin: string;
  seam_movement: string;
  confidence: number; // 0..1
  generated_at?: string;
};

export type GroundStatus = "Excellent" | "Good" | "Moderate" | "Poor";

export type MatchStatus =
  | "PLAYABLE"
  | "NOT PLAYABLE"
  | "WEATHER WARNING"
  | "GROUND MAINTENANCE";

export type WeatherCondition = "Sunny" | "Cloudy" | "Overcast" | "Rainy";

export function deriveGroundStatus(
  d: Pick<SensorData, "rain" | "soilMoisture" | "humidity">,
): GroundStatus {
  if (d.rain || d.soilMoisture > 85) return "Poor";
  if (d.humidity > 85 || d.soilMoisture > 75) return "Moderate";
  if (!d.rain && d.soilMoisture >= 35 && d.soilMoisture <= 65 && d.humidity < 85)
    return "Excellent";
  if (!d.rain && d.soilMoisture >= 25 && d.soilMoisture <= 75) return "Good";
  return "Moderate";
}

export function deriveMatchStatus(
  d: Pick<SensorData, "rain" | "soilMoisture" | "temperature" | "matchStatus">,
): { status: MatchStatus; message: string } {
  if (d.matchStatus) {
    const ms = d.matchStatus.toLowerCase();
    if (ms.includes("ready") || ms.includes("playable"))
      return { status: "PLAYABLE", message: d.matchStatus };
    if (ms.includes("not")) return { status: "NOT PLAYABLE", message: d.matchStatus };
    if (ms.includes("warning") || ms.includes("weather"))
      return { status: "WEATHER WARNING", message: d.matchStatus };
    if (ms.includes("maintenance"))
      return { status: "GROUND MAINTENANCE", message: d.matchStatus };
  }
  if (d.rain) return { status: "NOT PLAYABLE", message: "Rain detected. Match cannot proceed." };
  if (d.soilMoisture > 75)
    return { status: "NOT PLAYABLE", message: "Soil moisture exceeds safe playing limits." };
  if (d.temperature > 40)
    return { status: "WEATHER WARNING", message: "Extreme weather conditions detected." };
  return { status: "PLAYABLE", message: "Ground conditions are suitable for play." };
}

export function deriveWeather(
  d: Pick<SensorData, "rain" | "light" | "humidity">,
): WeatherCondition {
  if (d.rain) return "Rainy";
  if (d.light < 250) return "Overcast";
  if (d.light < 600 || d.humidity > 75) return "Cloudy";
  return "Sunny";
}
