// ======================================
// ALMACENAMIENTO LOCAL · SOLO CACHÉ
// ======================================

import { CONFIG } from "../config.js";

let memoryDeviceId = "";
let memoryAdminToken = "";

function readJson(storage, key, fallback = null) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, character => {
    const random = Math.random() * 16 | 0;
    const value = character === "x" ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
}

export function getDeviceId() {
  if (memoryDeviceId) return memoryDeviceId;

  try {
    const existing = localStorage.getItem(CONFIG.STORAGE.DEVICE_ID);
    if (existing) {
      memoryDeviceId = existing;
      return existing;
    }

    const created = randomId();
    localStorage.setItem(CONFIG.STORAGE.DEVICE_ID, created);
    memoryDeviceId = created;
    return created;
  } catch {
    memoryDeviceId = randomId();
    return memoryDeviceId;
  }
}

export function getAdminToken() {
  try {
    return sessionStorage.getItem(CONFIG.STORAGE.ADMIN_TOKEN) || memoryAdminToken;
  } catch {
    return memoryAdminToken;
  }
}

export function setAdminToken(token) {
  const clean = String(token || "").trim();
  memoryAdminToken = clean;

  try {
    sessionStorage.setItem(CONFIG.STORAGE.ADMIN_TOKEN, clean);
  } catch {
    // Se conserva en memoria durante la sesión.
  }
}

export function clearAdminToken() {
  memoryAdminToken = "";

  try {
    sessionStorage.removeItem(CONFIG.STORAGE.ADMIN_TOKEN);
  } catch {
    // Sin acción.
  }
}

export function cacheMeasurements(measurements) {
  if (!Array.isArray(measurements)) return;

  try {
    writeJson(localStorage, CONFIG.STORAGE.MEASUREMENTS_CACHE, {
      at: Date.now(),
      data: measurements
    });
  } catch {
    // Sin caché disponible: se sigue usando el estado en memoria.
  }
}

export function readMeasurementsCache() {
  let cached;

  try {
    cached = readJson(localStorage, CONFIG.STORAGE.MEASUREMENTS_CACHE, null);
  } catch {
    return null;
  }

  if (!cached || !Array.isArray(cached.data) || !Number.isFinite(cached.at)) {
    return null;
  }

  return cached;
}

export function hasResponded(codigo) {
  try {
    return localStorage.getItem(
      `${CONFIG.STORAGE.RESPONDED_PREFIX}${String(codigo || "").toUpperCase()}`
    ) === "1";
  } catch {
    return false;
  }
}

export function markResponded(codigo) {
  try {
    localStorage.setItem(
      `${CONFIG.STORAGE.RESPONDED_PREFIX}${String(codigo || "").toUpperCase()}`,
      "1"
    );
  } catch {
    // Sin acción.
  }
}

export function getLastSurveyCode() {
  try {
    return localStorage.getItem(CONFIG.STORAGE.LAST_SURVEY_CODE) || "";
  } catch {
    return "";
  }
}

export function setLastSurveyCode(codigo) {
  try {
    localStorage.setItem(CONFIG.STORAGE.LAST_SURVEY_CODE, String(codigo || ""));
  } catch {
    // Sin acción.
  }
}

export function getLastResponsible() {
  try {
    return localStorage.getItem(CONFIG.STORAGE.LAST_RESPONSIBLE) || "";
  } catch {
    return "";
  }
}

export function setLastResponsible(name) {
  try {
    localStorage.setItem(CONFIG.STORAGE.LAST_RESPONSIBLE, String(name || "").trim());
  } catch {
    // Sin acción.
  }
}

export function clearMeasurementsCache() {
  try {
    localStorage.removeItem(CONFIG.STORAGE.MEASUREMENTS_CACHE);
  } catch {
    // Sin acción.
  }
}
