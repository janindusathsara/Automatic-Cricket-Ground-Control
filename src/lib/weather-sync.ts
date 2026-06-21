// Client-side weather sync. Runs in the browser so it works on static
// Firebase Hosting deploys (no server runtime available there).
// NOTE: VITE_WEATHERAPI_KEY is exposed in the client bundle — that is
// unavoidable for a static deploy. Restrict the WeatherAPI key by
// referrer/quota in the WeatherAPI dashboard.

const RTDB_URL =
  "https://cricket-ground-control-default-rtdb.asia-southeast1.firebasedatabase.app";
const LOCATION = "Moratuwa";

type WeatherAPIResponse = {
  current: {
    wind_kph: number;
    cloud: number;
    precip_mm: number;
    pressure_mb: number;
    dewpoint_c: number;
    uv: number;
    last_updated: string;
  };
};

export async function syncWeather() {
  const apiKey = import.meta.env.VITE_WEATHERAPI_KEY as string | undefined;
  if (!apiKey) throw new Error("VITE_WEATHERAPI_KEY not configured");

  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
    LOCATION,
  )}&aqi=no`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WeatherAPI ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as WeatherAPIResponse;
  const c = json.current;

  const payload = {
    wind_kph: c.wind_kph,
    cloud: c.cloud,
    precip_mm: c.precip_mm,
    pressure_mb: c.pressure_mb,
    dewpoint_c: c.dewpoint_c,
    uv: c.uv,
    last_updated: c.last_updated,
    timestamp: new Date().toISOString(),
  };

  const putRes = await fetch(`${RTDB_URL}/cricket_ground/weather.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!putRes.ok) throw new Error(`RTDB write ${putRes.status}: ${await putRes.text()}`);

  return { ok: true, ...payload };
}
