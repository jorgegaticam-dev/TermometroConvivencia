/**
 * TCE v2 · Migración de mediciones válidas
 *
 * Lee la hoja antigua y copia solo filas con curso, fecha,
 * participantes y las 7 dimensiones válidas.
 * La hoja antigua nunca se modifica.
 */

function migrarMedicionesAntiguas() {
  var properties = PropertiesService.getScriptProperties();
  var oldId = properties.getProperty(TCE.PROP_OLD_SPREADSHEET_ID) || TCE.OLD_SPREADSHEET_ID;
  var oldSpreadsheet;

  try {
    oldSpreadsheet = SpreadsheetApp.openById(oldId);
  } catch (error) {
    throw new Error(
      "No se pudo abrir la hoja antigua. Revisa el ID y los permisos: " + error.message
    );
  }

  var oldSheet = oldSpreadsheet.getSheetByName("MEDICIONES");

  if (!oldSheet) {
    throw new Error("La hoja antigua no tiene una pestaña MEDICIONES.");
  }

  var values = oldSheet.getDataRange().getValues();

  if (values.length < 2) {
    Logger.log("La hoja antigua no tiene filas de datos.");
    return { leidas: 0, migradas: 0, omitidas: 0, yaExistentes: 0, motivos: [] };
  }

  var headers = values[0];
  var index = {};

  headers.forEach(function (header, column) {
    var key = normalizeOldHeader_(header);
    if (key && index[key] === undefined) index[key] = column;
  });

  var existing = {};
  readObjects_(TCE.SHEETS.MEDICIONES).forEach(function (row) {
    existing[measurementKey_(row)] = true;
  });

  var report = {
    hojaOrigen: oldSpreadsheet.getName(),
    leidas: values.length - 1,
    migradas: 0,
    omitidas: 0,
    yaExistentes: 0,
    motivos: []
  };

  var migratedKeys = {};

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex];
    var result = convertOldMeasurement_(row, index, headers, rowIndex + 2);

    if (!result.ok) {
      report.omitidas += 1;

      if (report.motivos.length < 60) {
        report.motivos.push({ fila: rowIndex + 1, motivo: result.reason });
      }

      continue;
    }

    var key = measurementKey_(result.medicion);

    if (existing[key] || migratedKeys[key]) {
      report.yaExistentes += 1;
      continue;
    }

    try {
      appendObject_(TCE.SHEETS.MEDICIONES, result.medicion);
      migratedKeys[key] = true;
      report.migradas += 1;
    } catch (error) {
      report.omitidas += 1;

      if (report.motivos.length < 60) {
        report.motivos.push({
          fila: rowIndex + 1,
          motivo: "Error al escribir: " + error.message
        });
      }
    }
  }

  Logger.log("==============================================");
  Logger.log("TCE v2 · Migración finalizada");
  Logger.log(JSON.stringify(report, null, 2));
  Logger.log("==============================================");

  return report;
}

function normalizeOldHeader_(header) {
  return String(header == null ? "" : header)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getOldValue_(row, index, aliases) {
  for (var i = 0; i < aliases.length; i += 1) {
    var key = normalizeOldHeader_(aliases[i]);

    if (index[key] !== undefined) {
      return row[index[key]];
    }
  }

  return "";
}

function normalizeOldCourse_(course) {
  var text = normalizeText_(course, 80)
    .replace(/º/g, "°")
    .replace(/\s+/g, " ");

  if (TCE_COURSES.indexOf(text) !== -1) return text;

  return text;
}

function convertOldMeasurement_(row, index, headers, sheetRow) {
  var hasAnyValue = row.some(function (cell) {
    return String(cell == null ? "" : cell).trim() !== "";
  });

  if (!hasAnyValue) {
    return { ok: false, reason: "Fila vacía." };
  }

  var curso = normalizeOldCourse_(getOldValue_(row, index, ["Curso", "Course"]));

  if (!isValidCourse_(curso)) {
    return {
      ok: false,
      reason: "Curso no reconocido: " + (curso || "(vacío)")
    };
  }

  var fechaRaw = getOldValue_(row, index, [
    "Fecha",
    "FechaMedicion",
    "FechaRegistro",
    "FechaAplicacion"
  ]);

  var fecha = asDateText_(fechaRaw);

  if (!fecha && row.length > 2) {
    fecha = asDateText_(row[2]);
  }

  if (!fecha) {
    return { ok: false, reason: "Fecha inválida." };
  }

  var participantes = toNumber_(getOldValue_(row, index, [
    "Participantes",
    "CantidadParticipantes",
    "TotalParticipantes",
    "Estudiantes"
  ]));

  if (!isIntInRange_(participantes, 1, 1000)) {
    return { ok: false, reason: "Participantes inválidos: " + participantes };
  }

  var dimensiones = {};
  var missing = [];

  TCE_DIMENSIONS.forEach(function (dimension) {
    var value = toNumber_(getOldValue_(row, index, [
      dimension.header,
      dimension.key,
      dimension.label
    ]));

    if (!isValidScale_(value)) {
      missing.push(dimension.label);
    }

    dimensiones[dimension.key] = isValidScale_(value) ? round2_(value) : 0;
  });

  if (missing.length > 0) {
    return {
      ok: false,
      reason: "Dimensiones inválidas: " + missing.join(", ")
    };
  }

  var promedio = toNumber_(getOldValue_(row, index, [
    "Promedio",
    "PromedioGeneral"
  ]));

  if (!isValidScale_(promedio)) {
    promedio = round2_(average_(TCE_DIMENSIONS.map(function (dimension) {
      return dimensiones[dimension.key];
    })));
  }

  var responsable = normalizeText_(getOldValue_(row, index, [
    "Responsable",
    "Profesor",
    "Encargado"
  ]), 80);

  if (!responsable) responsable = "Sin responsable";

  var oldSurveyId = normalizeText_(getOldValue_(row, index, [
    "EncuestaID",
    "CodigoEncuesta",
    "Codigo"
  ]), 20).toUpperCase();

  var measurement = {
    id: Utilities.getUuid(),
    fecha: fecha,
    curso: curso,
    nivel: levelFromCourse_(curso),
    responsable: responsable,
    participantes: Math.round(participantes),
    promedio: round2_(promedio),
    categoria: categoryFromAverage_(promedio),
    encuestaID: oldSurveyId,
    origen: "MIGRADA",
    creadoEn: nowIso_()
  };

  TCE_DIMENSIONS.forEach(function (dimension) {
    measurement[dimension.key] = dimensiones[dimension.key];
  });

  return {
    ok: true,
    medicion: measurement,
    filaOrigen: sheetRow
  };
}

function measurementKey_(row) {
  return [
    asDateText_(row.fecha),
    normalizeText_(row.curso, 80).toUpperCase(),
    normalizeText_(row.responsable, 80).toUpperCase(),
    round2_(row.promedio)
  ].join("|");
}
