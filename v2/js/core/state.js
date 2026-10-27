// ======================================
// ESTADO GLOBAL MÍNIMO
// ======================================

const state = {
  measurements: [],
  surveys: [],
  measurementsLoadedAt: 0,
  surveysLoadedAt: 0
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch || {});
  listeners.forEach(listener => {
    try {
      listener(state);
    } catch (error) {
      console.error("Error en listener de estado:", error);
    }
  });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetState() {
  state.measurements = [];
  state.surveys = [];
  state.measurementsLoadedAt = 0;
  state.surveysLoadedAt = 0;
  setState({});
}
