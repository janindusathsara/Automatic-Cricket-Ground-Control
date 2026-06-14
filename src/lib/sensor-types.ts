export type SensorData = {
  temperature: number;
  humidity: number;
  light: number;
  rain: boolean;
  soilMoisture: number;
  weatherCondition?: string;
  groundStatus?: GroundStatus;
  matchPlayable?: boolean;
  matchStatus?: MatchStatus;
  floodLights: boolean;
  irrigation: boolean;
  drainagePump: boolean;
  rainAlertSystem?: boolean;
  lastUpdated: number | string;
};

export type GroundStatus = "READY" | "WET" | "IRRIGATION ACTIVE" | "RAIN ALERT";
export type MatchStatus =
  | "PLAYABLE"
  | "NOT PLAYABLE"
  | "WEATHER WARNING"
  | "GROUND MAINTENANCE";

export type WeatherCondition = "Sunny" | "Cloudy" | "Overcast" | "Rainy";

export function deriveGroundStatus(d: Pick<SensorData, "rain" | "soilMoisture" | "irrigation">): GroundStatus {
  if (d.rain) return "RAIN ALERT";
  if (d.soilMoisture > 70) return "WET";
  if (d.irrigation) return "IRRIGATION ACTIVE";
  return "READY";
}

export function deriveMatchStatus(d: Pick<SensorData, "rain" | "soilMoisture" | "temperature">): {
  status: MatchStatus;
  message: string;
} {
  if (d.rain) return { status: "NOT PLAYABLE", message: "Rain detected. Match cannot proceed." };
  if (d.soilMoisture > 70)
    return { status: "NOT PLAYABLE", message: "Soil moisture exceeds safe playing limits." };
  if (d.temperature > 40)
    return { status: "WEATHER WARNING", message: "Extreme weather conditions detected." };
  return { status: "PLAYABLE", message: "Ground conditions are suitable for play." };
}

export function deriveWeather(d: Pick<SensorData, "rain" | "light" | "humidity">): WeatherCondition {
  if (d.rain) return "Rainy";
  if (d.light < 250) return "Overcast";
  if (d.light < 600 || d.humidity > 75) return "Cloudy";
  return "Sunny";
}
