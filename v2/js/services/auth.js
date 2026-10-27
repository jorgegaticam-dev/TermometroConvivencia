// ======================================
// SERVICIO · TOKEN ADMINISTRATIVO
// ======================================

import { getAdminToken, setAdminToken, clearAdminToken } from "../core/storage.js";
import { promptDialog, showToast } from "../utils/dom.js";

export class AuthCancelledError extends Error {
  constructor() {
    super("Operación cancelada: se necesita el token de administración.");
    this.name = "AuthCancelledError";
    this.code = "AUTH_CANCELADA";
  }
}

export function hasAdminToken() {
  return Boolean(getAdminToken());
}

export async function askAdminToken({ force = false, title = "Token de administración" } = {}) {
  if (!force && hasAdminToken()) return getAdminToken();

  const token = await promptDialog({
    title,
    message:
      "Ingresa el token configurado en Apps Script (Script Properties). " +
      "Se guarda solo durante esta pestaña.",
    label: "Token",
    type: "password",
    placeholder: "Token administrativo",
    confirmLabel: "Guardar",
    required: true
  });

  if (!token) throw new AuthCancelledError();

  setAdminToken(token);
  showToast("Token guardado para esta sesión.", "success");
  return token;
}

export async function ensureAdminToken(options = {}) {
  return askAdminToken(options);
}

/**
 * Ejecuta una acción administrativa. Si el servidor rechaza el token guardado,
 * lo descarta, pide uno nuevo y reintenta una sola vez.
 */
export async function runWithAdminToken(operation) {
  let token = await ensureAdminToken();

  try {
    return await operation(token);
  } catch (error) {
    if (error?.code !== "NO_AUTORIZADO") throw error;

    clearAdminToken();
    showToast("El token guardado no es válido. Ingrésalo nuevamente.", "error");
    token = await ensureAdminToken({
      force: true,
      title: "Token no válido"
    });

    return operation(token);
  }
}

export function forgetAdminToken() {
  clearAdminToken();
  showToast("Token eliminado de esta sesión.", "info");
}
