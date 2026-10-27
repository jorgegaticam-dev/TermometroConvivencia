// ======================================
// CLIENTE DEL API · APPS SCRIPT
// ======================================

import { getApiUrl, isApiConfigured } from "../config.js";

const DEFAULT_TIMEOUT = 30000;

export class ApiError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

function assertConfigured() {
  if (!isApiConfigured()) {
    throw new ApiError(
      "API_NO_CONFIGURADA",
      "Falta configurar la URL de Apps Script en js/config.js."
    );
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store"
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(
        "TIMEOUT",
        "El servidor tardó demasiado en responder. Intenta nuevamente."
      );
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        "RED",
        "No se pudo conectar con el servidor. Revisa tu conexión y la URL del API."
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    throw new ApiError(
      "RESPUESTA_VACIA",
      "El servidor no devolvió contenido."
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(
      "RESPUESTA_NO_JSON",
      "El servidor no devolvió JSON. Revisa que la implementación sea pública y que la URL termine en /exec.",
      text.slice(0, 300)
    );
  }

  if (data.ok === false) {
    throw new ApiError(
      data.error?.code || "ERROR_API",
      data.error?.message || "El servidor rechazó la solicitud.",
      data.error || data
    );
  }

  if (data.ok !== true) {
    throw new ApiError(
      "RESPUESTA_INESPERADA",
      "La respuesta del servidor no tiene el formato esperado.",
      data
    );
  }

  return data;
}

async function get(params = {}) {
  assertConfigured();

  const url = new URL(getApiUrl());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetchWithTimeout(url.toString(), { method: "GET" });
  return parseResponse(response);
}

async function post(payload = {}) {
  assertConfigured();

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError("PAYLOAD_INVALIDO", "Los datos enviados no son válidos.");
  }

  const response = await fetchWithTimeout(getApiUrl(), {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
}

export const api = {
  ping() {
    return get({ accion: "ping" });
  },

  getSurvey(codigo) {
    return get({
      accion: "obtenerEncuesta",
      codigo: String(codigo || "").trim().toUpperCase()
    });
  },

  listMeasurements() {
    return get({ accion: "listarMediciones" });
  },

  createSurvey({ curso, responsable, participantes }, token) {
    return post({
      accion: "crearEncuesta",
      token,
      curso,
      responsable,
      participantes
    });
  },

  saveResponse({ codigo, deviceId, respuestas }) {
    return post({
      accion: "guardarRespuesta",
      codigo,
      deviceId,
      respuestas
    });
  },

  closeSurvey(codigo, token) {
    return post({
      accion: "cerrarEncuesta",
      token,
      codigo
    });
  },

  processSurvey(codigo, token) {
    return post({
      accion: "procesarEncuesta",
      token,
      codigo
    });
  },

  listSurveys(token) {
    return post({
      accion: "listarEncuestas",
      token
    });
  },

  saveManualMeasurement({ curso, responsable, fecha, respuestas }, token) {
    return post({
      accion: "guardarMedicionManual",
      token,
      curso,
      responsable,
      fecha,
      respuestas
    });
  }
};

export function isApiError(error) {
  return error instanceof ApiError;
}

export function errorMessage(error) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}
