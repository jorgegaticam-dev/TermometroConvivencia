// ======================================
// FECHAS · SIN CORRIMIENTO DE ZONA HORARIA
// ======================================

export const MONTHS = Object.freeze([
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
]);

export const WEEKDAYS = Object.freeze([
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
]);

function pad(value) {
  return String(value).padStart(2, "0");
}

/**
 * Fecha del día para la barra superior: "Lunes, 26 de octubre".
 * Se arma a mano para no depender del formato del navegador.
 */
export function formatTodayLong(date = new Date()) {
  const value = date instanceof Date ? date : parseDate(date);
  if (!value || Number.isNaN(value.getTime())) return "";

  const weekday = WEEKDAYS[value.getDay()];
  const month = MONTHS[value.getMonth()].toLowerCase();
  return `${weekday}, ${value.getDate()} de ${month}`;
}

export function toIsoDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function todayIsoDate() {
  return toIsoDate(new Date());
}

export function toIsoDateTime(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString();
}

/**
 * Acepta:
 * - Date
 * - YYYY-MM-DD
 * - DD-MM-YYYY
 * - DD/MM/YYYY
 * - ISO 8601 con hora
 */
export function parseDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidDate(value) {
  return parseDate(value) !== null;
}

export function formatDate(value, { long = false } = {}) {
  const date = parseDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: long ? "long" : "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatDateShort(value) {
  return formatDate(value, { long: false });
}

export function formatDateLong(value) {
  return formatDate(value, { long: true });
}

export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function monthKey(value) {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function yearOf(value) {
  const date = parseDate(value);
  return date ? String(date.getFullYear()) : "";
}

export function monthName(monthNumber) {
  const index = Number(monthNumber) - 1;
  return MONTHS[index] || "";
}

export function dateSortValue(value) {
  const date = parseDate(value);
  return date ? date.getTime() : 0;
}
