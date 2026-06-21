import { useEffect, useRef, useState } from "react";
import { firebaseEnabled, subscribeNode } from "./firebase";
import {
  deriveGroundStatus,
  deriveMatchStatus,
  deriveWeather,
  type PredictionData,
  type SensorData,
  type WeatherData,
} from "./sensor-types";

export type EnrichedSensor = SensorData & {
  derivedGround: ReturnType<typeof deriveGroundStatus>;
  derivedMatch: ReturnType<typeof deriveMatchStatus>;
  derivedWeather: ReturnType<typeof deriveWeather>;
};

export type HistoryPoint = {
  t: number;
  temperature: number;
  humidity: number;
  light: number;
  soilMoisture: number;
};

const MAX_HISTORY = 120;
const SENSORS_PATH = "/cricket_ground/sensors";
const WEATHER_PATH = "/cricket_ground/weather";
const PREDICTION_PATH = "/cricket_ground/prediction";

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function normalizeLastUpdated(value: unknown): number | string {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // "YYYY-MM-DD HH:MM:SS" — convert to ISO-compatible
    const iso = value.includes("T") ? value : value.replace(" ", "T");
    const t = new Date(iso).getTime();
    if (Number.isFinite(t)) return t;
    return value;
  }
  return Date.now();
}

function normalizeSensorData(raw: unknown): SensorData | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  return {
    temperature: toNumber(s.temperature, 0),
    humidity: toNumber(s.humidity, 0),
    light: toNumber(s.light, 0),
    rain: toBoolean(s.rain, false),
    // Firebase node uses "soilMoisure" (typo); also accept correct spelling
    soilMoisture: toNumber(s.soilMoisure ?? s.soilMoisture, 0),
    floodLights: toBoolean(s.floodLights, false),
    irrigation: toBoolean(s.irrigation, false),
    drainagePump: toBoolean(s.drainagePump, false),
    matchStatus: typeof s.matchStatus === "string" ? s.matchStatus : undefined,
    lastUpdated: normalizeLastUpdated(s.lastUpdated),
  };
}

function normalizeWeather(raw: unknown): WeatherData | null {
  if (!raw || typeof raw !== "object") return null;
  const w = raw as Record<string, unknown>;
  return {
    wind_kph: toNumber(w.wind_kph, 0),
    cloud: toNumber(w.cloud, 0),
    precip_mm: toNumber(w.precip_mm, 0),
    pressure_mb: toNumber(w.pressure_mb, 0),
    dewpoint_c: toNumber(w.dewpoint_c, 0),
    uv: toNumber(w.uv, 0),
    last_updated: typeof w.last_updated === "string" ? w.last_updated : undefined,
    timestamp: typeof w.timestamp === "string" ? w.timestamp : undefined,
  };
}

function normalizePrediction(raw: unknown): PredictionData | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.pitch_type !== "string") return null;
  return {
    pitch_type: p.pitch_type,
    bounce: typeof p.bounce === "string" ? p.bounce : "—",
    spin: typeof p.spin === "string" ? p.spin : "—",
    seam_movement: typeof p.seam_movement === "string" ? p.seam_movement : "—",
    confidence: toNumber(p.confidence, 0),
    generated_at: typeof p.generated_at === "string" ? p.generated_at : undefined,
  };
}

function simulate(prev: SensorData | null): SensorData {
  const base =
    prev ??
    ({
      temperature: 28,
      humidity: 65,
      light: 720,
      rain: false,
      soilMoisture: 42,
      floodLights: false,
      irrigation: false,
      drainagePump: false,
      lastUpdated: Date.now(),
    } as SensorData);
  const jitter = (v: number, amt: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v + (Math.random() - 0.5) * amt));
  const rain = Math.random() < 0.02 ? !base.rain : base.rain;
  return {
    ...base,
    temperature: +jitter(base.temperature, 0.6, 22, 42).toFixed(1),
    humidity: +jitter(base.humidity, 1.4, 40, 95).toFixed(0),
    light: +jitter(base.light, 30, 80, 1100).toFixed(0),
    soilMoisture: +jitter(
      base.soilMoisture + (rain ? 1.2 : base.irrigation ? 1.5 : -0.3),
      1.2,
      20,
      88,
    ).toFixed(0),
    rain,
    floodLights: base.light < 250,
    irrigation: base.soilMoisture < 35 && !rain,
    drainagePump: base.soilMoisture > 75 || rain,
    lastUpdated: Date.now(),
  };
}

function simulateWeather(prev: WeatherData | null): WeatherData {
  const base =
    prev ??
    ({
      wind_kph: 12,
      cloud: 40,
      precip_mm: 0,
      pressure_mb: 1012,
      dewpoint_c: 22,
      uv: 6,
    } as WeatherData);
  const j = (v: number, amt: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v + (Math.random() - 0.5) * amt));
  return {
    wind_kph: +j(base.wind_kph, 1, 0, 60).toFixed(1),
    cloud: +j(base.cloud, 3, 0, 100).toFixed(0),
    precip_mm: +j(base.precip_mm, 0.3, 0, 20).toFixed(1),
    pressure_mb: +j(base.pressure_mb, 0.4, 980, 1040).toFixed(0),
    dewpoint_c: +j(base.dewpoint_c, 0.3, 5, 28).toFixed(1),
    uv: +j(base.uv, 0.2, 0, 12).toFixed(1),
    last_updated: new Date().toISOString(),
  };
}

export function useSensorData() {
  const [data, setData] = useState<SensorData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [usingMock, setUsingMock] = useState(!firebaseEnabled);
  const dataRef = useRef<SensorData | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mockTimer: ReturnType<typeof setInterval> | undefined;

    const startMock = () => {
      setUsingMock(true);
      setConnected(true);
      const tick = () => {
        const next = simulate(dataRef.current);
        dataRef.current = next;
        setData(next);
      };
      tick();
      mockTimer = setInterval(tick, 1000);
    };

    if (firebaseEnabled) {
      console.info("[firebase] subscribing:", SENSORS_PATH);
      unsub = subscribeNode(SENSORS_PATH, (val, err) => {
        if (err) {
          console.error("[firebase] read error:", err);
          setError(err.message);
          setConnected(false);
          return;
        }
        const normalized = normalizeSensorData(val);
        if (normalized) {
          setConnected(true);
          setUsingMock(false);
          setError(null);
          dataRef.current = normalized;
          setData(normalized);
        } else {
          setError(`No data at "${SENSORS_PATH}".`);
        }
      });
      const fallback = setTimeout(() => {
        if (!dataRef.current) {
          console.warn("[firebase] no sensors within 4s — starting simulated data");
          startMock();
        }
      }, 4000);
      return () => {
        clearTimeout(fallback);
        unsub?.();
        if (mockTimer) clearInterval(mockTimer);
      };
    } else {
      startMock();
      return () => {
        if (mockTimer) clearInterval(mockTimer);
      };
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    setHistory((h) => {
      const next = [
        ...h,
        {
          t: Date.now(),
          temperature: data.temperature,
          humidity: data.humidity,
          light: data.light,
          soilMoisture: data.soilMoisture,
        },
      ];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
  }, [data]);

  const enriched: EnrichedSensor | null = data
    ? {
        ...data,
        derivedGround: deriveGroundStatus(data),
        derivedMatch: deriveMatchStatus(data),
        derivedWeather: deriveWeather(data),
      }
    : null;

  return { data: enriched, history, connected, error, usingMock };
}

export function useWeatherData() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(!firebaseEnabled);
  const ref = useRef<WeatherData | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    const startMock = () => {
      setUsingMock(true);
      const tick = () => {
        const next = simulateWeather(ref.current);
        ref.current = next;
        setData(next);
      };
      tick();
      timer = setInterval(tick, 5000);
    };

    if (firebaseEnabled) {
      unsub = subscribeNode(WEATHER_PATH, (val, err) => {
        if (err) {
          setError(err.message);
          return;
        }
        const w = normalizeWeather(val);
        if (w) {
          ref.current = w;
          setData(w);
          setUsingMock(false);
          setError(null);
        } else {
          setError(`No data at "${WEATHER_PATH}".`);
        }
      });
      const fb = setTimeout(() => {
        if (!ref.current) startMock();
      }, 4000);
      return () => {
        clearTimeout(fb);
        unsub?.();
        if (timer) clearInterval(timer);
      };
    } else {
      startMock();
      return () => {
        if (timer) clearInterval(timer);
      };
    }
  }, []);

  return { data, error, usingMock };
}

export function usePredictionData() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }
    const unsub = subscribeNode(PREDICTION_PATH, (val, err) => {
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      const p = normalizePrediction(val);
      if (p) {
        setData(p);
        setError(null);
      } else {
        setError(`No prediction at "${PREDICTION_PATH}".`);
      }
    });
    return () => unsub();
  }, []);

  return { data, error, loading };
}
