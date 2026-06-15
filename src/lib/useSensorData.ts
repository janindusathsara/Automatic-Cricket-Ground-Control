import { useEffect, useRef, useState } from "react";
import { firebaseEnabled, subscribeSensorData } from "./firebase";
import {
  deriveGroundStatus,
  deriveMatchStatus,
  deriveWeather,
  type SensorData,
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
  if (typeof value === "string" && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    const [hours = 0, minutes = 0, seconds = 0] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    return date.getTime();
  }
  if (typeof value === "string" && !Number.isNaN(new Date(value).getTime())) return value;
  return Date.now();
}

function normalizeSensorData(raw: unknown): SensorData | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;

  return {
    temperature: toNumber(source.temperature, 0),
    humidity: toNumber(source.humidity, 0),
    light: toNumber(source.light, 0),
    rain: toBoolean(source.rain ?? source.rainDetected ?? source.rainStatus, false),
    soilMoisture: toNumber(source.soilMoisture ?? source.moisture, 0),
    weatherCondition: typeof source.weatherCondition === "string" ? source.weatherCondition : undefined,
    groundStatus: typeof source.groundStatus === "string" ? source.groundStatus as SensorData["groundStatus"] : undefined,
    matchPlayable: typeof source.matchPlayable !== "undefined" ? toBoolean(source.matchPlayable) : undefined,
    matchStatus: typeof source.matchStatus === "string" ? source.matchStatus as SensorData["matchStatus"] : undefined,
    floodLights: toBoolean(source.floodLights, false),
    irrigation: toBoolean(source.irrigation, false),
    drainagePump: toBoolean(source.drainagePump, false),
    rainAlertSystem: typeof source.rainAlertSystem !== "undefined" ? toBoolean(source.rainAlertSystem) : undefined,
    lastUpdated: normalizeLastUpdated(source.lastUpdated),
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
  const next: SensorData = {
    ...base,
    temperature: +jitter(base.temperature, 0.6, 22, 42).toFixed(1),
    humidity: +jitter(base.humidity, 1.4, 40, 95).toFixed(0),
    light: +jitter(base.light, 30, 80, 1100).toFixed(0),
    soilMoisture: +jitter(
      base.soilMoisture + (rain ? 1.2 : base.irrigation ? 1.5 : -0.3),
      1.2,
      20,
      88
    ).toFixed(0),
    rain,
    floodLights: base.light < 250,
    irrigation: base.soilMoisture < 35 && !rain,
    drainagePump: base.soilMoisture > 75 || rain,
    lastUpdated: Date.now(),
  };
  return next;
}

export function useSensorData(path = "/data") {
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
      console.info("[firebase] subscribing to path:", path);
      unsub = subscribeSensorData(path, (val, err) => {
        if (err) {
          console.error("[firebase] read error:", err);
          setError(err.message);
          setConnected(false);
          return;
        }
        const normalized = normalizeSensorData(val);
        console.info("[firebase] snapshot received:", val, "normalized:", normalized);
        if (normalized) {
          setConnected(true);
          setUsingMock(false);
          setError(null);
          dataRef.current = normalized;
          setData(normalized);
        } else {
          // Path exists but is empty / null
          setError(`No data found at "${path}" in Realtime Database.`);
        }
      });
      // Fallback to mock if no data within 4s
      const fallback = setTimeout(() => {
        if (!dataRef.current) {
          console.warn("[firebase] no data within 4s — starting simulated data");
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
  }, [path]);

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
