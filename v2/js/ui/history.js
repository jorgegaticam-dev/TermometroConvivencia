// ======================================
// VISTA · HISTORIAL DE MEDICIONES
// ======================================

import { CONFIG } from "../config.js";
import { COURSES } from "../domain/courses.js";
import {
  average,
  categoryKeyFromAverage,
  latestByCourse,
  sortMeasurements
} from "../domain/scoring.js";
import { formatAverage, formatInteger, categoryLabel, toCsv } from "../utils/format.js";
import { dateSortValue, formatDateShort, todayIsoDate } from "../utils/dates.js";
import { clear, h, downloadTextFile, showToast } from "../utils/dom.js";
import {
  pageHeader,
  card,
  button,
  dataTable,
  emptyState,
  loadingState,
  errorBanner,
  lineChart,
  categoryBadge,
  badge,
  notice,
  icon
} from "./components.js";
import { openMeasurementDetail } from "./measurementDetail.js";

const ORIGIN_LABELS = {
  ENCUESTA: "Encuesta",
  MANUAL: "Directa",
  MIGRADA: "Migrada"
};

function courseOrder(course) {
  const index = COURSES.indexOf(course);
  return index === -1 ? 999 : index;
}

function uniqueCourses(measurements) {
  return [...new Set(measurements.map(measurement => measurement.curso).filter(Boolean))]
    .sort((a, b) => courseOrder(a) - courseOrder(b) || a.localeCompare(b, "es"));
}

function uniqueLevels(measurements) {
  return [...new Set(measurements.map(measurement => measurement.nivel).filter(Boolean))];
}

function option(value, label) {
  return h("option", { value }, label || value);
}

function filterField(label, control) {
  return h("label", { class: "filter-field" },
    h("span", { class: "filter-field__label" }, label),
    control
  );
}

function summaryItem(label, value, tone = "") {
  return h("div", { class: `history-summary__item ${tone ? `is-${tone}` : ""}`.trim() },
    h("span", {}, label),
    h("strong", {}, value)
  );
}

function exportCsv(rows) {
  if (rows.length === 0) {
    showToast("No hay mediciones para exportar con los filtros actuales.", "error");
    return;
  }

  const csv = toCsv(rows, [
    { label: "Fecha", key: "fecha" },
    { label: "Curso", key: "curso" },
    { label: "Nivel", key: "nivel" },
    { label: "Responsable", key: "responsable" },
    { label: "Participantes", key: "participantes" },
    { label: "Promedio", key: "promedio" },
    { label: "Categoria", key: "categoria" },
    { label: "Bienestar", value: row => row.dimensiones?.bienestar ?? "" },
    { label: "Inclusion", value: row => row.dimensiones?.inclusion ?? "" },
    { label: "BuenTrato", value: row => row.dimensiones?.buenTrato ?? "" },
    { label: "Participacion", value: row => row.dimensiones?.participacion ?? "" },
    { label: "Seguridad", value: row => row.dimensiones?.seguridad ?? "" },
    { label: "Pertenencia", value: row => row.dimensiones?.pertenencia ?? "" },
    { label: "Relaciones", value: row => row.dimensiones?.relaciones ?? "" },
    { label: "EncuestaID", key: "encuestaID" },
    { label: "Origen", key: "origen" },
    { label: "CreadoEn", key: "creadoEn" }
  ]);

  downloadTextFile(`TCE_historial_${todayIsoDate()}.csv`, csv, "text/csv;charset=utf-8", true);
  showToast(`Se exportaron ${rows.length} mediciones.`, "success");
}

export function renderHistory(container, {
  measurements = [],
  loading = false,
  error = null,
  apiConfigured = true,
  onRefresh = null
} = {}) {
  clear(container);

  if (loading && measurements.length === 0) {
    container.appendChild(loadingState("Cargando historial de mediciones…"));
    return;
  }

  const courses = uniqueCourses(measurements);
  const levels = uniqueLevels(measurements);

  const courseSelect = h("select", { class: "input" },
    option("", "Todos los cursos"),
    courses.map(course => option(course))
  );

  const levelSelect = h("select", { class: "input" },
    option("", "Todos los niveles"),
    levels.map(level => option(level))
  );

  const categorySelect = h("select", { class: "input" },
    option("", "Todas las categorías"),
    Object.keys(CONFIG.CATEGORIAS).map(key => option(key, CONFIG.CATEGORIAS[key].label))
  );

  const fromInput = h("input", { class: "input", type: "date" });
  const toInput = h("input", { class: "input", type: "date" });

  const results = h("div", { class: "history-results" });
  let currentRows = [];

  function filters() {
    return {
      curso: courseSelect.value,
      nivel: levelSelect.value,
      categoria: categorySelect.value,
      desde: fromInput.value,
      hasta: toInput.value
    };
  }

  function applyFilters() {
    const values = filters();
    let rows = sortMeasurements(measurements);

    if (values.curso) rows = rows.filter(measurement => measurement.curso === values.curso);
    if (values.nivel) rows = rows.filter(measurement => measurement.nivel === values.nivel);
    if (values.categoria) rows = rows.filter(measurement => measurement.categoria === values.categoria);

    if (values.desde) {
      const from = dateSortValue(values.desde);
      rows = rows.filter(measurement => dateSortValue(measurement.fecha) >= from);
    }

    if (values.hasta) {
      const to = dateSortValue(values.hasta);
      rows = rows.filter(measurement => dateSortValue(measurement.fecha) <= to);
    }

    return rows;
  }

  function clearFilters() {
    courseSelect.value = "";
    levelSelect.value = "";
    categorySelect.value = "";
    fromInput.value = "";
    toInput.value = "";
    renderResults();
  }

  function renderResults() {
    const rows = applyFilters();
    currentRows = rows;
    clear(results);

    if (measurements.length === 0) {
      results.appendChild(card({
        body: emptyState({
          iconName: "history",
          title: "Todavía no hay mediciones",
          message: "Crea una encuesta o registra una medición directa para comenzar el historial.",
          action: onRefresh
            ? button({
                label: "Actualizar",
                variant: "secondary",
                iconName: "refresh",
                onClick: onRefresh
              })
            : null
        })
      }));
      return;
    }

    if (rows.length === 0) {
      results.appendChild(card({
        body: emptyState({
          iconName: "search",
          title: "Sin resultados",
          message: "No hay mediciones que coincidan con los filtros seleccionados.",
          action: button({
            label: "Limpiar filtros",
            variant: "secondary",
            onClick: clearFilters
          })
        })
      }));
      return;
    }

    const latest = latestByCourse(rows);
    const snapshotAverage = average(latest.map(measurement => Number(measurement.promedio)));
    const alertCount = latest.filter(measurement =>
      measurement.categoria === "ALERTA" || measurement.categoria === "CRITICA"
    ).length;

    results.appendChild(h("div", { class: "history-summary" },
      h("div", { class: "history-summary__items" },
        summaryItem("Mediciones", formatInteger(rows.length), "primary"),
        summaryItem("Cursos", formatInteger(latest.length)),
        summaryItem("Promedio de últimos", formatAverage(snapshotAverage)),
        summaryItem("En alerta", formatInteger(alertCount), alertCount > 0 ? "warning" : "success")
      ),
      h("span", { class: "history-summary__filtered" },
        icon("search", { size: 16 }),
        filters().curso || filters().nivel || filters().categoria || filters().desde || filters().hasta
          ? "Vista filtrada"
          : "Vista completa"
      )
    ));

    if (courseSelect.value) {
      const courseRows = rows
        .filter(measurement => measurement.curso === courseSelect.value)
        .sort((a, b) => dateSortValue(a.fecha) - dateSortValue(b.fecha));

      if (courseRows.length > 0) {
        results.appendChild(card({
          title: `Evolución · ${courseSelect.value}`,
          subtitle: `${courseRows.length} ${courseRows.length === 1 ? "medición registrada" : "mediciones registradas"}`,
          className: "card--chart",
          body: h("div", {},
            lineChart(courseRows.map(measurement => ({
              label: measurement.fecha,
              value: measurement.promedio
            })), { height: 260 }),
            courseRows.length === 1
              ? h("p", { class: "muted chart-note" },
                  "Con una sola medición no es posible observar una tendencia. Registra otra fecha para comparar."
                )
              : null
          )
        }));
      }
    }

    results.appendChild(card({
      title: "Mediciones registradas",
      subtitle: "Resultados agregados, ordenados de más reciente a más antiguo",
      body: dataTable({
        columns: [
          {
            label: "Fecha",
            render: measurement => h("strong", {}, formatDateShort(measurement.fecha))
          },
          {
            label: "Curso",
            render: measurement => h("div", { class: "table-primary" },
              h("strong", {}, measurement.curso),
              h("small", {}, measurement.responsable || "Sin responsable")
            )
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
            label: "Origen",
            render: measurement => badge(
              ORIGIN_LABELS[measurement.origen] || measurement.origen || "—",
              "neutral"
            )
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
        rows,
        caption: "Historial de mediciones"
      })
    }));
  }

  [courseSelect, levelSelect, categorySelect, fromInput, toInput].forEach(control => {
    control.addEventListener("change", renderResults);
  });

  container.appendChild(pageHeader({
    eyebrow: "Historial",
    title: "Mediciones y tendencias",
    subtitle:
      "Consulta los resultados agregados por curso y fecha. Los datos históricos no se eliminan; " +
      "se corrigen con nuevas mediciones.",
    actions: h("div", { class: "page-header__button-group" },
      button({
        label: loading ? "Actualizando…" : "Actualizar",
        variant: "secondary",
        iconName: "refresh",
        disabled: loading,
        onClick: onRefresh
      }),
      button({
        label: "Exportar CSV",
        variant: "primary",
        iconName: "download",
        onClick: () => exportCsv(currentRows)
      })
    )
  }));

  if (!apiConfigured) {
    container.appendChild(notice(
      "Falta configurar la URL del API en js/config.js. El historial se llenará cuando guardes mediciones en Google Sheets.",
      "warning",
      { iconName: "alert" }
    ));
  }

  if (error && apiConfigured) {
    container.appendChild(errorBanner(error.message || "No se pudo cargar el historial.", { retry: onRefresh }));
  }

  container.appendChild(card({
    title: "Filtros",
    className: "filters-card",
    body: h("div", { class: "filters" },
      h("div", { class: "filters__grid" },
        filterField("Curso", courseSelect),
        filterField("Nivel", levelSelect),
        filterField("Categoría", categorySelect),
        filterField("Desde", fromInput),
        filterField("Hasta", toInput)
      ),
      h("div", { class: "filters__actions" },
        button({
          label: "Limpiar filtros",
          variant: "ghost",
          iconName: "close",
          onClick: clearFilters
        })
      )
    )
  }));

  container.appendChild(results);
  renderResults();
}
