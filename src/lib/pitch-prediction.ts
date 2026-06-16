import type { EnrichedSensor } from "./useSensorData";
import type { WeatherApiData } from "./weather-api";

export type PitchClass = "Batting Friendly" | "Bowling Friendly" | "Balanced Pitch";

export type PitchPrediction = {
  pitchType: string;
  confidence: number; // 0-100
  bounce: string;
  spinAssistance: string;
  seamMovement: string;
  expectedScore: number;
  pitchClass: PitchClass;
  explanation: string;
};

export function predictPitch(
  sensor: EnrichedSensor,
  weather: WeatherApiData | null,
  override?: Partial<PitchPrediction> | null,
): PitchPrediction {
  const moisture = sensor.soilMoisture;
  const temp = sensor.temperature;
  const humidity = sensor.humidity;
  const cloud = weather?.cloudCover ?? (sensor.light < 400 ? 80 : 20);
  const wind = weather?.windSpeed ?? 8;
  const dew = weather?.dewPoint ?? humidity / 3;

  // Pitch type
  let pitchType = "Dry Hard";
  if (moisture > 60 || sensor.rain) pitchType = "Damp Green";
  else if (moisture > 40) pitchType = "Slightly Grassy";
  else if (temp > 32 && moisture < 30) pitchType = "Dry Cracked";

  // Bounce
  const bounceScore = 100 - moisture - (cloud * 0.2);
  const bounce =
    bounceScore > 60 ? "High & Consistent" : bounceScore > 35 ? "Moderate" : "Low & Slow";

  // Spin
  const spinScore = (100 - moisture) * 0.4 + (temp - 20) * 1.5;
  const spinAssistance =
    spinScore > 55 ? "High" : spinScore > 35 ? "Moderate" : "Low";

  // Seam
  const seamScore = humidity * 0.3 + cloud * 0.4 + moisture * 0.3;
  const seamMovement =
    seamScore > 55 ? "Significant" : seamScore > 35 ? "Moderate" : "Minimal";

  // Expected first innings score
  let expectedScore = 280;
  if (pitchType === "Dry Hard") expectedScore = 320;
  if (pitchType === "Dry Cracked") expectedScore = 240;
  if (pitchType === "Slightly Grassy") expectedScore = 270;
  if (pitchType === "Damp Green") expectedScore = 210;
  expectedScore -= Math.round(seamScore * 0.6);
  expectedScore += Math.round((40 - wind) * 0.5);
  expectedScore = Math.max(140, Math.min(420, expectedScore));

  // Class
  let pitchClass: PitchClass = "Balanced Pitch";
  if (bounceScore > 55 && seamScore < 45 && expectedScore > 280) pitchClass = "Batting Friendly";
  else if (seamScore > 50 || moisture > 55) pitchClass = "Bowling Friendly";

  // Confidence
  const confidence = Math.round(
    65 +
      (weather ? 15 : 0) +
      Math.min(15, Math.abs(bounceScore - 50) / 4) +
      Math.min(5, Math.abs(seamScore - 50) / 8),
  );

  const explanation = buildExplanation({
    pitchType,
    bounce,
    spinAssistance,
    seamMovement,
    pitchClass,
    temp,
    humidity,
    cloud,
    dew,
  });

  const base: PitchPrediction = {
    pitchType,
    confidence: Math.min(99, confidence),
    bounce,
    spinAssistance,
    seamMovement,
    expectedScore,
    pitchClass,
    explanation,
  };

  if (!override) return base;
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(override).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    ),
  } as PitchPrediction;
}

function buildExplanation(p: {
  pitchType: string;
  bounce: string;
  spinAssistance: string;
  seamMovement: string;
  pitchClass: PitchClass;
  temp: number;
  humidity: number;
  cloud: number;
  dew: number;
}): string {
  const time = new Date().getHours();
  const partOfDay = time < 12 ? "morning" : time < 17 ? "afternoon" : "evening";
  return `Current conditions indicate a ${p.pitchType.toLowerCase()} pitch with ${p.bounce.toLowerCase()} bounce and ${p.seamMovement.toLowerCase()} seam movement. Spin assistance is ${p.spinAssistance.toLowerCase()}. With ${Math.round(p.cloud)}% cloud cover at ${p.temp.toFixed(1)}°C, ${p.pitchClass.toLowerCase()} conditions are expected through the ${partOfDay}.`;
}
