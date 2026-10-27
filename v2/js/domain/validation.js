// ======================================
// DOMINIO · VALIDACIONES
// ======================================

import { DIMENSIONS, DIMENSION_KEYS } from "./dimensions.js";
import { isValidCourse } from "./courses.js";

export function sanitizeText(value, maxLength = 120) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export function validateSurveyInput({ curso, responsable, participantes }) {
  const errors = {};
  const cleanCourse = sanitizeText(curso, 80);
  const cleanResponsable = sanitizeText(responsable, 80);
  const expected = Number(participantes);

  if (!cleanCourse || !isValidCourse(cleanCourse)) {
    errors.curso = "Selecciona un curso válido.";
  }

  if (cleanResponsable.length < 2) {
    errors.responsable = "Ingresa el nombre del responsable.";
  } else if (cleanResponsable.length > 80) {
    errors.responsable = "Máximo 80 caracteres.";
  }

  if (!Number.isInteger(expected) || expected < 1 || expected > 100) {
    errors.participantes = "Ingresa un número entero entre 1 y 100.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      curso: cleanCourse,
      responsable: cleanResponsable,
      participantes: expected
    }
  };
}

export function validateResponse(respuestas = {}) {
  const errors = {};

  DIMENSIONS.forEach(dimension => {
    const value = Number(respuestas[dimension.key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      errors[dimension.key] = "Selecciona una opción.";
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateCode(code) {
  return /^[A-Z0-9]{6,12}$/.test(String(code || "").trim().toUpperCase());
}

export function validateDeviceId(deviceId) {
  return typeof deviceId === "string" && deviceId.trim().length >= 8;
}

export function validateManualRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      valid: false,
      message: "Agrega al menos una fila de respuestas."
    };
  }

  if (rows.length > 100) {
    return {
      valid: false,
      message: "El máximo es 100 estudiantes por medición."
    };
  }

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const missing = DIMENSION_KEYS.filter(key => {
      const value = Number(row?.[key]);
      return !Number.isInteger(value) || value < 1 || value > 5;
    });

    if (missing.length > 0) {
      return {
        valid: false,
        message: `La fila ${index + 1} tiene respuestas incompletas o inválidas.`
      };
    }
  }

  return { valid: true };
}
