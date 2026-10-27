/**
 * TCE v2 · Inicialización de la base
 */

function setup() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty(TCE.PROP_SPREADSHEET_ID);
  var spreadsheet = null;
  var created = false;

  if (spreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      Logger.log(
        "No se pudo abrir la hoja configurada (" + spreadsheetId + "). " +
        "Se creará una nueva."
      );
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(TCE.SPREADSHEET_NAME);
    spreadsheetId = spreadsheet.getId();
    properties.setProperty(TCE.PROP_SPREADSHEET_ID, spreadsheetId);
    created = true;
  }

  Object.keys(TCE_SCHEMAS).forEach(function (sheetName) {
    ensureSheet_(spreadsheet, sheetName);
  });

  removeDefaultSheet_(spreadsheet);

  var token = properties.getProperty(TCE.PROP_ADMIN_TOKEN);
  var tokenCreated = false;

  if (!token) {
    token = generateAdminToken_();
    properties.setProperty(TCE.PROP_ADMIN_TOKEN, token);
    tokenCreated = true;
  }

  Logger.log("==============================================");
  Logger.log("TCE v2 · Configuración completada");
  Logger.log("Hoja: " + spreadsheet.getName());
  Logger.log("URL: " + spreadsheet.getUrl());
  Logger.log("ID: " + spreadsheetId);
  Logger.log("Hojas: " + Object.keys(TCE_SCHEMAS).join(", "));
  Logger.log("Token administrativo: " + token);
  Logger.log(
    tokenCreated
      ? "Guarda este token. No se vuelve a mostrar completo."
      : "El token ya existía; se mantiene el actual."
  );
  Logger.log("==============================================");

  return {
    ok: true,
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: spreadsheet.getUrl(),
    spreadsheetName: spreadsheet.getName(),
    token: token,
    tokenCreated: tokenCreated,
    created: created,
    sheets: Object.keys(TCE_SCHEMAS)
  };
}

function resetAdminToken() {
  var token = generateAdminToken_();

  PropertiesService
    .getScriptProperties()
    .setProperty(TCE.PROP_ADMIN_TOKEN, token);

  Logger.log("Nuevo token administrativo: " + token);

  return { ok: true, token: token };
}

function setupStatus() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty(TCE.PROP_SPREADSHEET_ID);
  var token = properties.getProperty(TCE.PROP_ADMIN_TOKEN);

  var result = {
    version: TCE.VERSION,
    spreadsheetConfigured: Boolean(spreadsheetId),
    spreadsheetId: spreadsheetId || "",
    tokenConfigured: Boolean(token),
    sheets: []
  };

  if (spreadsheetId) {
    try {
      var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      result.spreadsheetName = spreadsheet.getName();
      result.spreadsheetUrl = spreadsheet.getUrl();
      result.sheets = spreadsheet.getSheets().map(function (sheet) {
        return sheet.getName();
      });
    } catch (error) {
      result.spreadsheetError = error.message;
    }
  }

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
