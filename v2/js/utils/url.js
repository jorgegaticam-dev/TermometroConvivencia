// ======================================
// URLS PÚBLICAS
// ======================================

export function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export function buildSurveyUrl(code) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("encuesta", code);
  return url.toString();
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function currentViewFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, "").trim();
  return hash.split("/")[0] || "dashboard";
}
