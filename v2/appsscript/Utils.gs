/**
 * TCE v2 · Utilidades compartidas
 */

class ApiError_ extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ApiError_";
    this.code = code;
  }
}

function jsonOut_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowIso_() {
  return new Date().toISOString();
}

function todayIsoDate_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
}

function pad2_(value) {
  return String(value).padStart(2, "0");
}

function asDateText_(value) {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "";
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  var text = String(value == null ? "" : value).trim();
  if (!text) return "";

  var iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];

  var dmy = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    return dmy[3] + "-" + pad2_(dmy[2]) + "-" + pad2_(dmy[1]);
  }

  var date = new Date(text);
  if (!isNaN(date.getTime())) {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return "";
}

function asIsoText_(value) {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "";
    return value.toISOString();
  }

  var text = String(value == null ? "" : value).trim();
  return text;
}

function toNumber_(value) {
  if (typeof value === "number") return value;
  var text = String(value == null ? "" : value).trim();
  if (!text || text === "#NUM!" || text === "#N/A") return NaN;
  return Number(text.replace(",", "."));
}

function round2_(value) {
  var number = Number(value);
  if (!isFinite(number)) return 0;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

function average_(values) {
  var numbers = values
    .map(toNumber_)
    .filter(function (value) { return isFinite(value); });

  if (numbers.length === 0) return 0;

  var sum = numbers.reduce(function (total, value) { return total + value; }, 0);
  return sum / numbers.length;
}

function isValidScore_(value) {
  var number = Number(value);
  return isFinite(number) && Math.floor(number) === number && number >= 1 && number <= 5;
}

function isValidScale_(value) {
  var number = Number(value);
  return isFinite(number) && number >= 1 && number <= 5;
}

function normalizeText_(value, maxLength) {
  var text = String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim();

  if (maxLength && text.length > maxLength) {
    text = text.slice(0, maxLength);
  }

  return text;
}

function isIntInRange_(value, min, max) {
  var number = Number(value);
  return isFinite(number) &&
    Math.floor(number) === number &&
    number >= min &&
    number <= max;
}

function isValidCourse_(course) {
  return TCE_COURSES.indexOf(normalizeText_(course, 80)) !== -1;
}

function generateSurveyCode_() {
  var code = "";

  for (var index = 0; index < TCE.CODE_LENGTH; index += 1) {
    var position = Math.floor(Math.random() * TCE.CODE_ALPHABET.length);
    code += TCE.CODE_ALPHABET.charAt(position);
  }

  return code;
}

function generateAdminToken_() {
  return Utilities.getUuid().replace(/-/g, "") +
    Utilities.getUuid().replace(/-/g, "").slice(0, 12);
}

function sha256Hex_(text) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text),
    Utilities.Charset.UTF_8
  );

  return bytes.map(function (byte) {
    var value = (byte < 0 ? byte + 256 : byte).toString(16);
    return value.length === 1 ? "0" + value : value;
  }).join("");
}

function getAdminToken_() {
  return PropertiesService
    .getScriptProperties()
    .getProperty(TCE.PROP_ADMIN_TOKEN) || "";
}

function requireToken_(token) {
  var expected = getAdminToken_();

  if (!expected) {
    throw new ApiError_(
      "TOKEN_NO_CONFIGURADO",
      "No hay token configurado. Ejecuta setup() en Apps Script."
    );
  }

  if (!token || String(token).trim() !== expected) {
    throw new ApiError_(
      "NO_AUTORIZADO",
      "Token administrativo inválido o ausente."
    );
  }
}

function withScriptLock_(fn) {
  var lock = LockService.getScriptLock();

  if (!lock.tryLock(TCE.LOCK_TIMEOUT_MS)) {
    throw new ApiError_(
      "SISTEMA_OCUPADO",
      "El sistema está procesando otra solicitud. Intenta nuevamente."
    );
  }

  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function parseJsonBody_(e) {
  var contents = e && e.postData && e.postData.contents;

  if (!contents) {
    throw new ApiError_("CUERPO_VACIO", "No se recibieron datos.");
  }

  var data;

  try {
    data = JSON.parse(contents);
  } catch (error) {
    throw new ApiError_("JSON_INVALIDO", "El cuerpo de la solicitud no es JSON válido.");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ApiError_("JSON_INVALIDO", "El cuerpo debe ser un objeto JSON.");
  }

  return data;
}

function logError_(context, error) {
  Logger.log(
    "[TCE " + context + "] " +
    (error && error.stack ? error.stack : String(error))
  );
}
