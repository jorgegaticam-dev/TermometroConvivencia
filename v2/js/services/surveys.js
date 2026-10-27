// ======================================
// SERVICIO · ENCUESTAS
// ======================================

import { api } from "../core/api.js";
import { setState } from "../core/state.js";
import { runWithAdminToken } from "./auth.js";

function normalizeSurvey(raw = {}) {
  return {
    id: String(raw.id || "").toUpperCase(),
    fechaCreacion: String(raw.fechaCreacion || ""),
    curso: String(raw.curso || ""),
    nivel: String(raw.nivel || ""),
    responsable: String(raw.responsable || ""),
    participantesEsperados: Number(raw.participantesEsperados || 0),
    estado: String(raw.estado || "").toUpperCase(),
    fechaCierre: String(raw.fechaCierre || ""),
    fechaProcesamiento: String(raw.fechaProcesamiento || ""),
    medicionID: String(raw.medicionID || ""),
    respuestasRecibidas: Number(raw.respuestasRecibidas || 0)
  };
}

export async function createSurvey(input) {
  return runWithAdminToken(token => api.createSurvey(input, token));
}

export async function loadSurveys({ silentToken = false } = {}) {
  let response;

  try {
    response = await runWithAdminToken(token => api.listSurveys(token));
  } catch (error) {
    if (error?.code === "AUTH_CANCELADA") {
      if (silentToken) {
        setState({ surveys: [], surveysError: null, surveysLoadedAt: 0 });
        return { surveys: [], cancelled: true };
      }

      throw error;
    }

    setState({ surveysError: error });
    throw error;
  }

  const surveys = (response.encuestas || []).map(normalizeSurvey);

  setState({
    surveys,
    surveysLoadedAt: Date.now(),
    surveysError: null
  });

  return { surveys, cancelled: false };
}

export async function getSurvey(codigo) {
  const response = await api.getSurvey(codigo);
  return response.encuesta;
}

export async function saveResponse({ codigo, deviceId, respuestas }) {
  return api.saveResponse({ codigo, deviceId, respuestas });
}

export async function closeSurvey(codigo) {
  return runWithAdminToken(token => api.closeSurvey(codigo, token));
}

export async function processSurvey(codigo) {
  return runWithAdminToken(token => api.processSurvey(codigo, token));
}
