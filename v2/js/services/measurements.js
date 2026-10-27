// ======================================
// SERVICIO · MEDICIONES
// ======================================

import { api } from "../core/api.js";
import { cacheMeasurements, readMeasurementsCache } from "../core/storage.js";
import { setState } from "../core/state.js";
import { normalizeMeasurement } from "../domain/scoring.js";
import { runWithAdminToken } from "./auth.js";

export async function loadMeasurements({ force = false, allowCache = true } = {}) {
  try {
    const response = await api.listMeasurements();
    const measurements = (response.mediciones || []).map(normalizeMeasurement);

    cacheMeasurements(measurements);
    setState({
      measurements,
      measurementsLoadedAt: Date.now(),
      measurementsFromCache: false,
      measurementsError: null
    });

    return { measurements, fromCache: false, error: null };
  } catch (error) {
    const cached = allowCache ? readMeasurementsCache() : null;

    if (cached) {
      const measurements = cached.data.map(normalizeMeasurement);

      setState({
        measurements,
        measurementsLoadedAt: cached.at,
        measurementsFromCache: true,
        measurementsError: error
      });

      return { measurements, fromCache: true, error };
    }

    setState({
      measurements: [],
      measurementsFromCache: false,
      measurementsError: error
    });

    throw error;
  }
}

export async function saveManualMeasurement(input) {
  const response = await runWithAdminToken(token =>
    api.saveManualMeasurement(
      {
        curso: input.curso,
        responsable: input.responsable,
        fecha: input.fecha,
        respuestas: input.respuestas
      },
      token
    )
  );

  await loadMeasurements({ force: true, allowCache: false });

  return response;
}
