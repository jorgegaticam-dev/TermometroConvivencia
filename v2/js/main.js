// ======================================
// PUNTO DE ENTRADA
// ======================================

import { startApp } from "./ui/app.js";

const root = document.getElementById("app");

if (!root) {
  throw new Error("No se encontró el contenedor #app.");
}

startApp(root).catch(error => {
  console.error("Error al iniciar TCE:", error);

  root.replaceChildren();

  const container = document.createElement("div");
  container.className = "fatal-error";

  const title = document.createElement("h1");
  title.textContent = "No se pudo iniciar la aplicación";

  const message = document.createElement("p");
  message.textContent = error?.message || "Revisa la consola del navegador.";

  const reload = document.createElement("button");
  reload.type = "button";
  reload.className = "btn btn--primary";
  reload.textContent = "Recargar";
  reload.addEventListener("click", () => window.location.reload());

  container.append(title, message, reload);
  root.appendChild(container);
});
