// Firebase Realtime Database integration.
// Provide credentials via these Vite env vars OR edit the object below.
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, type Database } from "firebase/database";
import type { SensorData } from "./sensor-types";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

export const firebaseEnabled = Boolean(config.apiKey && config.databaseURL);

export function getFirebaseDB(): Database | null {
  if (!firebaseEnabled) return null;
  if (!app) {
    app = initializeApp(config as Record<string, string>);
    db = getDatabase(app);
  }
  return db;
}

export function subscribeSensorData(
  path: string,
  cb: (data: SensorData | null, err?: Error) => void
): () => void {
  const database = getFirebaseDB();
  if (!database) return () => {};
  const r = ref(database, path);
  const unsub = onValue(
    r,
    (snap) => cb((snap.val() as SensorData) ?? null),
    (err) => cb(null, err as Error)
  );
  return () => unsub();
}
