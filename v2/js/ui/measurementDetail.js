// ======================================
// DETALLE · MEDICIÓN AGREGADA
// ======================================

import { h } from "../utils/dom.js";
import { formatAverage, formatInteger } from "../utils/format.js";
import { formatDateShort, formatDateTime } from "../utils/dates.js";
import {
  openDialog,
  categoryBadge,
  radarChart,
  dimensionBars,
  keyValueList
} from "./components.js";

export function openMeasurementDetail(measurement) {
  openDialog({
    title: measurement.curso,
    className: "dialog--wide",
    content: h("div", { class: "measurement-detail" },
      h("div", { class: "measurement-detail__header" },
        h("div", {},
          h("span", { class: "measurement-detail__date" }, formatDateShort(measurement.fecha)),
          h("p", { class: "muted" }, measurement.responsable || "Sin responsable registrado")
        ),
        h("div", { class: "measurement-detail__score" },
          h("strong", {}, formatAverage(measurement.promedio)),
          categoryBadge(measurement.categoria)
        )
      ),
      h("div", { class: "measurement-detail__grid" },
        radarChart(measurement.dimensiones, { size: 320 }),
        dimensionBars(measurement.dimensiones)
      ),
      keyValueList([
        { label: "Nivel", value: measurement.nivel },
        { label: "Participantes", value: formatInteger(measurement.participantes) },
        { label: "Origen", value: measurement.origen || "—" },
        { label: "Encuesta", value: measurement.encuestaID || "Medición directa" },
        { label: "Registrada", value: measurement.creadoEn ? formatDateTime(measurement.creadoEn) : "—" }
      ])
    ),
    actions: [{ label: "Cerrar", variant: "primary" }]
  });
}
