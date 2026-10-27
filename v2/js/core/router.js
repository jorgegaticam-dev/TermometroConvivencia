// ======================================
// RUTAS · ADMIN + MODO ESTUDIANTE
// ======================================

const ADMIN_VIEWS = new Set([
  "dashboard",
  "encuestas",
  "historial",
  "seguimiento",
  "mediciones"
]);

export function getSurveyCode() {
  const code = new URLSearchParams(window.location.search).get("encuesta");
  return code ? String(code).trim().toUpperCase() : "";
}

export function getRoute() {
  const code = getSurveyCode();

  if (code) {
    return { mode: "student", code, view: "" };
  }

  const hash = window.location.hash.replace(/^#\/?/, "").trim();
  const view = hash.split("/")[0] || "dashboard";

  return {
    mode: "admin",
    code: "",
    view: ADMIN_VIEWS.has(view) ? view : "dashboard"
  };
}

export function navigate(view) {
  const target = ADMIN_VIEWS.has(view) ? view : "dashboard";
  window.location.hash = `#/${target}`;
}

export function onRouteChange(handler) {
  const listener = () => handler(getRoute());
  window.addEventListener("hashchange", listener);

  return () => window.removeEventListener("hashchange", listener);
}

export function adminViews() {
  return [...ADMIN_VIEWS];
}
