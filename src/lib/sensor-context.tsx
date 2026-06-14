import { createContext, useContext, type ReactNode } from "react";
import { useSensorData, type EnrichedSensor, type HistoryPoint } from "./useSensorData";

type Ctx = {
  data: EnrichedSensor | null;
  history: HistoryPoint[];
  connected: boolean;
  error: string | null;
  usingMock: boolean;
};

const SensorCtx = createContext<Ctx | null>(null);

export function SensorProvider({ children }: { children: ReactNode }) {
  const value = useSensorData();
  return <SensorCtx.Provider value={value}>{children}</SensorCtx.Provider>;
}

export function useSensors(): Ctx {
  const ctx = useContext(SensorCtx);
  if (!ctx) throw new Error("useSensors must be used within SensorProvider");
  return ctx;
}
