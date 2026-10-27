// ======================================
// VISTA · ADMINISTRACIÓN DE ENCUESTAS
// ======================================

import { groupCoursesByLevel } from "../domain/courses.js";
import { validateSurveyInput } from "../domain/validation.js";
import { buildSurveyUrl } from "../utils/url.js";
import { formatDateTime } from "../utils/dates.js";
import { formatInteger } from "../utils/format.js";
import { getLastResponsible, setLastResponsible } from "../core/storage.js";
import {
  clear,
  h,
  copyText,
  confirmDialog,
  setButtonBusy,
  showToast
} from "../utils/dom.js";
import {
  pageHeader,
  card,
  button,
  statCard,
  statusBadge,
  progressBar,
  dataTable,
  emptyState,
  loadingState,
  errorBanner,
  notice,
  icon
} from "./components.js";
import { createSurvey, closeSurvey, processSurvey } from "../services/surveys.js";

function errorText(message) {
  return h("p", { class: "field__error", role: "alert" }, message);
}

function setFieldError(element, message) {
  if (!element) return;
  element.textContent = message || "";
  element.hidden = !message;
}

function courseSelect() {
  const select = h("select", { class: "input", name: "curso", required: true },
    h("option", { value: "" }, "Selecciona un curso…"),
    groupCoursesByLevel().map(([level, courses]) =>
      h("optgroup", { label: level },
        courses.map(course => h("option", { value: course }, course))
      )
    )
  );

  return select;
}

function buildSharePanel(survey, { onClose }) {
  const link = buildSurveyUrl(survey.id);

  const linkInput = h("input", {
    class: "input input--mono",
    value: link,
    readOnly: true,
    "aria-label": "Enlace para estudiantes",
    onFocus: event => event.target.select()
  });

  return card({
    className: "share-card",
    body: h("div", { class: "share" },
      h("div", { class: "share__icon" }, icon("check", { size: 26 })),
      h("div", { class: "share__content" },
        h("div", { class: "share__heading" },
          h("div", {},
            h("h2", {}, "Encuesta creada"),
            h("p", {},
              `${survey.curso} · ${survey.responsable} · ${formatInteger(survey.participantesEsperados)} estudiantes esperados`
            )
          ),
          h("span", { class: "survey-code" }, survey.id)
        ),
        h("div", { class: "share__link" },
          linkInput,
          button({
            label: "Copiar enlace",
            variant: "primary",
            iconName: "copy",
            onClick: async () => {
              const copied = await copyText(link);
              showToast(
                copied ? "Enlace copiado." : "No se pudo copiar. Selecciona el enlace manualmente.",
                copied ? "success" : "error"
              );
            }
          }),
          button({
            label: "Abrir",
            variant: "secondary",
            iconName: "external",
            onClick: () => window.open(link, "_blank", "noopener")
          })
        ),
        h("p", { class: "share__hint" },
          "Comparte este enlace con los estudiantes. El contador de respuestas se actualiza al presionar “Actualizar”."
        )
      ),
      h("button", {
        type: "button",
        class: "icon-button share__close",
        "aria-label": "Ocultar enlace",
        onClick: onClose
      }, icon("close", { size: 18 }))
    )
  });
}

function tokenGate({ onToken }) {
  return card({
    className: "token-gate",
    body: h("div", { class: "token-gate__body" },
      h("span", { class: "token-gate__icon" }, icon("lock", { size: 30 })),
      h("div", {},
        h("h2", {}, "Acceso administrativo"),
        h("p", {},
          "Para crear, cerrar o procesar encuestas necesitas el token configurado en Apps Script. " +
          "El token se guarda solo durante esta pestaña y no se incluye en el código del sitio."
        )
      ),
      button({
        label: "Configurar token",
        variant: "primary",
        iconName: "lock",
        onClick: onToken
      })
    )
  });
}

function surveyRowActions(survey, { onChanged }) {
  const link = buildSurveyUrl(survey.id);

  const copyButton = button({
    label: "Copiar enlace",
    variant: "ghost",
    iconName: "copy",
    className: "btn--small",
    onClick: async () => {
      const copied = await copyText(link);
      showToast(copied ? "Enlace copiado." : "No se pudo copiar el enlace.", copied ? "success" : "error");
    }
  });

  const openButton = button({
    label: "Abrir",
    variant: "ghost",
    iconName: "external",
    className: "btn--small",
    onClick: () => window.open(link, "_blank", "noopener")
  });

  const processButton = button({
    label: "Procesar",
    variant: "secondary",
    iconName: "chart",
    className: "btn--small",
    disabled: survey.respuestasRecibidas === 0,
    title: survey.respuestasRecibidas === 0
      ? "No hay respuestas para procesar."
      : "Calcular promedios y crear la medición.",
    onClick: async event => {
      const confirmed = await confirmDialog({
        title: "Procesar encuesta",
        message:
          `Se calcularán los promedios de ${survey.curso} y se creará una medición institucional. ` +
          "La encuesta quedará en estado PROCESADA y no aceptará nuevas respuestas.",
        confirmLabel: "Procesar",
        danger: false
      });

      if (!confirmed) return;

      setButtonBusy(event.currentTarget, true, "Procesando…");

      try {
        const response = await processSurvey(survey.id);
        const average = response.medicion?.promedio;
        showToast(
          average
            ? `Encuesta procesada. Promedio: ${Number(average).toFixed(2)}.`
            : "Encuesta procesada correctamente.",
          "success"
        );
        onChanged?.();
      } catch (error) {
        if (error?.code === "AUTH_CANCELADA") return;
        showToast(error.message || "No se pudo procesar la encuesta.", "error");
        setButtonBusy(event.currentTarget, false);
      }
    }
  });

  const closeButton = button({
    label: "Cerrar",
    variant: "ghost",
    iconName: "lock",
    className: "btn--small btn--danger-ghost",
    onClick: async event => {
      const confirmed = await confirmDialog({
        title: "Cerrar encuesta",
        message:
          `Los estudiantes ya no podrán responder la encuesta de ${survey.curso}. ` +
          "Las respuestas recibidas se conservan y podrás procesarla después.",
        confirmLabel: "Cerrar encuesta",
        danger: true
      });

      if (!confirmed) return;

      setButtonBusy(event.currentTarget, true, "Cerrando…");

      try {
        await closeSurvey(survey.id);
        showToast("Encuesta cerrada. Ya no acepta respuestas.", "success");
        onChanged?.();
      } catch (error) {
        if (error?.code === "AUTH_CANCELADA") return;
        showToast(error.message || "No se pudo cerrar la encuesta.", "error");
        setButtonBusy(event.currentTarget, false);
      }
    }
  });

  const actions = [copyButton];

  if (survey.estado === "ACTIVA") {
    actions.push(openButton, processButton, closeButton);
  } else if (survey.estado === "CERRADA") {
    actions.push(processButton);
  }

  return h("div", { class: "table-actions" }, actions);
}

export function renderSurveyAdmin(container, {
  surveys = [],
  loading = false,
  error = null,
  tokenActive = false,
  sharedSurvey = null,
  onRefresh = null,
  onToken = null,
  onCreated = null,
  onShareClose = null,
  onChanged = null
} = {}) {
  clear(container);

  container.appendChild(pageHeader({
    eyebrow: "Gestión de encuestas",
    title: "Crea una encuesta y compártela",
    subtitle:
      "Cada encuesta genera un enlace único. Los estudiantes responden desde cualquier dispositivo y " +
      "el avance se consulta aquí.",
    actions: button({
      label: loading ? "Actualizando…" : "Actualizar",
      variant: "secondary",
      iconName: "refresh",
      disabled: loading,
      onClick: onRefresh
    })
  }));

  if (sharedSurvey) {
    container.appendChild(buildSharePanel(sharedSurvey, { onClose: onShareClose }));
  }

  const formError = h("p", { class: "alert alert--error", role: "alert", hidden: true });

  const cursoSelect = courseSelect();
  const cursoError = errorText("");
  cursoError.hidden = true;

  const responsableInput = h("input", {
    class: "input",
    name: "responsable",
    type: "text",
    maxLength: 80,
    placeholder: "Nombre del responsable",
    autocomplete: "name",
    value: getLastResponsible()
  });
  const responsableError = errorText("");
  responsableError.hidden = true;

  const participantesInput = h("input", {
    class: "input",
    name: "participantes",
    type: "number",
    min: 1,
    max: 100,
    step: 1,
    inputMode: "numeric",
    placeholder: "Ej: 35"
  });
  const participantesError = errorText("");
  participantesError.hidden = true;

  const submitButton = button({
    label: "Crear encuesta",
    variant: "primary",
    iconName: "plus",
    type: "submit",
    className: "btn--wide"
  });

  const form = h("form", { class: "form", noValidate: true },
    h("div", { class: "field" },
      h("label", { class: "field__label", for: "encuesta-curso" }, "Curso"),
      cursoSelect,
      cursoError,
      h("span", { class: "field__hint" }, "El nivel se calcula automáticamente a partir del curso.")
    ),
    h("div", { class: "field" },
      h("label", { class: "field__label", for: "encuesta-responsable" }, "Responsable"),
      responsableInput,
      responsableError,
      h("span", { class: "field__hint" }, "Docente, orientador o encargado de convivencia.")
    ),
    h("div", { class: "field" },
      h("label", { class: "field__label", for: "encuesta-participantes" }, "Participantes esperados"),
      participantesInput,
      participantesError,
      h("span", { class: "field__hint" }, "Entre 1 y 100 estudiantes. Se usa para mostrar el avance.")
    ),
    formError,
    submitButton
  );

  cursoSelect.id = "encuesta-curso";
  responsableInput.id = "encuesta-responsable";
  participantesInput.id = "encuesta-participantes";

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const validation = validateSurveyInput({
      curso: cursoSelect.value,
      responsable: responsableInput.value,
      participantes: participantesInput.value
    });

    setFieldError(cursoError, validation.errors.curso);
    setFieldError(responsableError, validation.errors.responsable);
    setFieldError(participantesError, validation.errors.participantes);
    formError.hidden = true;

    if (!validation.valid) {
      if (validation.errors.curso) cursoSelect.focus();
      else if (validation.errors.responsable) responsableInput.focus();
      else participantesInput.focus();
      return;
    }

    setButtonBusy(submitButton, true, "Creando…");

    try {
      const response = await createSurvey({
        curso: validation.value.curso,
        responsable: validation.value.responsable,
        participantes: validation.value.participantes
      });

      setLastResponsible(validation.value.responsable);
      showToast(`Encuesta creada: ${response.encuesta.id}`, "success");
      participantesInput.value = "";
      onCreated?.(response.encuesta);
    } catch (error) {
      if (error?.code === "AUTH_CANCELADA") {
        setButtonBusy(submitButton, false);
        return;
      }

      formError.hidden = false;
      formError.textContent = error.message || "No se pudo crear la encuesta.";
      setButtonBusy(submitButton, false);
    }
  });

  const helpCard = card({
    title: "Cómo funciona",
    body: h("ol", { class: "steps steps--compact" },
      h("li", {},
        h("strong", {}, "Crea la encuesta"),
        h("span", {}, "Se genera un código único de 8 caracteres.")
      ),
      h("li", {},
        h("strong", {}, "Comparte el enlace"),
        h("span", {}, "Los estudiantes responden sin crear cuenta.")
      ),
      h("li", {},
        h("strong", {}, "Sigue el avance"),
        h("span", {}, "El contador muestra cuántas respuestas se han recibido.")
      ),
      h("li", {},
        h("strong", {}, "Procesa"),
        h("span", {}, "Se calcula el promedio y se actualiza el dashboard.")
      )
    )
  });

  container.appendChild(h("div", { class: "survey-layout" },
    card({
      title: "Nueva encuesta",
      subtitle: "Datos generales de la aplicación",
      body: form
    }),
    h("div", { class: "stack" },
      helpCard,
      notice(
        "El enlace de una encuesta cerrada o procesada sigue existiendo, pero el estudiante verá un aviso y no podrá responder.",
        "info",
        { iconName: "lock" }
      )
    )
  ));

  if (!tokenActive) {
    container.appendChild(tokenGate({ onToken }));
    return;
  }

  const summary = surveys.reduce((result, survey) => {
    result.total += 1;
    result.responses += survey.respuestasRecibidas;
    if (survey.estado === "ACTIVA") result.active += 1;
    return result;
  }, { total: 0, active: 0, responses: 0 });

  container.appendChild(h("div", { class: "stats-grid stats-grid--three" },
    statCard({
      label: "Encuestas creadas",
      value: formatInteger(summary.total),
      hint: "En la base v2",
      iconName: "survey"
    }),
    statCard({
      label: "Encuestas activas",
      value: formatInteger(summary.active),
      hint: "Aceptando respuestas",
      iconName: "clock",
      tone: summary.active > 0 ? "primary" : ""
    }),
    statCard({
      label: "Respuestas recibidas",
      value: formatInteger(summary.responses),
      hint: "Total histórico agregado",
      iconName: "users"
    })
  ));

  let tableBody;

  if (loading) {
    tableBody = loadingState("Actualizando encuestas…");
  } else if (error) {
    tableBody = errorBanner(error.message || "No se pudieron cargar las encuestas.", { retry: onRefresh });
  } else if (surveys.length === 0) {
    tableBody = emptyState({
      iconName: "survey",
      title: "Todavía no hay encuestas",
      message: "Completa el formulario de arriba para crear la primera encuesta."
    });
  } else {
    tableBody = dataTable({
      columns: [
        {
          label: "Código",
          render: survey => h("span", { class: "survey-code survey-code--small" }, survey.id)
        },
        {
          label: "Curso",
          render: survey => h("div", { class: "table-primary" },
            h("strong", {}, survey.curso),
            h("small", {}, survey.responsable)
          )
        },
        {
          label: "Estado",
          render: survey => statusBadge(survey.estado)
        },
        {
          label: "Avance",
          render: survey => h("div", { class: "table-progress" },
            progressBar({
              value: survey.respuestasRecibidas,
              total: survey.participantesEsperados,
              label: `${formatInteger(survey.respuestasRecibidas)} de ${formatInteger(survey.participantesEsperados)}`
            })
          )
        },
        {
          label: "Creada",
          render: survey => formatDateTime(survey.fechaCreacion)
        },
        {
          label: "Acciones",
          align: "right",
          render: survey => surveyRowActions(survey, { onChanged })
        }
      ],
      rows: surveys,
      caption: "Encuestas registradas"
    });
  }

  container.appendChild(card({
    title: "Seguimiento de encuestas",
    subtitle: "El avance se calcula con las respuestas almacenadas en Google Sheets",
    body: tableBody
  }));
}
