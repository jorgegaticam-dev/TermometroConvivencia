// ======================================
// VISTA · DASHBOARD INSTITUCIONAL
// ======================================

import {
  buildSnapshot,
  rankingByCourse,
  groupByLevel,
  sortMeasurements
} from "../domain/scoring.js";
import { formatAverage, formatInteger, categoryLabel } from "../utils/format.js";
import { formatDateShort } from "../utils/dates.js";
import { clear, h } from "../utils/dom.js";
import {
  pageHeader,
  card,
  button,
  statCard,
  thermometer,
  categoryLegend,
  radarChart,
  dimensionBars,
  rankingList,
  levelTiles,
  dataTable,
  emptyState,
  loadingState,
  errorBanner,
  notice,
  categoryBadge,
  icon
} from "./components.js";
import { openMeasurementDetail } from "./measurementDetail.js";

export function renderDashboard(container, {
  measurements = [],
  loading = false,
  error = null,
  fromCache = false,
  apiConfigured = true,
  onRefresh = null,
  onNavigate = null
} = {}) {
  clear(container);

  if (loading && measurements.length === 0) {
    container.appendChild(loadingState("Cargando mediciones institucionales…"));
    return;
  }

  const sorted = sortMeasurements(measurements);
  const snapshot = buildSnapshot(sorted);
  const ranking = rankingByCourse(sorted, 5);
  const levels = groupByLevel(sorted);

  container.appendChild(pageHeader({
    eyebrow: "Panel institucional",
    title: "Convivencia escolar en perspectiva",
    subtitle: "Promedio de la última medición registrada por curso. Los datos se actualizan desde Google Sheets.",
    actions: button({
      label: loading ? "Actualizando…" : "Actualizar",
      variant: "secondary",
      iconName: "refresh",
      onClick: onRefresh,
      disabled: loading
    })
  }));

  if (error && apiConfigured) {
    container.appendChild(errorBanner(
      fromCache
        ? "No se pudo conectar con el API. Se muestran los últimos datos guardados en este dispositivo."
        : error.message || "Revisa la configuración del API.",
      { retry: onRefresh }
    ));
  }

  if (!apiConfigured) {
    container.appendChild(notice(
      "Falta configurar la URL del API en js/config.js. Mientras tanto, el panel solo puede mostrar datos guardados en caché.",
      "warning",
      { iconName: "alert" }
    ));
  }

  if (sorted.length === 0) {
    container.appendChild(card({
      className: "welcome-card",
      body: h("div", { class: "welcome" },
        h("span", { class: "welcome__icon" }, icon("thermometer", { size: 42 })),
        h("div", { class: "welcome__text" },
          h("h2", {}, "Aún no hay mediciones"),
          h("p", {},
            "Crea una encuesta para que los estudiantes respondan desde sus dispositivos " +
            "o registra una medición directa por curso."
          )
        ),
        h("div", { class: "welcome__actions" },
          button({
            label: "Crear encuesta",
            variant: "primary",
            iconName: "plus",
            onClick: () => onNavigate?.("encuestas")
          }),
          button({
            label: "Medición directa",
            variant: "secondary",
            iconName: "table",
            onClick: () => onNavigate?.("mediciones")
          })
        )
      )
    }));

    container.appendChild(card({
      title: "Cómo funciona",
      body: h("ol", { class: "steps" },
        h("li", {},
          h("strong", {}, "Crea la encuesta"),
          h("span", {}, "Selecciona el curso, responsable y cantidad esperada de estudiantes.")
        ),
        h("li", {},
          h("strong", {}, "Comparte el enlace"),
          h("span", {}, "Cada estudiante responde desde su computador o teléfono.")
        ),
        h("li", {},
          h("strong", {}, "Procesa los resultados"),
          h("span", {}, "El sistema calcula los promedios y actualiza el termómetro institucional.")
        )
      )
    }));

    return;
  }

  const alertCount = ranking.latest.filter(measurement =>
    measurement.categoria === "ALERTA" || measurement.categoria === "CRITICA"
  ).length;

  container.appendChild(h("div", { class: "stats-grid" },
    statCard({
      label: "Promedio institucional",
      value: formatAverage(snapshot.promedio),
      hint: categoryLabel(snapshot.categoria),
      iconName: "thermometer",
      tone: "primary"
    }),
    statCard({
      label: "Cursos medidos",
      value: formatInteger(snapshot.cursos),
      hint: "Con al menos una medición",
      iconName: "users"
    }),
    statCard({
      label: "Cursos en alerta",
      value: formatInteger(alertCount),
      hint: "Promedio inferior a 3,1",
      iconName: "alert",
      tone: alertCount > 0 ? "warning" : ""
    }),
    statCard({
      label: "Mediciones totales",
      value: formatInteger(snapshot.totalMediciones),
      hint: snapshot.ultimaFecha ? `Última: ${formatDateShort(snapshot.ultimaFecha)}` : "Sin fecha",
      iconName: "history"
    })
  ));

  container.appendChild(h("div", { class: "dashboard-grid" },
    card({
      title: "Termómetro institucional",
      subtitle: "Última medición disponible por curso",
      className: "card--thermometer",
      body: h("div", { class: "thermometer-layout" },
        thermometer({
          value: snapshot.promedio,
          category: snapshot.categoria,
          meta: `${formatInteger(snapshot.cursos)} ${snapshot.cursos === 1 ? "curso" : "cursos"} · ${formatInteger(snapshot.totalMediciones)} ${snapshot.totalMediciones === 1 ? "medición" : "mediciones"}`
        }),
        h("div", { class: "thermometer-side" },
          h("h3", { class: "mini-title" }, "Escala de referencia"),
          categoryLegend()
        )
      )
    }),

    card({
      title: "Perfil de convivencia",
      subtitle: "Promedio de las últimas mediciones por dimensión",
      body: h("div", { class: "profile-grid" },
        radarChart(snapshot.dimensiones),
        dimensionBars(snapshot.dimensiones)
      )
    })
  ));

  container.appendChild(h("div", { class: "dashboard-grid dashboard-grid--two" },
    card({
      title: "Ranking por curso",
      subtitle: "Solo la medición más reciente de cada curso",
      body: h("div", { class: "ranking-grid" },
        h("div", {},
          h("h3", { class: "mini-title" }, "Mejores promedios"),
          rankingList(ranking.top, { tone: "top" })
        ),
        h("div", {},
          h("h3", { class: "mini-title" }, "Cursos en alerta"),
          ranking.bottom.length > 0
            ? rankingList(ranking.bottom, { tone: "bottom" })
            : h("div", { class: "success-note" },
                icon("check", { size: 18 }),
                h("span", {}, "Ningún curso está bajo 3,1 en su última medición.")
              )
        )
      )
    }),

    card({
      title: "Comparación por nivel",
      subtitle: "Promedio de los cursos medidos en cada nivel",
      body: levelTiles(levels)
    })
  ));

  const recent = sorted.slice(0, 8);

  container.appendChild(card({
    title: "Últimas mediciones",
    subtitle: "Resultados agregados por curso",
    actions: button({
      label: "Ver historial",
      variant: "ghost",
      iconName: "chevronRight",
      onClick: () => onNavigate?.("historial")
    }),
    body: dataTable({
      columns: [
        {
          label: "Fecha",
          render: measurement => formatDateShort(measurement.fecha)
        },
        {
          label: "Curso",
          render: measurement => h("strong", {}, measurement.curso)
        },
        { label: "Nivel", render: measurement => measurement.nivel },
        {
          label: "Participantes",
          align: "right",
          render: measurement => formatInteger(measurement.participantes)
        },
        {
          label: "Promedio",
          align: "right",
          render: measurement => h("strong", { class: "score-value" }, formatAverage(measurement.promedio))
        },
        {
          label: "Categoría",
          render: measurement => categoryBadge(measurement.categoria, { withEmoji: false })
        },
        {
          label: "",
          align: "right",
          render: measurement => button({
            label: "Detalle",
            variant: "ghost",
            className: "btn--small",
            onClick: () => openMeasurementDetail(measurement)
          })
        }
      ],
      rows: recent,
      caption: "Últimas mediciones registradas"
    })
  }));
}
