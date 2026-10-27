/**
 * TCE v2 · Servicio de respuestas anónimas
 */

function saveResponse_(payload) {
  var codigo = String(payload.codigo == null ? "" : payload.codigo).trim().toUpperCase();
  var deviceId = normalizeText_(payload.deviceId, 200);

  if (!codigo) {
    throw new ApiError_("CODIGO_REQUERIDO", "Falta el código de la encuesta.");
  }

  if (deviceId.length < 8) {
    throw new ApiError_(
      "DEVICE_INVALIDO",
      "No se pudo identificar el dispositivo. Recarga la página e intenta nuevamente."
    );
  }

  var clean = validateResponses_(payload.respuestas);
  var deviceHash = sha256Hex_(deviceId);
  var responseId = sha256Hex_(codigo + "|" + deviceHash);

  return withScriptLock_(function () {
    var survey = surveyRowOrThrow_(codigo);

    if (survey.estado === TCE.ESTADOS.PROCESADA) {
      throw new ApiError_(
        "ENCUESTA_PROCESADA",
        "Esta encuesta ya fue procesada y no acepta respuestas."
      );
    }

    if (survey.estado === TCE.ESTADOS.CERRADA) {
      throw new ApiError_(
        "ENCUESTA_CERRADA",
        "Esta encuesta ya está cerrada."
      );
    }

    if (survey.estado !== TCE.ESTADOS.ACTIVA) {
      throw new ApiError_(
        "ENCUESTA_NO_ACTIVA",
        "La encuesta no está aceptando respuestas."
      );
    }

    var responses = readObjects_(TCE.SHEETS.RESPUESTAS)
      .filter(function (response) {
        return String(response.encuestaID || "").toUpperCase() === codigo;
      });

    var existing = responses.filter(function (response) {
      return String(response.id) === responseId;
    })[0];

    if (existing) {
      return {
        duplicado: true,
        recibidas: responses.length
      };
    }

    var response = {
      id: responseId,
      encuestaID: codigo,
      fecha: nowIso_(),
      deviceHash: deviceHash,
      promedio: averageResponseScore_(clean)
    };

    TCE_DIMENSIONS.forEach(function (dimension) {
      response[dimension.key] = clean[dimension.key];
    });

    appendObject_(TCE.SHEETS.RESPUESTAS, response);

    return {
      duplicado: false,
      recibidas: responses.length + 1
    };
  });
}
