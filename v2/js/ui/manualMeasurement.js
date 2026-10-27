// ======================================
// VISTA · MEDICIÓN DIRECTA POR CURSO
// ======================================

import { DIMENSIONS } from "../domain/dimensions.js";
import { groupCoursesByLevel } from "../domain/courses.js";
import { aggregateResponses } from "../domain/scoring.js";
import { validateManualRows, validateSurveyInput } from "../domain/validation.js";
import { formatAverage, categoryLabel } from "../utils/format.js";
import { todayIsoDate } from "../utils/dates.js";
import { getLastResponsible, setLastResponsible } from "../core/storage.js";
import { clear, h, setButtonBusy, showToast } from "../utils/dom.js";
import {
  pageHeader,
  card,
  button,
  notice,
  categoryBadge,
  dimensionBars,
  emptyState,
  icon
} from "./components.js";
import { saveManualMeasurement } from "../services/measurements.js";

const INITIAL_ROWS = 5;

function courseSelect() {
  return h("select", { class: "input", id: "manual-curso", required: true },
    h("option", { value: "" }, "Selecciona un curso…"),
    groupCoursesByLevel().map(([level, courses]) =>
      h("optgroup", { label: level },
        courses.map(course => h("option", { value: course }, course))
      )
    )
  );
}

function setFieldError(element, message) {
  if (!element) return;
  element.textContent = message || "";
  element.hidden = !message;
}

export function renderManualMeasurement(container, {
  onSaved = null,
  apiConfigured = true
} = {}) {
  clear(container);

  container.appendChild(pageHeader({
    eyebrow: "Medición directa",
    title: "Registra las respuestas de un curso",
    subtitle:
      "Ingresa una fila por estudiante. El sistema calcula los promedios y guarda solo el resultado " +
      "agregado, no las respuestas individuales."
  }));

  if (!apiConfigured) {
    container.appendChild(notice(
      "El API todavía no está configurado. Puedes preparar la tabla, pero no guardar hasta completar js/config.js.",
      "warning",
      { iconName: "alert" }
    ));
  }

  const curso = courseSelect();
  const cursoError = h("p", { class: "field__error", role: "alert", hidden: true });

  const responsable = h("input", {
    class: "input",
    id: "manual-responsable",
    type: "text",
    maxLength: 80,
    placeholder: "Nombre del responsable",
    autocomplete: "name",
    value: getLastResponsible()
  });
  const responsableError = h("p", { class: "field__error", role: "alert", hidden: true });

  const fecha = h("input", {
    class: "input",
    id: "manual-fecha",
    type: "date",
    value: todayIsoDate(),
    max: todayIsoDate()
  });
  const fechaError = h("p", { class: "field__error", role: "alert", hidden: true });

  const tbody = h("tbody", {});
  const rowCount = h("span", { class: "muted" }, `0 filas`);
  let rowSequence = 0;

  const preview = h("div", { class: "manual-preview" });
  const formError = h("p", { class: "alert alert--error", role: "alert", hidden: true });

  function updateRowNumbers() {
    const rows = [...tbody.querySelectorAll("tr")];
    rows.forEach((row, index) => {
      const numberCell = row.querySelector(".manual-row-number");
      if (numberCell) numberCell.textContent = String(index + 1);
    });
    rowCount.textContent = `${rows.length} ${rows.length === 1 ? "fila" : "filas"}`;
  }

  function updatePreview() {
    const rows = collectRows({ silent: true });
    const responses = rows.rows || [];

    clear(preview);

    if (responses.length === 0) {
      preview.appendChild(emptyState({
        iconName: "table",
        title: "Sin filas completas",
        message: "Completa al menos una fila para ver el promedio que se guardará."
      }));
      return;
    }

    const aggregate = aggregateResponses(responses);

    preview.appendChild(h("div", { class: "manual-preview__score" },
      h("span", { class: "manual-preview__label" }, "Promedio calculado"),
      h("strong", {}, formatAverage(aggregate.promedio)),
      categoryBadge(aggregate.categoria)
    ));

    preview.appendChild(dimensionBars(aggregate.dimensiones, { compact: true }));

    preview.appendChild(h("p", { class: "manual-preview__hint" },
      icon("users", { size: 16 }),
      h("span", {}, `${responses.length} ${responses.length === 1 ? "estudiante" : "estudiantes"} · ${categoryLabel(aggregate.categoria)}`)
    ));
  }

  function makeRow(values = {}) {
    rowSequence += 1;

    const selects = DIMENSIONS.map(dimension => {
      const select = h("select", {
        class: "input input--cell",
        "aria-label": `${dimension.label} de la fila`,
        name: `fila-${rowSequence}-${dimension.key}`,
        onChange: updatePreview
      },
        h("option", { value: "" }, "–"),
        [1, 2, 3, 4, 5].map(value => h("option", { value }, String(value)))
      );

      if (values[dimension.key]) select.value = String(values[dimension.key]);
      return select;
    });

    const row = h("tr", {},
      h("td", { class: "manual-row-number" }, "0"),
      selects.map(select => h("td", { class: "manual-cell" }, select)),
      h("td", { class: "manual-cell manual-cell--actions" },
        h("button", {
          type: "button",
          class: "icon-button icon-button--small",
          "aria-label": "Eliminar fila",
          title: "Eliminar fila",
          onClick: () => {
            row.remove();
            updateRowNumbers();
            updatePreview();
          }
        }, icon("close", { size: 16 }))
      )
    );

    return row;
  }

  function addRow(values = {}) {
    tbody.appendChild(makeRow(values));
    updateRowNumbers();
    updatePreview();
  }

  function addRows(count, values = {}) {
    for (let index = 0; index < count; index += 1) {
      tbody.appendChild(makeRow(values));
    }
    updateRowNumbers();
    updatePreview();
  }

  function fillAll(value) {
    tbody.querySelectorAll("select").forEach(select => {
      select.value = value === null ? "" : String(value);
    });
    updatePreview();
  }

  function removeEmptyRows() {
    tbody.querySelectorAll("tr").forEach(row => {
      const filled = [...row.querySelectorAll("select")].some(select => select.value !== "");
      if (!filled) row.remove();
    });

    updateRowNumbers();
    updatePreview();
  }

  function collectRows({ silent = false } = {}) {
    const rows = [];
    let partialRow = 0;

    [...tbody.querySelectorAll("tr")].forEach((row, index) => {
      const values = [...row.querySelectorAll("select")].map(select => select.value);
      const filled = values.filter(value => value !== "");

      if (filled.length === 0) return;

      if (filled.length !== DIMENSIONS.length) {
        if (!silent && partialRow === 0) partialRow = index + 1;
        return;
      }

      const response = {};
      DIMENSIONS.forEach((dimension, dimensionIndex) => {
        response[dimension.key] = Number(values[dimensionIndex]);
      });

      rows.push(response);
    });

    return { rows, partialRow };
  }

  const table = h("div", { class: "table-wrap manual-table-wrap" },
    h("table", { class: "manual-table" },
      h("thead", {},
        h("tr", {},
          h("th", { scope: "col", class: "manual-row-number" }, "#"),
          DIMENSIONS.map(dimension =>
            h("th", {
              scope: "col",
              class: "manual-cell",
              title: `${dimension.label}: ${dimension.question}`
            }, dimension.short)
          ),
          h("th", { scope: "col", class: "manual-cell manual-cell--actions" }, "")
        )
      ),
      tbody
    )
  );

  const toolbar = h("div", { class: "manual-toolbar" },
    h("div", { class: "manual-toolbar__group" },
      button({
        label: "Agregar fila",
        variant: "secondary",
        iconName: "plus",
        className: "btn--small",
        onClick: () => addRow()
      }),
      button({
        label: "Agregar 5",
        variant: "ghost",
        iconName: "plus",
        className: "btn--small",
        onClick: () => addRows(5)
      }),
      button({
        label: "Quitar vacías",
        variant: "ghost",
        className: "btn--small",
        onClick: removeEmptyRows
      })
    ),
    h("div", { class: "manual-toolbar__group" },
      h("span", { class: "manual-toolbar__label" }, "Completar todas:"),
      [3, 4, 5].map(value => h("button", {
        type: "button",
        class: "quick-fill",
        onClick: () => fillAll(value)
      }, String(value))),
      h("button", {
        type: "button",
        class: "quick-fill quick-fill--clear",
        onClick: () => fillAll(null)
      }, "Limpiar")
    )
  );

  const submitButton = button({
    label: "Guardar medición",
    variant: "primary",
    iconName: "check",
    type: "submit",
    className: "btn--wide btn--large"
  });

  const form = h("form", { class: "form manual-form", noValidate: true },
    h("div", { class: "form-grid form-grid--three" },
      h("div", { class: "field" },
        h("label", { class: "field__label", for: "manual-curso" }, "Curso"),
        curso,
        cursoError
      ),
      h("div", { class: "field" },
        h("label", { class: "field__label", for: "manual-responsable" }, "Responsable"),
        responsable,
        responsableError
      ),
      h("div", { class: "field" },
        h("label", { class: "field__label", for: "manual-fecha" }, "Fecha de medición"),
        fecha,
        fechaError
      )
    ),
    notice(
      "Cada fila representa a un estudiante. Las respuestas individuales no se guardan: solo se calcula " +
      "el promedio por dimensión y el promedio general del curso.",
      "info",
      { iconName: "shield" }
    ),
    toolbar,
    table,
    h("div", { class: "manual-table-footer" }, rowCount),
    formError,
    submitButton
  );

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const validation = validateSurveyInput({
      curso: curso.value,
      responsable: responsable.value,
      participantes: 1
    });

    setFieldError(cursoError, validation.errors.curso);
    setFieldError(responsableError, validation.errors.responsable);
    setFieldError(fechaError, fecha.value ? "" : "Selecciona una fecha.");
    formError.hidden = true;

    if (!validation.valid || !fecha.value) {
      if (validation.errors.curso) curso.focus();
      else if (validation.errors.responsable) responsable.focus();
      else if (!fecha.value) fecha.focus();
      return;
    }

    const collected = collectRows();

    if (collected.rows.length === 0) {
      formError.hidden = false;
      formError.textContent = "Completa al menos una fila con las 7 respuestas.";
      return;
    }

    if (collected.partialRow > 0) {
      formError.hidden = false;
      formError.textContent = `La fila ${collected.partialRow} está incompleta. Completa las 7 respuestas o elimínala.`;
      return;
    }

    const rowsValidation = validateManualRows(collected.rows);

    if (!rowsValidation.valid) {
      formError.hidden = false;
      formError.textContent = rowsValidation.message;
      return;
    }

    setButtonBusy(submitButton, true, "Guardando…");

    try {
      const response = await saveManualMeasurement({
        curso: validation.value.curso,
        responsable: validation.value.responsable,
        fecha: fecha.value,
        respuestas: collected.rows
      });

      setLastResponsible(validation.value.responsable);
      const average = response.medicion?.promedio;

      showToast(
        average
          ? `Medición guardada. Promedio: ${Number(average).toFixed(2)}.`
          : "Medición guardada correctamente.",
        "success"
      );

      tbody.replaceChildren();
      addRows(INITIAL_ROWS);
      fecha.value = todayIsoDate();
      onSaved?.(response);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error?.code === "AUTH_CANCELADA") {
        setButtonBusy(submitButton, false);
        return;
      }

      formError.hidden = false;
      formError.textContent = error.message || "No se pudo guardar la medición.";
      setButtonBusy(submitButton, false);
    }
  });

  container.appendChild(h("div", { class: "manual-layout" },
    card({
      title: "Respuestas por estudiante",
      subtitle: "Escala de 1 (muy en desacuerdo) a 5 (muy de acuerdo)",
      body: form
    }),
    card({
      title: "Vista previa",
      subtitle: "Se actualiza al completar las filas",
      className: "manual-preview-card",
      body: preview
    })
  ));

  addRows(INITIAL_ROWS);
}
