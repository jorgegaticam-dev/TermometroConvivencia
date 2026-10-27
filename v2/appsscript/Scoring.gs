/**
 * TCE v2 · Cálculos de dominio
 */

function levelFromCourse_(course) {
  var normalized = String(course == null ? "" : course)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  var match = normalized.match(/^(\d)°\s*(Basico|Medio)/i);

  if (!match) return "Otro";

  var type = match[2].toLowerCase() === "basico" ? "Básico" : "Medio";
  return match[1] + "° " + type;
}

function categoryFromAverage_(average) {
  var value = Number(average);

  if (!isFinite(value) || value <= 0) return "";
  if (value >= 4.1) return "FORTALECIDA";
  if (value >= 3.1) return "DESARROLLO";
  if (value >= 2.1) return "ALERTA";
  return "CRITICA";
}

function validateResponses_(respuestas) {
  if (!respuestas || typeof respuestas !== "object" || Array.isArray(respuestas)) {
    throw new ApiError_("RESPUESTA_INVALIDA", "Las respuestas no tienen el formato esperado.");
  }

  var clean = {};

  TCE_DIMENSIONS.forEach(function (dimension) {
    var value = Number(respuestas[dimension.key]);

    if (!isValidScore_(value)) {
      throw new ApiError_(
        "RESPUESTA_INVALIDA",
        "La dimensión " + dimension.label + " debe ser un entero entre 1 y 5."
      );
    }

    clean[dimension.key] = value;
  });

  return clean;
}

function aggregateResponses_(responses) {
  var list = Array.isArray(responses) ? responses : [];
  var dimensiones = {};

  TCE_DIMENSIONS.forEach(function (dimension) {
    var values = list
      .map(function (response) { return Number(response && response[dimension.key]); })
      .filter(isValidScore_);

    dimensiones[dimension.key] = values.length > 0
      ? round2_(average_(values))
      : 0;
  });

  var validDimensions = TCE_DIMENSIONS
    .map(function (dimension) { return dimensiones[dimension.key]; })
    .filter(function (value) { return value > 0; });

  var promedio = validDimensions.length > 0
    ? round2_(average_(validDimensions))
    : 0;

  return {
    dimensiones: dimensiones,
    promedio: promedio,
    categoria: categoryFromAverage_(promedio),
    participantes: list.length
  };
}

function averageResponseScore_(response) {
  var values = TCE_DIMENSIONS
    .map(function (dimension) { return Number(response[dimension.key]); })
    .filter(isValidScore_);

  return values.length > 0 ? round2_(average_(values)) : 0;
}
