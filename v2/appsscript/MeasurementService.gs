/**
 * TCE v2 · Servicio de mediciones agregadas
 */

function measurementDto_(row) {
  var dimensiones = {};

  TCE_DIMENSIONS.forEach(function (dimension) {
    var value = Number(row[dimension.key]);
    dimensiones[dimension.key] = isValidScale_(value) ? round2_(value) : 0;
  });

  var promedio = Number(row.promedio);

  if (!isValidScale_(promedio)) {
    var valid = TCE_DIMENSIONS
      .map(function (dimension) { return dimensiones[dimension.key]; })
      .filter(function (value) { return value > 0; });

    promedio = valid.length > 0 ? round2_(average_(valid)) : 0;
  }

  var categoria = String(row.categoria || "").toUpperCase();

  if (!categoria) {
    categoria = categoryFromAverage_(promedio);
  }

  return {
    id: String(row.id || ""),
    fecha: asDateText_(row.fecha),
    curso: String(row.curso || ""),
    nivel: String(row.nivel || levelFromCourse_(row.curso)),
    responsable: String(row.responsable || ""),
    participantes: Number(row.participantes) || 0,
    promedio: round2_(promedio),
    categoria: categoria,
    dimensiones: dimensiones,
    encuestaID: String(row.encuestaID || ""),
    origen: String(row.origen || ""),
    creadoEn: asIsoText_(row.creadoEn)
  };
}

function listMeasurements_() {
  return readObjects_(TCE.SHEETS.MEDICIONES)
    .map(measurementDto_)
    .sort(function (a, b) {
      var dateDiff = String(b.fecha).localeCompare(String(a.fecha));
      if (dateDiff !== 0) return dateDiff;
      return String(b.creadoEn).localeCompare(String(a.creadoEn));
    });
}
