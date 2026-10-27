/**
 * TCE v2 · Servicio de encuestas
 */

function surveyDto_(row, responses) {
  return {
    id: String(row.id || "").toUpperCase(),
    fechaCreacion: asIsoText_(row.fechaCreacion),
    curso: String(row.curso || ""),
    nivel: String(row.nivel || ""),
    responsable: String(row.responsable || ""),
    participantesEsperados: Number(row.participantesEsperados) || 0,
    estado: String(row.estado || TCE.ESTADOS.ACTIVA).toUpperCase(),
    fechaCierre: asIsoText_(row.fechaCierre),
    fechaProcesamiento: asIsoText_(row.fechaProcesamiento),
    medicionID: String(row.medicionID || ""),
    respuestasRecibidas: Number(responses) || 0
  };
}

function surveyRowOrThrow_(codigo) {
  var code = String(codigo == null ? "" : codigo).trim().toUpperCase();

  if (!code) {
    throw new ApiError_("CODIGO_REQUERIDO", "Falta el código de la encuesta.");
  }

  var row = findObject_(TCE.SHEETS.ENCUESTAS, "id", code);

  if (!row) {
    throw new ApiError_(
      "ENCUESTA_NO_ENCONTRADA",
      "No existe una encuesta con el código " + code + "."
    );
  }

  return row;
}

function generateUniqueSurveyCode_() {
  var existing = {};
  var rows = readObjects_(TCE.SHEETS.ENCUESTAS);

  rows.forEach(function (row) {
    existing[String(row.id || "").toUpperCase()] = true;
  });

  for (var attempt = 0; attempt < 30; attempt += 1) {
    var code = generateSurveyCode_();
    if (!existing[code]) return code;
  }

  throw new ApiError_(
    "CODIGO_NO_DISPONIBLE",
    "No se pudo generar un código único. Intenta nuevamente."
  );
}

function createSurvey_(payload) {
  return withScriptLock_(function () {
    var curso = normalizeText_(payload.curso, 80);
    var responsable = normalizeText_(payload.responsable, 80);
    var participantes = Number(payload.participantes);

    if (!isValidCourse_(curso)) {
      throw new ApiError_("CURSO_INVALIDO", "El curso no está en la lista permitida.");
    }

    if (responsable.length < 2) {
      throw new ApiError_("RESPONSABLE_REQUERIDO", "Ingresa el nombre del responsable.");
    }

    if (!isIntInRange_(participantes, 1, TCE.MAX_PARTICIPANTES)) {
      throw new ApiError_(
        "PARTICIPANTES_INVALIDOS",
        "Los participantes deben ser un entero entre 1 y " + TCE.MAX_PARTICIPANTES + "."
      );
    }

    var row = {
      id: generateUniqueSurveyCode_(),
      fechaCreacion: nowIso_(),
      curso: curso,
      nivel: levelFromCourse_(curso),
      responsable: responsable,
      participantesEsperados: participantes,
      estado: TCE.ESTADOS.ACTIVA,
      fechaCierre: "",
      fechaProcesamiento: "",
      medicionID: "",
      creadoPor: normalizeText_(payload.creadoPor || "Administrador", 60)
    };

    var fila = appendObject_(TCE.SHEETS.ENCUESTAS, row);

    return {
      encuesta: surveyDto_(row, 0),
      fila: fila
    };
  });
}

function getSurvey_(codigo) {
  var row = surveyRowOrThrow_(codigo);
  var responses = countBy_(TCE.SHEETS.RESPUESTAS, "encuestaID", row.id);
  return surveyDto_(row, responses);
}

function listSurveys_() {
  var responses = readObjects_(TCE.SHEETS.RESPUESTAS);
  var counts = {};

  responses.forEach(function (response) {
    var code = String(response.encuestaID || "").toUpperCase();
    counts[code] = (counts[code] || 0) + 1;
  });

  return readObjects_(TCE.SHEETS.ENCUESTAS)
    .map(function (row) {
      return surveyDto_(row, counts[String(row.id || "").toUpperCase()] || 0);
    })
    .sort(function (a, b) {
      return String(b.fechaCreacion).localeCompare(String(a.fechaCreacion));
    });
}

function closeSurvey_(codigo) {
  return withScriptLock_(function () {
    var row = surveyRowOrThrow_(codigo);
    var code = String(row.id).toUpperCase();
    var received = countBy_(TCE.SHEETS.RESPUESTAS, "encuestaID", code);

    if (row.estado === TCE.ESTADOS.PROCESADA) {
      return {
        encuesta: surveyDto_(row, received),
        yaProcesada: true
      };
    }

    if (row.estado === TCE.ESTADOS.CERRADA) {
      return {
        encuesta: surveyDto_(row, received),
        yaCerrada: true
      };
    }

    var patch = {
      estado: TCE.ESTADOS.CERRADA,
      fechaCierre: nowIso_()
    };

    updateObject_(TCE.SHEETS.ENCUESTAS, row._row, patch);

    row.estado = patch.estado;
    row.fechaCierre = patch.fechaCierre;

    return {
      encuesta: surveyDto_(row, received),
      yaCerrada: false
    };
  });
}

function processSurvey_(codigo) {
  return withScriptLock_(function () {
    var row = surveyRowOrThrow_(codigo);
    var code = String(row.id).toUpperCase();
    var existing = findObject_(TCE.SHEETS.MEDICIONES, "encuestaID", code);

    if (existing) {
      var existingPatch = {
        estado: TCE.ESTADOS.PROCESADA,
        fechaProcesamiento: row.fechaProcesamiento || nowIso_(),
        medicionID: existing.id
      };

      updateObject_(TCE.SHEETS.ENCUESTAS, row._row, existingPatch);
      Object.assign(row, existingPatch);

      return {
        encuesta: surveyDto_(row, countBy_(TCE.SHEETS.RESPUESTAS, "encuestaID", code)),
        medicion: measurementDto_(existing),
        yaExistia: true
      };
    }

    var responses = readObjects_(TCE.SHEETS.RESPUESTAS)
      .filter(function (response) {
        return String(response.encuestaID || "").toUpperCase() === code;
      });

    if (responses.length === 0) {
      throw new ApiError_(
        "SIN_RESPUESTAS",
        "La encuesta no tiene respuestas para procesar."
      );
    }

    var aggregate = aggregateResponses_(responses);

    var measurement = {
      id: Utilities.getUuid(),
      fecha: todayIsoDate_(),
      curso: row.curso,
      nivel: row.nivel || levelFromCourse_(row.curso),
      responsable: row.responsable,
      participantes: responses.length,
      promedio: aggregate.promedio,
      categoria: aggregate.categoria,
      encuestaID: code,
      origen: "ENCUESTA",
      creadoEn: nowIso_()
    };

    TCE_DIMENSIONS.forEach(function (dimension) {
      measurement[dimension.key] = aggregate.dimensiones[dimension.key];
    });

    var fila = appendObject_(TCE.SHEETS.MEDICIONES, measurement);

    var patch = {
      estado: TCE.ESTADOS.PROCESADA,
      fechaProcesamiento: nowIso_(),
      medicionID: measurement.id
    };

    updateObject_(TCE.SHEETS.ENCUESTAS, row._row, patch);
    Object.assign(row, patch);

    return {
      encuesta: surveyDto_(row, responses.length),
      medicion: measurementDto_(measurement),
      filaMedicion: fila,
      yaExistia: false
    };
  });
}

function saveManualMeasurement_(payload) {
  return withScriptLock_(function () {
    var curso = normalizeText_(payload.curso, 80);
    var responsable = normalizeText_(payload.responsable, 80);
    var fecha = payload.fecha ? asDateText_(payload.fecha) : todayIsoDate_();
    var rows = Array.isArray(payload.respuestas) ? payload.respuestas : [];

    if (!isValidCourse_(curso)) {
      throw new ApiError_("CURSO_INVALIDO", "El curso no está en la lista permitida.");
    }

    if (responsable.length < 2) {
      throw new ApiError_("RESPONSABLE_REQUERIDO", "Ingresa el nombre del responsable.");
    }

    if (!fecha) {
      throw new ApiError_("FECHA_INVALIDA", "La fecha de la medición no es válida.");
    }

    if (rows.length === 0) {
      throw new ApiError_("SIN_RESPUESTAS", "Agrega al menos una fila de respuestas.");
    }

    if (rows.length > TCE.MAX_RESPUESTAS_MANUALES) {
      throw new ApiError_(
        "DEMASIADAS_RESPUESTAS",
        "El máximo es " + TCE.MAX_RESPUESTAS_MANUALES + " estudiantes por medición."
      );
    }

    var cleanRows = rows.map(function (response, index) {
      try {
        return validateResponses_(response);
      } catch (error) {
        if (error instanceof ApiError_) {
          throw new ApiError_(
            error.code,
            "Fila " + (index + 1) + ": " + error.message
          );
        }
        throw error;
      }
    });

    var aggregate = aggregateResponses_(cleanRows);

    var measurement = {
      id: Utilities.getUuid(),
      fecha: fecha,
      curso: curso,
      nivel: levelFromCourse_(curso),
      responsable: responsable,
      participantes: cleanRows.length,
      promedio: aggregate.promedio,
      categoria: aggregate.categoria,
      encuestaID: "",
      origen: "MANUAL",
      creadoEn: nowIso_()
    };

    TCE_DIMENSIONS.forEach(function (dimension) {
      measurement[dimension.key] = aggregate.dimensiones[dimension.key];
    });

    var fila = appendObject_(TCE.SHEETS.MEDICIONES, measurement);

    return {
      medicion: measurementDto_(measurement),
      fila: fila
    };
  });
}
