// ======================================
// EJECUTOR DE PRUEBAS EN NAVEGADOR
// ======================================

import { cases } from "./cases.js";

const results = document.getElementById("results");
const summary = document.getElementById("summary");
let passed = 0;
let failed = 0;

function addResult(name, error) {
  const item = document.createElement("li");
  item.className = error ? "test test--fail" : "test test--pass";

  const status = document.createElement("span");
  status.className = "test__status";
  status.textContent = error ? "FAIL" : "PASS";

  const label = document.createElement("span");
  label.className = "test__name";
  label.textContent = name;

  item.append(status, label);

  if (error) {
    const message = document.createElement("pre");
    message.className = "test__error";
    message.textContent = error.message || String(error);
    item.appendChild(message);
    console.error(`FAIL · ${name}`, error);
  }

  results.appendChild(item);
}

for (const item of cases) {
  try {
    item.run();
    passed += 1;
    addResult(item.name);
  } catch (error) {
    failed += 1;
    addResult(item.name, error);
  }
}

summary.textContent = `${passed} correctas · ${failed} fallidas · ${cases.length} pruebas`;
summary.className = failed === 0 ? "summary summary--ok" : "summary summary--fail";
document.title = failed === 0
  ? `TCE · Pruebas OK (${passed})`
  : `TCE · ${failed} pruebas fallidas`;
