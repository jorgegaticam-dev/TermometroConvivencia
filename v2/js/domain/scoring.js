// ======================================
// DOMINIO · CÁLCULOS Y AGREGACIONES
// ======================================

import { CONFIG } from "../config.js";
import { DIMENSION_KEYS } from "./dimensions.js";
import { LEVELS, levelFromCourse } from "./courses.js";
import { dateSortValue } from "../utils/dates.js";

export function round2(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

export function average(values) {
  const numbers = values.map(Number).filter(Number.isFinite);
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

export function isValidScore(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 5;
}

export function isValidScale(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 5;
}

export function categoryKeyFromAverage(promedio) {
  const value = Number(promedio);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 4.1) return "FORTALECIDA";
  if (value >= 3.1) return "DESARROLLO";
  if (value >= 2.1) return "ALERTA";
  return "CRITICA";
}

export function categoryInfo(key) {
  if (!key) return null;
  return CONFIG.CATEGORIAS[key] || null;
}

/**
 * Calcula promedios a partir de un arreglo de respuestas individuales.
 * Cada respuesta debe tener las 7 claves de dimensión con enteros 1–5.
 */
export function aggregateResponses(responses) {
  const list = Array.isArray(responses) ? responses : [];
  const dimensiones = {};

  DIMENSION_KEYS.forEach(key => {
    const values = list
      .map(response => Number(response?.[key]))
      .filter(isValidScore);

    dimensiones[key] = values.length > 0
      ? round2(average(values))
      : 0;
  });

  const validDimensions = DIMENSION_KEYS
    .map(key => dimensiones[key])
    .filter(value => value > 0);

  const promedio = validDimensions.length > 0
    ? round2(average(validDimensions))
    : 0;

  return {
    dimensiones,
    promedio,
    categoria: categoryKeyFromAverage(promedio),
    participantes: list.length
  };
}

function pick(raw, camel, pascal, fallback = "") {
  if (raw?.[camel] !== undefined) return raw[camel];
  if (raw?.[pascal] !== undefined) return raw[pascal];
  return fallback;
}

/**
 * Normaliza una medición del API o de la caché.
 * Acepta tanto la forma anidada nueva como la forma plana antigua.
 */
export function normalizeMeasurement(raw = {}) {
  const curso = String(pick(raw, "curso", "Curso", "")).trim();
  const dimensionSource =
    raw.dimensiones ||
    raw.Dimensiones ||
    {
      bienestar: pick(raw, "bienestar", "Bienestar", 0),
      inclusion: pick(raw, "inclusion", "Inclusion", 0),
      buenTrato: pick(raw, "buenTrato", "BuenTrato", 0),
      participacion: pick(raw, "participacion", "Participacion", 0),
      seguridad: pick(raw, "seguridad", "Seguridad", 0),
      pertenencia: pick(raw, "pertenencia", "Pertenencia", 0),
      relaciones: pick(raw, "relaciones", "Relaciones", 0)
    };

  const dimensiones = {};
  DIMENSION_KEYS.forEach(key => {
    const value = Number(
      dimensionSource?.[key] ??
      dimensionSource?.[key.charAt(0).toUpperCase() + key.slice(1)] ??
      0
    );
    dimensiones[key] = isValidScale(value) ? round2(value) : 0;
  });

  let promedio = Number(pick(raw, "promedio", "Promedio", 0));

  if (!isValidScale(promedio)) {
    const validDimensions = DIMENSION_KEYS
      .map(key => dimensiones[key])
      .filter(value => value > 0);

    promedio = validDimensions.length > 0
      ? round2(average(validDimensions))
      : 0;
  }

  const categoriaRaw = String(pick(raw, "categoria", "Categoria", ""));
  const categoria = CONFIG.CATEGORIAS[categoriaRaw]
    ? categoriaRaw
    : categoryKeyFromAverage(promedio);

  return {
    id: String(pick(raw, "id", "ID", "")),
    fecha: String(pick(raw, "fecha", "Fecha", "")),
    curso,
    nivel: String(pick(raw, "nivel", "Nivel", "")) || levelFromCourse(curso),
    responsable: String(pick(raw, "responsable", "Responsable", "")),
    participantes: Number(pick(raw, "participantes", "Participantes", 0)) || 0,
    promedio: round2(promedio),
    categoria,
    dimensiones,
    encuestaID: String(pick(raw, "encuestaID", "EncuestaID", "")),
    origen: String(pick(raw, "origen", "Origen", "")),
    creadoEn: String(pick(raw, "creadoEn", "CreadoEn", ""))
  };
}

export function averageDimensions(measurements) {
  const list = Array.isArray(measurements) ? measurements : [];
  const result = {};

  DIMENSION_KEYS.forEach(key => {
    const values = list
      .map(measurement => Number(measurement?.dimensiones?.[key]))
      .filter(isValidScale);

    result[key] = values.length > 0
      ? round2(average(values))
      : 0;
  });

  return result;
}

export function sortMeasurements(measurements) {
  return [...(measurements || [])].sort((a, b) => {
    const dateDiff = dateSortValue(b.fecha) - dateSortValue(a.fecha);
    if (dateDiff !== 0) return dateDiff;
    return String(b.creadoEn || "").localeCompare(String(a.creadoEn || ""));
  });
}

/**
 * Devuelve la medición más reciente de cada curso.
 * Evita que un curso con muchas mediciones pese más en el promedio institucional.
 */
export function latestByCourse(measurements) {
  const byCourse = new Map();

  (measurements || []).forEach(measurement => {
    const curso = String(measurement?.curso || "").trim();
    if (!curso) return;

    const current = byCourse.get(curso);

    if (!current) {
      byCourse.set(curso, measurement);
      return;
    }

    const dateDiff = dateSortValue(measurement.fecha) - dateSortValue(current.fecha);

    if (dateDiff > 0) {
      byCourse.set(curso, measurement);
      return;
    }

    if (dateDiff === 0) {
      const createdDiff = String(measurement.creadoEn || "")
        .localeCompare(String(current.creadoEn || ""));

      if (createdDiff > 0) byCourse.set(curso, measurement);
    }
  });

  return [...byCourse.values()];
}

export function buildSnapshot(measurements) {
  const list = (measurements || []).map(normalizeMeasurement);
  const latest = latestByCourse(list);
  const averages = latest
    .map(measurement => Number(measurement.promedio))
    .filter(isValidScale);

  const promedio = averages.length > 0
    ? round2(average(averages))
    : 0;

  const alertas = latest.filter(measurement => {
    const category = categoryKeyFromAverage(Number(measurement.promedio));
    return category === "ALERTA" || category === "CRITICA";
  }).length;

  const ultimaFecha = latest
    .map(measurement => measurement.fecha)
    .filter(Boolean)
    .sort((a, b) => dateSortValue(b) - dateSortValue(a))[0] || "";

  return {
    promedio,
    categoria: categoryKeyFromAverage(promedio),
    cursos: latest.length,
    alertas,
    totalMediciones: list.length,
    dimensiones: averageDimensions(latest),
    ultimaFecha,
    latest
  };
}

export function rankingByCourse(measurements, limit = 5) {
  const latest = latestByCourse(measurements);
  const sorted = [...latest].sort((a, b) => Number(b.promedio) - Number(a.promedio));

  return {
    latest: sorted,
    top: sorted.slice(0, limit),
    bottom: sorted
      .filter(measurement => Number(measurement.promedio) < 3.1)
      .sort((a, b) => Number(a.promedio) - Number(b.promedio))
      .slice(0, limit)
  };
}

export function groupByLevel(measurements) {
  const latest = latestByCourse(measurements);
  const groups = new Map();

  latest.forEach(measurement => {
    const nivel = measurement.nivel || levelFromCourse(measurement.curso);
    if (!groups.has(nivel)) groups.set(nivel, []);
    groups.get(nivel).push(measurement);
  });

  const order = new Map(LEVELS.map((level, index) => [level, index]));

  return [...groups.entries()]
    .map(([nivel, items]) => {
      const valid = items
        .map(item => Number(item.promedio))
        .filter(isValidScale);

      return {
        nivel,
        cursos: items.length,
        promedio: valid.length > 0 ? round2(average(valid)) : 0,
        categoria: categoryKeyFromAverage(valid.length > 0 ? average(valid) : 0),
        dimensiones: averageDimensions(items)
      };
    })
    .sort((a, b) => {
      return (order.get(a.nivel) ?? 99) - (order.get(b.nivel) ?? 99);
    });
}
