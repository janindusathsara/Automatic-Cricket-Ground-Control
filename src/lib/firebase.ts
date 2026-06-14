// Firebase Realtime Database integration — Cricket Ground Control System
// University of Moratuwa Engineering Project
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, type Database } from "firebase/database";
import type { SensorData } from "./sensor-types";

const config = {
  apiKey: "AIzaSyCsjIUUEqZdgET_oQGhFWD1E683T8WfjIA",
  authDomain: "cricket-ground-control.firebaseapp.com",
  databaseURL: "https://cricket-ground-control-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cricket-ground-control",
  storageBucket: "cricket-ground-control.firebasestorage.app",
  messagingSenderId: "527268729026",
  appId: "1:527268729026:web:76d30a275f79ee46806b5b",
  measurementId: "G-9GVRV57FEV",
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

export const firebaseEnabled = Boolean(config.apiKey && config.databaseURL);

export function getFirebaseDB(): Database | null {
  if (!firebaseEnabled) return null;
  if (!app) {
    app = initializeApp(config);
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
