// Open-Meteo (no API key required). Defaults to Colombo, Sri Lanka.
export type WeatherApiData = {
  windSpeed: number; // km/h
  pressure: number; // hPa
  cloudCover: number; // %
  dewPoint: number; // °C
  uvIndex: number;
  rainProbability: number; // %
  fetchedAt: number;
};

const LAT = 6.9271;
const LON = 79.8612;

export async function fetchWeatherApi(): Promise<WeatherApiData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=wind_speed_10m,pressure_msl,cloud_cover,dew_point_2m,uv_index&hourly=precipitation_probability&forecast_hours=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API ${res.status}`);
  const json = await res.json();
  const c = json.current ?? {};
  const rainProb = json.hourly?.precipitation_probability?.[0] ?? 0;
  return {
    windSpeed: Number(c.wind_speed_10m ?? 0),
    pressure: Number(c.pressure_msl ?? 0),
    cloudCover: Number(c.cloud_cover ?? 0),
    dewPoint: Number(c.dew_point_2m ?? 0),
    uvIndex: Number(c.uv_index ?? 0),
    rainProbability: Number(rainProb ?? 0),
    fetchedAt: Date.now(),
  };
}
