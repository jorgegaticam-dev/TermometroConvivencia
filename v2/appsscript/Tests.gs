/**
 * TCE v2 · Pruebas de Apps Script
 * Ejecutar runAllTests() desde el editor.
 */

function runAllTests() {
  var tests = [
    ["scoring", testScoring_],
    ["umbrales", testThresholds_],
    ["nivel de curso", testLevel_],
    ["validación de cursos", testCourses_],
    ["código de encuesta", testSurveyCode_],
    ["hash de dispositivo", testDeviceHash_],
    ["esquema de hojas", testSchema_],
    ["respuesta inválida", testInvalidResponse_],
    ["DTO de medición", testMeasurementDto_],
    ["token inválido", testInvalidToken_],
    ["ping", testPing_]
  ];

  var passed = 0;
  var failed = 0;
  var failures = [];

  tests.forEach(function (test) {
    try {
      test[1]();
      passed += 1;
      Logger.log("PASS · " + test[0]);
    } catch (error) {
      failed += 1;
      failures.push(test[0] + ": " + error.message);
      Logger.log("FAIL · " + test[0] + " → " + error.message);
    }
  });

  Logger.log("==============================================");
  Logger.log("TCE v2 · Pruebas: " + passed + " correctas, " + failed + " fallidas");

  if (failures.length > 0) {
    throw new Error("Pruebas fallidas:\n" + failures.join("\n"));
  }

  return { ok: true, passed: passed, failed: failed };
}

function testScoring_() {
  var response = {
    bienestar: 4,
    inclusion: 4,
    buenTrato: 4,
    participacion: 4,
    seguridad: 4,
    pertenencia: 4,
    relaciones: 4
  };

  var result = aggregateResponses_([response, response]);

  assertEqual_(result.promedio, 4);
  assertEqual_(result.categoria, "DESARROLLO");
  assertEqual_(result.dimensiones.bienestar, 4);
  assertEqual_(result.participantes, 2);
}

function testThresholds_() {
  assertEqual_(categoryFromAverage_(4.1), "FORTALECIDA");
  assertEqual_(categoryFromAverage_(4.09), "DESARROLLO");
  assertEqual_(categoryFromAverage_(3.1), "DESARROLLO");
  assertEqual_(categoryFromAverage_(3.09), "ALERTA");
  assertEqual_(categoryFromAverage_(2.1), "ALERTA");
  assertEqual_(categoryFromAverage_(2.09), "CRITICA");
  assertEqual_(categoryFromAverage_(0), "");
}

function testLevel_() {
  assertEqual_(levelFromCourse_("7° Básico A"), "7° Básico");
  assertEqual_(levelFromCourse_("4° Medio C"), "4° Medio");
  assertEqual_(levelFromCourse_("Curso especial"), "Otro");
}

function testCourses_() {
  assertTrue_(isValidCourse_("7° Básico A"));
  assertTrue_(isValidCourse_("4° Medio F"));
  assertTrue_(!isValidCourse_("Curso inventado"));
  assertTrue_(!isValidCourse_(""));
}

function testSurveyCode_() {
  var code = generateSurveyCode_();
  assertEqual_(code.length, TCE.CODE_LENGTH);
  assertTrue_(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(code));

  var codes = {};
  for (var index = 0; index < 40; index += 1) {
    codes[generateSurveyCode_()] = true;
  }
  assertTrue_(Object.keys(codes).length > 30);
}

function testDeviceHash_() {
  var first = sha256Hex_("dispositivo-1");
  var second = sha256Hex_("dispositivo-1");
  var other = sha256Hex_("dispositivo-2");

  assertEqual_(first.length, 64);
  assertEqual_(first, second);
  assertTrue_(first !== other);
}

function testSchema_() {
  var expected = {
    MEDICIONES: 18,
    ENCUESTAS: 11,
    RESPUESTAS: 12
  };

  Object.keys(expected).forEach(function (name) {
    var schema = TCE_SCHEMAS[name];
    assertTrue_(Array.isArray(schema));
    assertEqual_(schema.length, expected[name]);

    var headers = schema.map(function (field) { return field.header; });
    var unique = headers.filter(function (header, index) {
      return headers.indexOf(header) === index;
    });

    assertEqual_(unique.length, headers.length);
  });
}

function testInvalidResponse_() {
  assertThrowsCode_(function () {
    validateResponses_({
      bienestar: 6,
      inclusion: 3,
      buenTrato: 4,
      participacion: 4,
      seguridad: 4,
      pertenencia: 4,
      relaciones: 4
    });
  }, "RESPUESTA_INVALIDA");

  assertThrowsCode_(function () {
    validateResponses_({
      bienestar: 4,
      inclusion: 3
    });
  }, "RESPUESTA_INVALIDA");
}

function testMeasurementDto_() {
  var dto = measurementDto_({
    id: "medicion-1",
    fecha: "2026-10-26",
    curso: "7° Básico A",
    nivel: "7° Básico",
    responsable: "Encargado",
    participantes: 30,
    promedio: 3.42,
    categoria: "DESARROLLO",
    bienestar: 3.6,
    inclusion: 3.4,
    buenTrato: 3.2,
    participacion: 3.1,
    seguridad: 3.5,
    pertenencia: 3.4,
    relaciones: 3.7,
    encuestaID: "AB12CD34",
    origen: "ENCUESTA",
    creadoEn: "2026-10-26T12:00:00.000Z"
  });

  assertEqual_(dto.curso, "7° Básico A");
  assertEqual_(dto.promedio, 3.42);
  assertEqual_(dto.dimensiones.bienestar, 3.6);
  assertEqual_(dto.encuestaID, "AB12CD34");
}

function testInvalidToken_() {
  var response = routeRequest_({
    parameter: {
      accion: "crearEncuesta",
      token: "token-incorrecto"
    }
  }, "GET");

  var payload = JSON.parse(response.getContent());

  assertEqual_(payload.ok, false);
  assertTrue_(
    payload.error.code === "NO_AUTORIZADO" ||
    payload.error.code === "TOKEN_NO_CONFIGURADO"
  );
}

function testPing_() {
  var spreadsheetId = PropertiesService
    .getScriptProperties()
    .getProperty(TCE.PROP_SPREADSHEET_ID);

  if (!spreadsheetId) {
    Logger.log("SKIP · ping (ejecuta setup() primero)");
    return;
  }

  var result = ping_();
  assertEqual_(result.estado, "OK");
  assertEqual_(result.version, TCE.VERSION);
}

function assertEqual_(actual, expected) {
  var actualText = typeof actual === "object" ? JSON.stringify(actual) : String(actual);
  var expectedText = typeof expected === "object" ? JSON.stringify(expected) : String(expected);

  if (actualText !== expectedText) {
    throw new Error("Esperado " + expectedText + ", recibido " + actualText);
  }
}

function assertTrue_(condition) {
  if (!condition) {
    throw new Error("Se esperaba una condición verdadera.");
  }
}

function assertThrowsCode_(fn, expectedCode) {
  try {
    fn();
  } catch (error) {
    if (error instanceof ApiError_) {
      assertEqual_(error.code, expectedCode);
      return;
    }
    throw error;
  }

  throw new Error("Se esperaba un error " + expectedCode + " y no ocurrió.");
}
