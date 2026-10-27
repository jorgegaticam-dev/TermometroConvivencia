// ======================================
// COMPONENTES DE INTERFAZ
// ======================================

import { CONFIG } from "../config.js";
import { DIMENSIONS } from "../domain/dimensions.js";
import { h } from "../utils/dom.js";
import { formatAverage, formatInteger, categoryLabel, categoryShort, categoryEmoji, categoryColor } from "../utils/format.js";
import { formatDateShort } from "../utils/dates.js";

const ICONS = Object.freeze({
  dashboard:
    '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
  survey:
    '<path d="M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  history:
    '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
  table:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 9v11M15 9v11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh:
    '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M3 21v-5h5M21 3v5h-5"/>',
  download:
    '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  copy:
    '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  alert:
    '<path d="M12 3 2.8 19a1.5 1.5 0 0 0 1.3 2.2h15.8a1.5 1.5 0 0 0 1.3-2.2L12 3Z"/><path d="M12 9v5M12 17.5v.5"/>',
  lock:
    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  external:
    '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  thermometer:
    '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  chart:
    '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  clock:
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search:
    '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  logo: '<path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5"/>'
});

export function icon(name, { size = 20, className = "" } = {}) {
  const wrapper = h("span", {
    class: `icon ${className}`.trim(),
    "aria-hidden": "true"
  });
  wrapper.innerHTML =
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" ` +
    `stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ` +
    `stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
  return wrapper;
}

export function pageHeader({ title, subtitle = "", actions = null, eyebrow = "" }) {
  return h("div", { class: "page-header" },
    h("div", { class: "page-header__text" },
      eyebrow ? h("span", { class: "page-header__eyebrow" }, eyebrow) : null,
      h("h1", { class: "page-header__title" }, title),
      subtitle ? h("p", { class: "page-header__subtitle" }, subtitle) : null
    ),
    actions ? h("div", { class: "page-header__actions" }, actions) : null
  );
}

export function card({ title = "", subtitle = "", actions = null, body = null, className = "", id = "" } = {}) {
  return h("section", { class: `card ${className}`.trim(), id },
    (title || actions || subtitle)
      ? h("div", { class: "card__header" },
          h("div", {},
            title ? h("h2", { class: "card__title" }, title) : null,
            subtitle ? h("p", { class: "card__subtitle" }, subtitle) : null
          ),
          actions ? h("div", { class: "card__actions" }, actions) : null
        )
      : null,
    h("div", { class: "card__body" }, body)
  );
}

export function button({
  label,
  variant = "primary",
  iconName = "",
  onClick = null,
  type = "button",
  disabled = false,
  title = "",
  className = ""
} = {}) {
  return h("button", {
    type,
    class: `btn btn--${variant} ${className}`.trim(),
    onClick,
    disabled,
    title
  },
    iconName ? icon(iconName, { size: 18 }) : null,
    h("span", {}, label)
  );
}

export function badge(text, tone = "neutral") {
  return h("span", { class: `badge badge--${tone}` }, text);
}

export function categoryBadge(key, { withEmoji = true } = {}) {
  if (!key) return badge("Sin datos", "neutral");

  return h("span", {
    class: "badge badge--category",
    style: { "--badge-color": categoryColor(key) }
  },
    withEmoji ? h("span", { "aria-hidden": "true" }, categoryEmoji(key)) : null,
    categoryLabel(key)
  );
}

export function statusBadge(status) {
  const value = String(status || "").toUpperCase();
  const map = {
    ACTIVA: { label: "Activa", tone: "success" },
    CERRADA: { label: "Cerrada", tone: "neutral" },
    PROCESADA: { label: "Procesada", tone: "info" }
  };
  const item = map[value] || { label: value || "Sin estado", tone: "neutral" };
  return badge(item.label, item.tone);
}

export function statCard({ label, value, hint = "", iconName = "", tone = "" }) {
  return h("article", { class: `stat-card ${tone ? `stat-card--${tone}` : ""}`.trim() },
    h("div", { class: "stat-card__top" },
      h("span", { class: "stat-card__label" }, label),
      iconName ? h("span", { class: "stat-card__icon" }, icon(iconName, { size: 18 })) : null
    ),
    h("strong", { class: "stat-card__value" }, value),
    hint ? h("span", { class: "stat-card__hint" }, hint) : null
  );
}

export function thermometer({ value = 0, category = null, meta = "" } = {}) {
  const score = Number(value);
  const valid = Number.isFinite(score) && score > 0;
  const clamped = valid ? Math.min(5, Math.max(1, score)) : 1;
  const level = valid ? ((clamped - 1) / 4) * 100 : 0;

  return h("div", {
    class: `thermometer ${valid ? "" : "is-empty"}`.trim(),
    style: { "--thermometer-level": `${level}%` },
    role: "img",
    "aria-label": valid
      ? `Promedio ${formatAverage(score)} de 5, ${categoryLabel(category)}`
      : "Sin datos suficientes"
  },
    h("div", { class: "thermometer__scale", "aria-hidden": "true" },
      ["5", "4", "3", "2", "1"].map(mark => h("span", {}, mark))
    ),
    h("div", { class: "thermometer__body" },
      h("div", { class: "thermometer__tube" },
        h("div", { class: "thermometer__fill" }),
        valid
          ? h("div", { class: "thermometer__marker" },
              h("span", { class: "thermometer__marker-label" }, formatAverage(score))
            )
          : null
      ),
      h("div", { class: "thermometer__readout" },
        h("strong", { class: "thermometer__value" }, valid ? formatAverage(score) : "—"),
        h("span", { class: "thermometer__caption" }, valid ? categoryLabel(category) : "Sin mediciones"),
        meta ? h("small", { class: "thermometer__meta" }, meta) : null
      )
    )
  );
}

export function categoryLegend() {
  const order = ["FORTALECIDA", "DESARROLLO", "ALERTA", "CRITICA"];

  return h("ul", { class: "category-legend" },
    order.map(key => {
      const item = CONFIG.CATEGORIAS[key];
      return h("li", { class: "category-legend__item", style: { "--legend-color": item.color } },
        h("span", { class: "category-legend__dot", "aria-hidden": "true" }),
        h("span", { class: "category-legend__label" }, item.label),
        h("span", { class: "category-legend__range" },
          key === "FORTALECIDA" ? "4,1 – 5,0"
            : key === "DESARROLLO" ? "3,1 – 4,09"
            : key === "ALERTA" ? "2,1 – 3,09"
            : "1,0 – 2,09"
        )
      );
    })
  );
}

function svgElement(tag, attrs = {}, text = "") {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      element.setAttribute(key, String(value));
    }
  });
  if (text) element.textContent = text;
  return element;
}

function polarPoint(cx, cy, radius, index, count, value = 5) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  const ratio = Math.min(5, Math.max(0, value)) / 5;
  return {
    x: cx + Math.cos(angle) * radius * ratio,
    y: cy + Math.sin(angle) * radius * ratio,
    angle
  };
}

export function radarChart(dimensiones = {}, { compare = null, size = 340 } = {}) {
  const count = DIMENSIONS.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.31;
  const labelRadius = radius + size * 0.085;

  const scores = DIMENSIONS.map(dimension => Number(dimensiones?.[dimension.key]) || 0);
  const hasData = scores.some(value => value > 0);

  const svg = svgElement("svg", {
    viewBox: `0 0 ${size} ${size}`,
    class: "radar",
    role: "img",
    "aria-label": hasData
      ? "Perfil de convivencia por dimensión"
      : "Perfil de convivencia sin datos"
  });

  for (let level = 1; level <= 5; level += 1) {
    const points = DIMENSIONS.map((_, index) => {
      const point = polarPoint(cx, cy, radius, index, count, level);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }).join(" ");

    svg.appendChild(svgElement("polygon", {
      points,
      class: level === 5 ? "radar__grid radar__grid--outer" : "radar__grid"
    }));
  }

  DIMENSIONS.forEach((_, index) => {
    const point = polarPoint(cx, cy, radius, index, count, 5);
    svg.appendChild(svgElement("line", {
      x1: cx,
      y1: cy,
      x2: point.x,
      y2: point.y,
      class: "radar__axis"
    }));
  });

  if (compare) {
    const comparePoints = DIMENSIONS.map((dimension, index) => {
      const point = polarPoint(cx, cy, radius, index, count, Number(compare?.[dimension.key]) || 0);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }).join(" ");

    svg.appendChild(svgElement("polygon", {
      points: comparePoints,
      class: "radar__area radar__area--compare"
    }));
  }

  if (hasData) {
    const points = DIMENSIONS.map((dimension, index) => {
      const point = polarPoint(cx, cy, radius, index, count, Number(dimensiones[dimension.key]) || 0);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }).join(" ");

    svg.appendChild(svgElement("polygon", { points, class: "radar__area" }));

    DIMENSIONS.forEach((dimension, index) => {
      const value = Number(dimensiones[dimension.key]) || 0;
      if (value <= 0) return;

      const point = polarPoint(cx, cy, radius, index, count, value);
      svg.appendChild(svgElement("circle", {
        cx: point.x,
        cy: point.y,
        r: 3.4,
        class: "radar__point"
      }));
    });
  }

  DIMENSIONS.forEach((dimension, index) => {
    const point = polarPoint(cx, cy, labelRadius, index, count, 5);
    const cosine = Math.cos(point.angle);
    const anchor = Math.abs(cosine) < 0.3 ? "middle" : cosine > 0 ? "start" : "end";
    const label = svgElement("text", {
      x: point.x,
      y: point.y + 4,
      "text-anchor": anchor,
      class: "radar__label"
    }, dimension.short);

    svg.appendChild(label);
  });

  if (!hasData) {
    svg.appendChild(svgElement("text", {
      x: cx,
      y: cy + 4,
      "text-anchor": "middle",
      class: "radar__empty"
    }, "Sin datos"));
  }

  return h("div", { class: "radar-wrap" }, svg);
}

export function dimensionBars(dimensiones = {}, { showValues = true, compact = false } = {}) {
  return h("ul", { class: `dimension-bars ${compact ? "dimension-bars--compact" : ""}`.trim() },
    DIMENSIONS.map(dimension => {
      const raw = Number(dimensiones?.[dimension.key]) || 0;
      const valid = raw > 0;
      const pct = valid ? Math.min(100, Math.max(0, (raw / 5) * 100)) : 0;
      const color = valid ? categoryColor(categoryFromScore(raw)) : "#cbd5e1";

      return h("li", { class: "dimension-bars__row" },
        h("div", { class: "dimension-bars__head" },
          h("span", { class: "dimension-bars__label" }, dimension.short),
          showValues
            ? h("span", { class: "dimension-bars__value" }, valid ? formatAverage(raw) : "—")
            : null
        ),
        h("div", {
          class: "dimension-bars__track",
          role: "meter",
          "aria-valuemin": "1",
          "aria-valuemax": "5",
          "aria-valuenow": valid ? raw.toFixed(2) : "0",
          "aria-label": dimension.label
        },
          h("span", {
            class: "dimension-bars__fill",
            style: { width: `${pct}%`, "--bar-color": color }
          })
        )
      );
    })
  );
}

function categoryFromScore(value) {
  if (value >= 4.1) return "FORTALECIDA";
  if (value >= 3.1) return "DESARROLLO";
  if (value >= 2.1) return "ALERTA";
  return "CRITICA";
}

export function progressBar({ value = 0, total = 0, label = "" } = {}) {
  const expected = Math.max(0, Number(total) || 0);
  const received = Math.max(0, Number(value) || 0);
  const pct = expected > 0 ? Math.min(100, (received / expected) * 100) : 0;

  return h("div", { class: "progress" },
    label
      ? h("div", { class: "progress__head" },
          h("span", {}, label),
          h("strong", {}, `${formatInteger(received)} / ${formatInteger(expected)}`)
        )
      : null,
    h("div", {
      class: "progress__track",
      role: "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": String(expected),
      "aria-valuenow": String(received)
    },
      h("span", { class: "progress__fill", style: { width: `${pct}%` } })
    )
  );
}

export function emptyState({ iconName = "chart", title, message = "", action = null }) {
  return h("div", { class: "empty-state" },
    h("span", { class: "empty-state__icon" }, icon(iconName, { size: 30 })),
    h("h3", { class: "empty-state__title" }, title),
    message ? h("p", { class: "empty-state__message" }, message) : null,
    action ? h("div", { class: "empty-state__action" }, action) : null
  );
}

export function loadingState(message = "Cargando información…") {
  return h("div", { class: "loading-state", role: "status" },
    h("span", { class: "spinner", "aria-hidden": "true" }),
    h("p", {}, message)
  );
}

export function errorBanner(message, { retry = null, title = "No se pudo completar la operación" } = {}) {
  return h("div", { class: "alert alert--error", role: "alert" },
    h("span", { class: "alert__icon" }, icon("alert", { size: 20 })),
    h("div", { class: "alert__content" },
      h("strong", {}, title),
      h("p", {}, message)
    ),
    retry
      ? button({ label: "Reintentar", variant: "ghost", iconName: "refresh", onClick: retry })
      : null
  );
}

export function notice(message, tone = "info", { iconName = "shield" } = {}) {
  return h("div", { class: `alert alert--${tone}` },
    h("span", { class: "alert__icon" }, icon(iconName, { size: 20 })),
    h("div", { class: "alert__content" }, h("p", {}, message))
  );
}

export function dataTable({ columns, rows, emptyMessage = "Sin registros para mostrar.", caption = "" }) {
  if (!rows || rows.length === 0) {
    return emptyState({ title: "Sin datos", message: emptyMessage, iconName: "table" });
  }

  return h("div", { class: "table-wrap" },
    h("table", { class: "data-table" },
      caption ? h("caption", { class: "sr-only" }, caption) : null,
      h("thead", {},
        h("tr", {},
          columns.map(column => h("th", {
            scope: "col",
            class: column.align ? `is-${column.align}` : ""
          }, column.label))
        )
      ),
      h("tbody", {},
        rows.map(row => h("tr", {},
          columns.map(column => {
            const value = column.render
              ? column.render(row)
              : row[column.key];

            return h("td", {
              class: column.align ? `is-${column.align}` : "",
              "data-label": column.label
            }, value ?? "—");
          })
        ))
      )
    )
  );
}

export function lineChart(points = [], { height = 230, color = "#234F3A" } = {}) {
  if (!points || points.length === 0) {
    return emptyState({
      iconName: "chart",
      title: "Sin evolución para mostrar",
      message: "Se necesitan mediciones de un mismo curso en distintas fechas."
    });
  }

  const width = 720;
  const padding = { top: 24, right: 24, bottom: 42, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const count = points.length;
  const xAt = index =>
    count === 1
      ? padding.left + plotWidth / 2
      : padding.left + (index / (count - 1)) * plotWidth;
  const yAt = value =>
    padding.top + (1 - (Math.min(5, Math.max(1, value)) - 1) / 4) * plotHeight;

  const svg = svgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "line-chart",
    role: "img",
    "aria-label": "Evolución del promedio de convivencia"
  });

  [1, 2, 3, 4, 5].forEach(level => {
    const y = yAt(level);
    svg.appendChild(svgElement("line", {
      x1: padding.left,
      y1: y,
      x2: width - padding.right,
      y2: y,
      class: "line-chart__grid"
    }));
    svg.appendChild(svgElement("text", {
      x: padding.left - 10,
      y: y + 4,
      "text-anchor": "end",
      class: "line-chart__axis-label"
    }, String(level)));
  });

  const coordinates = points.map((point, index) => ({
    x: xAt(index),
    y: yAt(Number(point.value) || 0),
    point
  }));

  if (count > 1) {
    const area = [
      `M ${coordinates[0].x} ${padding.top + plotHeight}`,
      ...coordinates.map(item => `L ${item.x} ${item.y}`),
      `L ${coordinates[count - 1].x} ${padding.top + plotHeight}`,
      "Z"
    ].join(" ");

    svg.appendChild(svgElement("path", {
      d: area,
      class: "line-chart__area",
      style: `--chart-color:${color}`
    }));

    const path = coordinates
      .map((item, index) => `${index === 0 ? "M" : "L"} ${item.x} ${item.y}`)
      .join(" ");

    svg.appendChild(svgElement("path", {
      d: path,
      class: "line-chart__line",
      style: `--chart-color:${color}`
    }));
  }

  coordinates.forEach((item, index) => {
    svg.appendChild(svgElement("circle", {
      cx: item.x,
      cy: item.y,
      r: count > 30 ? 2.4 : 4,
      class: "line-chart__dot",
      style: `--chart-color:${color}`
    }));

    const step = count > 10 ? Math.ceil(count / 7) : 1;
    const showLabel = index === 0 || index === count - 1 || index % step === 0;

    if (showLabel) {
      svg.appendChild(svgElement("text", {
        x: item.x,
        y: height - 16,
        "text-anchor": count === 1 ? "middle" : index === 0 ? "start" : index === count - 1 ? "end" : "middle",
        class: "line-chart__x-label"
      }, formatDateShort(item.point.label)));
    }
  });

  return h("div", { class: "line-chart-wrap" }, svg);
}

export function openDialog({ title, content, actions = [], className = "" }) {
  const dialog = h("dialog", { class: `dialog ${className}`.trim() },
    h("div", { class: "dialog__panel" },
      h("div", { class: "dialog__header" },
        h("h2", { class: "dialog__title" }, title),
        h("button", {
          type: "button",
          class: "icon-button",
          "aria-label": "Cerrar",
          onClick: () => dialog.close()
        }, icon("close", { size: 18 }))
      ),
      h("div", { class: "dialog__content" }, content),
      actions.length > 0
        ? h("div", { class: "dialog__actions" },
            actions.map(action =>
              button({
                label: action.label,
                variant: action.variant || "ghost",
                onClick: () => {
                  if (action.onClick) action.onClick(dialog);
                  if (action.close !== false) dialog.close();
                }
              })
            )
          )
        : null
    )
  );

  dialog.addEventListener("close", () => dialog.remove());
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    dialog.close();
  });

  document.body.appendChild(dialog);
  dialog.showModal();
  return dialog;
}

export function keyValueList(items) {
  return h("dl", { class: "key-values" },
    items.map(item =>
      h("div", { class: "key-values__item" },
        h("dt", {}, item.label),
        h("dd", {}, item.value ?? "—")
      )
    )
  );
}

export function rankingList(measurements, { tone = "top" } = {}) {
  if (!measurements || measurements.length === 0) {
    return h("p", { class: "muted" }, "Sin cursos para mostrar.");
  }

  return h("ol", { class: `ranking ranking--${tone}` },
    measurements.map((measurement, index) =>
      h("li", { class: "ranking__item" },
        h("span", { class: "ranking__position" }, String(index + 1)),
        h("div", { class: "ranking__text" },
          h("strong", {}, measurement.curso),
          h("small", {}, categoryShort(measurement.categoria))
        ),
        h("span", { class: "ranking__value" }, formatAverage(measurement.promedio))
      )
    )
  );
}

export function levelTiles(levels = []) {
  if (!levels || levels.length === 0) {
    return h("p", { class: "muted" }, "Sin niveles medidos.");
  }

  return h("div", { class: "level-tiles" },
    levels.map(level =>
      h("article", { class: "level-tile" },
        h("header", { class: "level-tile__header" },
          h("strong", {}, level.nivel),
          h("span", { class: "level-tile__value" }, formatAverage(level.promedio))
        ),
        h("div", { class: "level-tile__bar", style: { "--level-color": categoryColor(level.categoria) } },
          h("span", { style: { width: `${Math.min(100, (level.promedio / 5) * 100)}%` } })
        ),
        h("footer", { class: "level-tile__footer" },
          categoryBadge(level.categoria, { withEmoji: false }),
          h("small", {}, `${formatInteger(level.cursos)} ${level.cursos === 1 ? "curso" : "cursos"}`)
        )
      )
    )
  );
}
