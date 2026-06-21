import { createContext, useContext, type ReactNode } from "react";
import {
  useSensorData,
  useWeatherData,
  usePredictionData,
  type EnrichedSensor,
  type HistoryPoint,
} from "./useSensorData";
import type { PredictionData, WeatherData } from "./sensor-types";

type Ctx = {
  data: EnrichedSensor | null;
  history: HistoryPoint[];
  connected: boolean;
  error: string | null;
  usingMock: boolean;
  weather: WeatherData | null;
  weatherError: string | null;
  weatherMock: boolean;
  prediction: PredictionData | null;
  predictionError: string | null;
  predictionLoading: boolean;
};

const SensorCtx = createContext<Ctx | null>(null);

export function SensorProvider({ children }: { children: ReactNode }) {
  const s = useSensorData();
  const w = useWeatherData();
  const p = usePredictionData();
  const value: Ctx = {
    ...s,
    weather: w.data,
    weatherError: w.error,
    weatherMock: w.usingMock,
    prediction: p.data,
    predictionError: p.error,
    predictionLoading: p.loading,
  };
  return <SensorCtx.Provider value={value}>{children}</SensorCtx.Provider>;
}

export function useSensors(): Ctx {
  const ctx = useContext(SensorCtx);
  if (!ctx) throw new Error("useSensors must be used within SensorProvider");
  return ctx;
}

export function useWeather() {
  const { weather, weatherError, weatherMock } = useSensors();
  return { data: weather, error: weatherError, usingMock: weatherMock };
}

export function usePrediction() {
  const { prediction, predictionError, predictionLoading } = useSensors();
  return { data: prediction, error: predictionError, loading: predictionLoading };
}
