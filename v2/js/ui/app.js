// ======================================
// APLICACIÓN · ARRANQUE Y RUTAS
// ======================================

import { isApiConfigured } from "../config.js";
import { getRoute, navigate, onRouteChange } from "../core/router.js";
import { getState } from "../core/state.js";
import { h } from "../utils/dom.js";
import { hasAdminToken, askAdminToken, forgetAdminToken } from "../services/auth.js";
import { loadMeasurements } from "../services/measurements.js";
import { loadSurveys } from "../services/surveys.js";
import { renderAdminLayout, renderStudentShell } from "./layout.js";
import { renderDashboard } from "./dashboard.js";
import { renderSurveyAdmin } from "./surveyAdmin.js";
import { renderStudentSurvey } from "./surveyStudent.js";
import { renderHistory } from "./history.js";
import { renderManualMeasurement } from "./manualMeasurement.js";
import { openDialog, icon } from "./components.js";

function errorMessage(error) {
  return error?.message || "Ocurrió un error inesperado.";
}

export async function startApp(root) {
  const route = getRoute();

  if (route.mode === "student") {
    startStudentApp(root, route.code);
    return;
  }

  startAdminApp(root, route.view);
}

function startStudentApp(root, code) {
  const { main } = renderStudentShell(root);

  const load = () => {
    renderStudentSurvey(main, code, { onRetry: load });
  };

  load();
}

function startAdminApp(root, initialView) {
  let currentView = initialView;
  let measurementsLoading = false;
  let surveysLoading = false;
  let sharedSurvey = null;

  const layout = renderAdminLayout(root, {
    view: currentView,
    onNavigate: view => navigate(view),
    onTokenClick: () => handleTokenClick()
  });

  layout.setTokenState(hasAdminToken());
  layout.setApiState(isApiConfigured() ? "offline" : "unconfigured");

  const state = getState();

  async function refreshMeasurements({ render = true } = {}) {
    measurementsLoading = true;
    if (render) renderCurrent();

    try {
      const result = await loadMeasurements();
      layout.setApiState(
        result.fromCache ? "cache" : "online",
        result.error ? errorMessage(result.error) : "API conectada"
      );
    } catch (error) {
      layout.setApiState(
        isApiConfigured() ? "offline" : "unconfigured",
        errorMessage(error)
      );
    } finally {
      measurementsLoading = false;
      if (render) renderCurrent();
    }
  }

  async function refreshSurveys({ render = true } = {}) {
    if (!hasAdminToken()) {
      if (render) renderCurrent();
      return { cancelled: true };
    }

    surveysLoading = true;
    if (render) renderCurrent();

    try {
      const result = await loadSurveys({ silentToken: true });
      return result;
    } catch (error) {
      return { error };
    } finally {
      surveysLoading = false;
      if (render) renderCurrent();
    }
  }

  function ensureSurveysLoaded() {
    if (
      currentView === "encuestas" &&
      hasAdminToken() &&
      state.surveysLoadedAt === 0 &&
      !surveysLoading &&
      !state.surveysError
    ) {
      refreshSurveys();
    }
  }

  function handleTokenClick() {
    if (!hasAdminToken()) {
      askAdminToken()
        .then(() => {
          layout.setTokenState(true);
          if (currentView === "encuestas") refreshSurveys();
        })
        .catch(() => {});
      return;
    }

    openDialog({
      title: "Token de administración",
      content: h("div", { class: "stack" },
        h("p", {},
          "El token está activo solo en esta pestaña. Puedes cambiarlo o eliminarlo de la sesión."
        ),
        h("div", { class: "token-state" },
          icon("shield", { size: 20 }),
          h("div", {},
            h("strong", {}, "Token configurado"),
            h("span", {}, "Las acciones administrativas están habilitadas.")
          )
        )
      ),
      actions: [
        {
          label: "Cambiar token",
          variant: "primary",
          onClick: async () => {
            try {
              await askAdminToken({ force: true, title: "Nuevo token" });
              layout.setTokenState(true);
              if (currentView === "encuestas") refreshSurveys();
            } catch {
              // Cancelado por el usuario.
            }
          }
        },
        {
          label: "Eliminar token",
          variant: "danger",
          onClick: () => {
            forgetAdminToken();
            layout.setTokenState(false);
            if (currentView === "encuestas") renderCurrent();
          }
        },
        { label: "Cancelar", variant: "ghost" }
      ]
    });
  }

  async function onSurveyCreated(survey) {
    sharedSurvey = survey;
    layout.setTokenState(hasAdminToken());
    await refreshSurveys({ render: false });
    renderCurrent();
  }

  async function onSurveyChanged() {
    layout.setTokenState(hasAdminToken());
    await refreshSurveys({ render: false });
    await refreshMeasurements({ render: false });
    renderCurrent();
  }

  function renderCurrent() {
    layout.setTokenState(hasAdminToken());
    layout.setView(currentView);

    if (currentView === "dashboard") {
      renderDashboard(layout.main, {
        measurements: state.measurements,
        loading: measurementsLoading,
        error: state.measurementsError,
        fromCache: state.measurementsFromCache,
        apiConfigured: isApiConfigured(),
        onRefresh: () => refreshMeasurements(),
        onNavigate: view => navigate(view)
      });
      return;
    }

    if (currentView === "encuestas") {
      renderSurveyAdmin(layout.main, {
        surveys: state.surveys,
        loading: surveysLoading,
        error: state.surveysError,
        tokenActive: hasAdminToken(),
        sharedSurvey,
        onRefresh: () => refreshSurveys(),
        onToken: () => handleTokenClick(),
        onCreated: onSurveyCreated,
        onShareClose: () => {
          sharedSurvey = null;
          renderCurrent();
        },
        onChanged: onSurveyChanged
      });
      return;
    }

    if (currentView === "mediciones") {
      renderManualMeasurement(layout.main, {
        apiConfigured: isApiConfigured(),
        onSaved: () => refreshMeasurements()
      });
      return;
    }

    if (currentView === "historial") {
      renderHistory(layout.main, {
        measurements: state.measurements,
        loading: measurementsLoading,
        error: state.measurementsError,
        apiConfigured: isApiConfigured(),
        onRefresh: () => refreshMeasurements()
      });
    }
  }

  onRouteChange(route => {
    if (route.mode !== "admin") {
      window.location.reload();
      return;
    }

    currentView = route.view;
    ensureSurveysLoaded();
    renderCurrent();
  });

  renderCurrent();
  refreshMeasurements();
  ensureSurveysLoaded();
}
