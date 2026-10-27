// ======================================
// VISTA · ENCUESTA PARA ESTUDIANTES
// ======================================

import { DIMENSIONS, LIKERT } from "../domain/dimensions.js";
import { validateResponse } from "../domain/validation.js";
import { getDeviceId, hasResponded, markResponded, setLastSurveyCode } from "../core/storage.js";
import { getSurvey, saveResponse } from "../services/surveys.js";
import { clear, h, setButtonBusy } from "../utils/dom.js";
import {
  button,
  icon,
  loadingState,
  errorBanner,
  notice
} from "./components.js";

const LIKERT_TONES = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#84cc16",
  5: "#22c55e"
};

function surveyCard(content, { className = "" } = {}) {
  return h("section", { class: `survey-card ${className}`.trim() }, content);
}

function studentHeader(survey) {
  return h("div", { class: "survey-hero" },
    h("span", { class: "survey-hero__eyebrow" }, "Encuesta de convivencia"),
    h("h1", { class: "survey-hero__title" }, survey.curso),
    h("div", { class: "survey-hero__meta" },
      h("span", {}, icon("users", { size: 16 }), survey.responsable || "Responsable no informado"),
      h("span", {}, icon("clock", { size: 16 }), "Respuesta anónima")
    ),
    h("p", { class: "survey-hero__lead" },
      "Lee cada afirmación y elige la opción que mejor represente lo que sientes. " +
      "No hay respuestas correctas o incorrectas."
    )
  );
}

function finalCard({ iconName = "check", tone = "success", title, message, extra = null }) {
  return surveyCard(
    h("div", { class: `survey-final survey-final--${tone}` },
      h("span", { class: "survey-final__icon" }, icon(iconName, { size: 38 })),
      h("h2", {}, title),
      h("p", {}, message),
      extra
    ),
    { className: "survey-card--narrow" }
  );
}

function renderQuestion(dimension, index) {
  return h("fieldset", { class: "question", "data-dimension": dimension.key },
    h("legend", { class: "question__legend" },
      h("span", { class: "question__number" }, String(index + 1).padStart(2, "0")),
      h("span", { class: "question__text" }, dimension.question)
    ),
    h("div", { class: "likert" },
      LIKERT.map(option =>
        h("label", {
          class: "likert__option",
          style: { "--likert-color": LIKERT_TONES[option.value] }
        },
          h("input", {
            type: "radio",
            name: dimension.key,
            value: option.value,
            class: "likert__input"
          }),
          h("span", { class: "likert__key" }, String(option.value)),
          h("span", { class: "likert__label" }, option.label)
        )
      )
    )
  );
}

function renderForm(survey, { onSubmitted }) {
  const responses = {};

  const progressText = h("strong", {}, "0 de 7 respondidas");
  const progressFill = h("span", { class: "progress__fill", style: { width: "0%" } });

  const submitButton = button({
    label: "Enviar respuestas",
    variant: "primary",
    iconName: "check",
    type: "submit",
    className: "btn--wide btn--large"
  });

  const formError = h("p", { class: "alert alert--error", role: "alert", hidden: true });

  const form = h("form", { class: "survey-form", noValidate: true },
    DIMENSIONS.map((dimension, index) => renderQuestion(dimension, index)),
    notice(
      "No escribas tu nombre ni datos personales. Tus respuestas se guardan de forma anónima y se usan solo para calcular promedios por curso.",
      "info",
      { iconName: "shield" }
    ),
    formError,
    h("div", { class: "survey-submit" },
      submitButton,
      h("p", { class: "survey-submit__hint" },
        "Al enviar, confirmas que respondiste con sinceridad."
      )
    )
  );

  function updateProgress() {
    let answered = 0;

    DIMENSIONS.forEach(dimension => {
      const checked = form.querySelector(`input[name="${dimension.key}"]:checked`);

      if (checked) {
        answered += 1;
        responses[dimension.key] = Number(checked.value);
      } else {
        delete responses[dimension.key];
      }
    });

    progressText.textContent = `${answered} de 7 respondidas`;
    progressFill.style.width = `${(answered / 7) * 100}%`;
    submitButton.disabled = answered < 7;

    form.querySelectorAll(".question").forEach(question => {
      const key = question.dataset.dimension;
      question.classList.toggle("is-answered", Boolean(responses[key]));
    });
  }

  form.addEventListener("change", updateProgress);

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const validation = validateResponse(responses);
    formError.hidden = true;

    if (!validation.valid) {
      const firstMissing = DIMENSIONS.find(dimension => validation.errors[dimension.key]);
      const question = firstMissing
        ? form.querySelector(`[data-dimension="${firstMissing.key}"]`)
        : null;

      formError.hidden = false;
      formError.textContent = "Responde todas las preguntas antes de enviar.";
      question?.scrollIntoView({ behavior: "smooth", block: "center" });
      question?.querySelector("input")?.focus();
      return;
    }

    setButtonBusy(submitButton, true, "Enviando…");

    try {
      const result = await saveResponse({
        codigo: survey.id,
        deviceId: getDeviceId(),
        respuestas: responses
      });

      markResponded(survey.id);
      setLastSurveyCode(survey.id);
      onSubmitted?.({
        duplicated: Boolean(result.duplicado),
        recibidas: result.recibidas
      });
    } catch (error) {
      formError.hidden = false;
      formError.textContent = error.message || "No se pudo enviar la respuesta. Intenta nuevamente.";
      setButtonBusy(submitButton, false);

      if (error?.code === "ENCUESTA_CERRADA" || error?.code === "ENCUESTA_PROCESADA") {
        form.querySelectorAll("input, button").forEach(element => {
          element.disabled = true;
        });
      }
    }
  });

  return surveyCard(
    h("div", { class: "survey-body" },
      studentHeader(survey),
      h("div", { class: "survey-progress" },
        h("div", { class: "survey-progress__text" },
          h("span", {}, "Tu avance"),
          progressText
        ),
        h("div", { class: "progress__track", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "7", "aria-valuenow": "0" },
          progressFill
        )
      ),
      form
    )
  );
}

function renderThanks(survey, { duplicated = false } = {}) {
  return finalCard({
    iconName: "check",
    tone: "success",
    title: duplicated ? "Ya teníamos tu respuesta" : "Gracias por responder",
    message: duplicated
      ? `Ya existe una respuesta registrada para ${survey.curso} desde este dispositivo. No se guardó una segunda respuesta.`
      : `Tu respuesta para ${survey.curso} quedó registrada de forma anónima.`,
    extra: h("div", { class: "survey-final__extra" },
      h("span", { class: "survey-code" }, survey.id),
      h("p", { class: "muted" }, "Puedes cerrar esta pestaña.")
    )
  });
}

function renderClosed(survey, code) {
  return finalCard({
    iconName: "lock",
    tone: "neutral",
    title: "Esta encuesta ya finalizó",
    message:
      `La encuesta de ${survey.curso} no acepta nuevas respuestas. ` +
      "Si necesitas responder, consulta con el encargado de convivencia.",
    extra: h("span", { class: "survey-code" }, code)
  });
}

function renderNotFound(code, error) {
  return finalCard({
    iconName: "alert",
    tone: "error",
    title: "No encontramos esta encuesta",
    message:
      "Revisa que el enlace esté completo o solicita un nuevo enlace al encargado de convivencia.",
    extra: h("div", { class: "survey-final__extra" },
      h("span", { class: "survey-code" }, code || "Sin código"),
      error?.code ? h("p", { class: "muted" }, `Código de error: ${error.code}`) : null
    )
  });
}

function renderConnectionError(error, onRetry) {
  return surveyCard(
    h("div", { class: "survey-body" },
      h("h2", { class: "survey-title" }, "No se pudo cargar la encuesta"),
      errorBanner(
        error?.message || "Revisa tu conexión a internet e intenta nuevamente.",
        { retry: onRetry }
      ),
      h("p", { class: "muted" },
        "Si el problema continúa, avisa al encargado de convivencia."
      )
    ),
    { className: "survey-card--narrow" }
  );
}

export async function renderStudentSurvey(main, code, { onRetry = null } = {}) {
  clear(main);

  const normalizedCode = String(code || "").trim().toUpperCase();

  main.appendChild(surveyCard(loadingState("Cargando encuesta…"), { className: "survey-card--narrow" }));

  let survey;

  try {
    survey = await getSurvey(normalizedCode);
  } catch (error) {
    clear(main);

    const notFoundCodes = new Set([
      "ENCUESTA_NO_ENCONTRADA",
      "CODIGO_INVALIDO",
      "CODIGO_REQUERIDO"
    ]);

    if (notFoundCodes.has(error?.code)) {
      main.appendChild(renderNotFound(normalizedCode, error));
    } else {
      main.appendChild(renderConnectionError(error, onRetry));
    }

    return;
  }

  clear(main);

  if (survey.estado === "CERRADA" || survey.estado === "PROCESADA") {
    main.appendChild(renderClosed(survey, normalizedCode));
    return;
  }

  if (hasResponded(normalizedCode)) {
    main.appendChild(renderThanks(survey, { duplicated: true }));
    return;
  }

  main.appendChild(renderForm(survey, {
    onSubmitted: result => {
      clear(main);
      main.appendChild(renderThanks(survey, result));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }));
}

export function studentSurveyCodeFromUrl() {
  const code = new URLSearchParams(window.location.search).get("encuesta");
  return code ? String(code).trim().toUpperCase() : "";
}
