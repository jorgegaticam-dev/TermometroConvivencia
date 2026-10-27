// ======================================
// CONFIGURACIÓN GENERAL · TCE v2
// ======================================

export const CONFIG = Object.freeze({
  APP_NAME: "Termómetro de la Convivencia Educativa",
  APP_VERSION: "2.0.0",
  INSTITUTION: "Liceo Bicentenario Los Ángeles",

  // Reemplazar por la URL /exec de la implementación de Apps Script.
  API_URL: "https://script.google.com/macros/s/AKfycbzOzxWjx3YCmRC0hrZDhzJgWbyhbB376FuMMiU7UuPGx0zWuaYRA7S7huo5Hry1vdiA/exec",

  STORAGE: {
    DEVICE_ID: "TCE_DEVICE_ID",
    ADMIN_TOKEN: "TCE_ADMIN_TOKEN",
    MEASUREMENTS_CACHE: "TCE_MEASUREMENTS_CACHE",
    LAST_SURVEY_CODE: "TCE_LAST_SURVEY_CODE",
    LAST_RESPONSIBLE: "TCE_LAST_RESPONSIBLE",
    RESPONDED_PREFIX: "TCE_RESPONDED_"
  },

  CATEGORIAS: {
    FORTALECIDA: {
      code: "FORTALECIDA",
      label: "Convivencia Fortalecida",
      short: "Fortalecida",
      emoji: "🟢",
      color: "#22c55e",
      min: 4.1
    },
    DESARROLLO: {
      code: "DESARROLLO",
      label: "Convivencia en Desarrollo",
      short: "Desarrollo",
      emoji: "🟡",
      color: "#eab308",
      min: 3.1
    },
    ALERTA: {
      code: "ALERTA",
      label: "Convivencia en Alerta",
      short: "Alerta",
      emoji: "🟠",
      color: "#f97316",
      min: 2.1
    },
    CRITICA: {
      code: "CRITICA",
      label: "Convivencia Crítica",
      short: "Crítica",
      emoji: "🔴",
      color: "#ef4444",
      min: 0
    }
  }
});

export function getApiUrl() {
  // Permite apuntar a una implementación alternativa sin editar el archivo.
  // Útil para pruebas locales; en producción se usa la URL de config.js.
  const override =
    typeof window !== "undefined" && typeof window.TCE_API_URL === "string"
      ? window.TCE_API_URL.trim()
      : "";

  return override || CONFIG.API_URL;
}

export function isApiConfigured() {
  const url = getApiUrl();

  return Boolean(
    url &&
    !url.includes("PEGA_AQUI") &&
    url.startsWith("https://")
  );
}
