// ======================================
// FORMATO DE NÚMEROS, CATEGORÍAS Y CSV
// ======================================

import { CONFIG } from "../config.js";
import { categoryInfo as getCategoryInfo } from "../domain/scoring.js";

const number2 = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const number0 = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 0
});

const percent0 = new Intl.NumberFormat("es-CL", {
  style: "percent",
  maximumFractionDigits: 0
});

export function formatAverage(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? number2.format(number)
    : "—";
}

export function formatInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number0.format(number) : "0";
}

export function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? percent0.format(number / 100) : "0%";
}

export function categoryInfo(key) {
  return getCategoryInfo(key);
}

export function categoryLabel(key) {
  return categoryInfo(key)?.label || "Sin datos";
}

export function categoryShort(key) {
  return categoryInfo(key)?.short || "Sin datos";
}

export function categoryEmoji(key) {
  return categoryInfo(key)?.emoji || "⚪";
}

export function categoryColor(key) {
  return categoryInfo(key)?.color || "#94a3b8";
}

export function truncate(value, maxLength = 60) {
  const text = String(value ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function pluralize(count, singular, plural) {
  return Number(count) === 1 ? singular : plural;
}

export function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("");
}

export function csvEscape(value) {
  const text = String(value ?? "");
  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows, columns) {
  const header = columns.map(column => csvEscape(column.label)).join(";");
  const body = rows.map(row => {
    return columns
      .map(column => {
        const value = typeof column.value === "function"
          ? column.value(row)
          : row[column.key];
        return csvEscape(value);
      })
      .join(";");
  });

  return [header, ...body].join("\r\n");
}

export function formatCategoryWithEmoji(key) {
  return `${categoryEmoji(key)} ${categoryLabel(key)}`;
}

export function appTitle() {
  return CONFIG.APP_NAME;
}
