// ======================================
// ESTRUCTURA VISUAL · ADMIN Y ESTUDIANTE
// ======================================

import { CONFIG } from "../config.js";
import { h, clear } from "../utils/dom.js";
import { formatTodayLong } from "../utils/dates.js";
import { icon, button } from "./components.js";

const NAV_ITEMS = Object.freeze([
  { id: "dashboard", label: "Dashboard", hint: "Resumen institucional", iconName: "dashboard" },
  { id: "encuestas", label: "Encuestas", hint: "Crear y seguir", iconName: "survey" },
  { id: "mediciones", label: "Medición directa", hint: "Ingreso masivo", iconName: "table" },
  { id: "historial", label: "Historial", hint: "Mediciones previas", iconName: "history" }
]);

const VIEW_TITLES = Object.freeze({
  dashboard: "Resumen institucional",
  encuestas: "Encuestas y seguimiento",
  mediciones: "Medición directa por curso",
  historial: "Historial de mediciones"
});

function logoBlock(compact = false, logoSrc = "img/imageslogo.jpg") {
  return h("div", { class: `brand ${compact ? "brand--compact" : ""}`.trim() },
    h("img", {
      src: logoSrc,
      alt: "Liceo Bicentenario Los Ángeles",
      class: "brand__logo"
    }),
    h("div", { class: "brand__text" },
      h("strong", {}, "TCE"),
      h("span", {}, compact ? CONFIG.INSTITUTION : "Termómetro de la Convivencia")
    )
  );
}

export function renderAdminLayout(root, { view = "dashboard", onNavigate, onTokenClick, logoSrc = "img/imageslogo.jpg" } = {}) {
  clear(root);

  const navButtons = new Map();

  const nav = h("nav", { class: "sidebar__nav", "aria-label": "Navegación principal" },
    NAV_ITEMS.map(item => {
      const buttonElement = h("button", {
        type: "button",
        class: "nav-item",
        onClick: () => onNavigate?.(item.id)
      },
        icon(item.iconName, { size: 20 }),
        h("span", { class: "nav-item__text" },
          h("strong", {}, item.label),
          h("small", {}, item.hint)
        ),
        icon("chevronRight", { size: 16, className: "nav-item__chevron" })
      );

      navButtons.set(item.id, buttonElement);
      return buttonElement;
    })
  );

  const tokenButton = h("button", {
    type: "button",
    class: "status-chip status-chip--button",
    title: "Configurar token de administración",
    onClick: () => onTokenClick?.()
  },
    icon("lock", { size: 16 }),
    h("span", { class: "status-chip__text" }, "Configurar token")
  );

  const apiChip = h("span", { class: "status-chip status-chip--muted", title: "Estado del API" },
    h("span", { class: "status-chip__dot" }),
    h("span", { class: "status-chip__text" }, "Verificando API")
  );

  const menuButton = h("button", {
    type: "button",
    class: "icon-button menu-button",
    "aria-label": "Abrir menú",
    onClick: () => document.body.classList.toggle("nav-open")
  }, icon("dashboard", { size: 20 }));

  const overlay = h("button", {
    type: "button",
    class: "sidebar-overlay",
    "aria-label": "Cerrar menú",
    onClick: () => document.body.classList.remove("nav-open")
  });

  const topbarTitle = h("h2", { class: "topbar__title" }, VIEW_TITLES[view] || "");

  const sidebar = h("aside", { class: "sidebar" },
    logoBlock(false, logoSrc),
    nav,
    h("div", { class: "sidebar__footer" },
      h("p", { class: "sidebar__privacy" },
        icon("shield", { size: 16 }),
        h("span", {}, "Datos agregados. Sin información individual de estudiantes.")
      ),
      h("span", { class: "sidebar__version" }, `Versión ${CONFIG.APP_VERSION}`)
    )
  );

  const topbar = h("header", { class: "topbar" },
    h("div", { class: "topbar__left" },
      menuButton,
      topbarTitle
    ),
    h("div", { class: "topbar__right" },
      apiChip,
      tokenButton,
      h("span", { class: "topbar__date" }, formatTodayLong())
    )
  );

  const main = h("main", { class: "main", id: "main-content" });
  const content = h("div", { class: "app-content" }, topbar, main);

  root.appendChild(h("div", { class: "app-shell" }, sidebar, content, overlay));

  function setView(nextView) {
    topbarTitle.textContent = VIEW_TITLES[nextView] || "";

    navButtons.forEach((buttonElement, id) => {
      const active = id === nextView;
      buttonElement.classList.toggle("is-active", active);

      if (active) {
        buttonElement.setAttribute("aria-current", "page");
      } else {
        buttonElement.removeAttribute("aria-current");
      }
    });

    document.body.classList.remove("nav-open");
  }

  function setTokenState(active) {
    tokenButton.classList.toggle("status-chip--success", active);
    tokenButton.querySelector(".status-chip__text").textContent = active
      ? "Token activo"
      : "Configurar token";
  }

  function setApiState(state, detail = "") {
    const states = {
      online: { text: "API conectada", className: "status-chip--success" },
      offline: { text: "API sin conexión", className: "status-chip--error" },
      cache: { text: "Datos guardados", className: "status-chip--warning" },
      unconfigured: { text: "API sin configurar", className: "status-chip--error" }
    };

    const info = states[state] || states.offline;

    apiChip.className = `status-chip ${info.className}`;
    apiChip.querySelector(".status-chip__text").textContent = info.text;
    apiChip.title = detail || info.text;
  }

  setView(view);
  return { main, setView, setTokenState, setApiState, tokenButton };
}

export function renderStudentShell(root, { onBack = null, logoSrc = "img/imageslogo.jpg" } = {}) {
  clear(root);

  const main = h("main", { class: "student-main" });

  const header = h("header", { class: "student-header" },
    h("div", { class: "student-header__inner" },
      logoBlock(true, logoSrc),
      h("div", { class: "student-header__meta" },
        h("span", { class: "student-header__label" }, "Encuesta de convivencia"),
        h("strong", {}, CONFIG.INSTITUTION)
      ),
      onBack
        ? button({
            label: "Volver al panel",
            variant: "ghost",
            iconName: "arrowLeft",
            onClick: onBack
          })
        : null
    )
  );

  const footer = h("footer", { class: "student-footer" },
    h("p", {}, "Las respuestas son anónimas. No se solicitan nombres, correos ni direcciones IP."),
    h("p", { class: "student-footer__version" },
      `${CONFIG.APP_NAME} · v${CONFIG.APP_VERSION}`
    )
  );

  root.appendChild(h("div", { class: "student-shell" }, header, main, footer));
  return { main };
}

export function navItems() {
  return NAV_ITEMS;
}
