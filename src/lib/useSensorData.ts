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

export function useSensorData(path = "/sensors") {
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
      unsub = subscribeSensorData(path, (val, err) => {
        if (err) {
          setError(err.message);
          setConnected(false);
          return;
        }
        if (val) {
          setConnected(true);
          setError(null);
          dataRef.current = val;
          setData(val);
        }
      });
      // Fallback to mock if no data within 4s
      const fallback = setTimeout(() => {
        if (!dataRef.current) startMock();
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
