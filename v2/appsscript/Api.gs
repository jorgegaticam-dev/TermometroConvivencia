/**
 * TCE v2 · Router HTTP
 *
 * GET  ?accion=ping
 * GET  ?accion=obtenerEncuesta&codigo=ABCD1234
 * GET  ?accion=listarMediciones
 * POST { accion, token, ... }
 */

function doGet(e) {
  return routeRequest_(e, "GET");
}

function doPost(e) {
  return routeRequest_(e, "POST");
}

function routeRequest_(e, method) {
  try {
    var params = (e && e.parameter) || {};
    var payload = method === "POST" ? parseJsonBody_(e) : {};
    var accion = String(
      (payload.accion || params.accion || "")
    ).trim();

    if (!accion) {
      throw new ApiError_(
        "ACCION_REQUERIDA",
        "Indica la acción a ejecutar, por ejemplo ?accion=ping."
      );
    }

    if (TCE.ADMIN_ACTIONS.indexOf(accion) !== -1) {
      requireToken_(payload.token || params.token);
    }

    var data;

    switch (accion) {
      case "ping":
        data = ping_();
        break;

      case "obtenerEncuesta":
        data = {
          encuesta: getSurvey_(params.codigo || payload.codigo)
        };
        break;

      case "listarMediciones":
        data = {
          mediciones: listMeasurements_()
        };
        break;

      case "crearEncuesta":
        data = createSurvey_(payload);
        break;

      case "listarEncuestas":
        data = {
          encuestas: listSurveys_()
        };
        break;

      case "cerrarEncuesta":
        data = closeSurvey_(payload.codigo);
        break;

      case "procesarEncuesta":
        data = processSurvey_(payload.codigo);
        break;

      case "guardarRespuesta":
        data = saveResponse_(payload);
        break;

      case "guardarMedicionManual":
        data = saveManualMeasurement_(payload);
        break;

      default:
        throw new ApiError_(
          "ACCION_NO_RECONOCIDA",
          "La acción “" + accion + "” no existe."
        );
    }

    return jsonOut_(Object.assign({ ok: true }, data));
  } catch (error) {
    if (error instanceof ApiError_) {
      return jsonOut_({
        ok: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    logError_(method, error);

    return jsonOut_({
      ok: false,
      error: {
        code: "ERROR_INTERNO",
        message: "Ocurrió un error inesperado. Revisa el registro de Apps Script."
      }
    });
  }
}

function ping_() {
  var spreadsheet = getSpreadsheet_();

  Object.keys(TCE_SCHEMAS).forEach(function (sheetName) {
    getSheet_(sheetName);
  });

  return {
    version: TCE.VERSION,
    ahora: nowIso_(),
    hoja: spreadsheet.getName(),
    estado: "OK"
  };
}
