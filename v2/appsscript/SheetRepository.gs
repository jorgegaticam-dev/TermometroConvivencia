/**
 * TCE v2 · Acceso a Google Sheets por encabezados
 * No se depende del orden de columnas al leer.
 */

function getSpreadsheet_() {
  var id = PropertiesService
    .getScriptProperties()
    .getProperty(TCE.PROP_SPREADSHEET_ID);

  if (!id) {
    throw new ApiError_(
      "BASE_NO_CONFIGURADA",
      "No hay una base configurada. Ejecuta setup() en Apps Script."
    );
  }

  try {
    return SpreadsheetApp.openById(id);
  } catch (error) {
    throw new ApiError_(
      "BASE_NO_ACCESIBLE",
      "No se pudo abrir la hoja TCE_BD_v2. Revisa permisos o vuelve a ejecutar setup()."
    );
  }
}

function schemaFor_(sheetName) {
  var schema = TCE_SCHEMAS[sheetName];

  if (!schema) {
    throw new ApiError_("HOJA_NO_EXISTE", "No hay esquema definido para " + sheetName + ".");
  }

  return schema;
}

function getSheet_(sheetName) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);

  if (!sheet) {
    throw new ApiError_(
      "HOJA_NO_EXISTE",
      "Falta la pestaña " + sheetName + " en la hoja de cálculo."
    );
  }

  return sheet;
}

function headersOf_(sheet) {
  var lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) return [];

  return sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(function (header) { return String(header || "").trim(); });
}

function assertSchema_(sheet, schema) {
  var headers = headersOf_(sheet);

  var missing = schema
    .map(function (field) { return field.header; })
    .filter(function (header) { return headers.indexOf(header) === -1; });

  if (missing.length > 0) {
    throw new ApiError_(
      "ESQUEMA_INVALIDO",
      "La pestaña " + sheet.getName() + " no tiene las columnas: " + missing.join(", ") + "."
    );
  }

  return headers;
}

function serializeValue_(field, value) {
  if (value === null || value === undefined) return "";

  if (field.type === "number") {
    if (value === "") return "";
    var number = toNumber_(value);
    return isFinite(number) ? number : "";
  }

  if (field.type === "dateOnly") {
    return asDateText_(value);
  }

  if (field.type === "dateText") {
    return asIsoText_(value);
  }

  if (value instanceof Date) {
    return asIsoText_(value);
  }

  return String(value);
}

function deserializeValue_(field, value) {
  if (field.type === "number") {
    if (value === "" || value === null || value === undefined) return "";
    var number = toNumber_(value);
    return isFinite(number) ? number : "";
  }

  if (field.type === "dateOnly") {
    return asDateText_(value);
  }

  if (field.type === "dateText") {
    return asIsoText_(value);
  }

  if (value instanceof Date) {
    return asIsoText_(value);
  }

  return String(value == null ? "" : value).trim();
}

function readObjects_(sheetName) {
  var schema = schemaFor_(sheetName);
  var sheet = getSheet_(sheetName);
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  var headers = assertSchema_(sheet, schema);
  var lastColumn = headers.length;
  var values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  var objects = [];

  values.forEach(function (row, rowIndex) {
    var object = { _row: rowIndex + 2 };
    var hasValue = false;

    schema.forEach(function (field) {
      var columnIndex = headers.indexOf(field.header);
      var parsed = deserializeValue_(field, row[columnIndex]);
      object[field.key] = parsed;

      if (String(parsed).trim() !== "") hasValue = true;
    });

    if (hasValue) objects.push(object);
  });

  return objects;
}

function appendObject_(sheetName, object) {
  var schema = schemaFor_(sheetName);
  var sheet = getSheet_(sheetName);
  assertSchema_(sheet, schema);

  var rowNumber = sheet.getLastRow() + 1;
  var row = schema.map(function (field) {
    return serializeValue_(field, object[field.key]);
  });

  sheet.getRange(rowNumber, 1, 1, schema.length).setValues([row]);
  return rowNumber;
}

function updateObject_(sheetName, rowNumber, patch) {
  var schema = schemaFor_(sheetName);
  var sheet = getSheet_(sheetName);
  var headers = assertSchema_(sheet, schema);

  schema.forEach(function (field) {
    if (!Object.prototype.hasOwnProperty.call(patch, field.key)) return;

    var columnNumber = headers.indexOf(field.header) + 1;
    sheet
      .getRange(rowNumber, columnNumber)
      .setValue(serializeValue_(field, patch[field.key]));
  });
}

function findObject_(sheetName, key, value) {
  var normalized = String(value == null ? "" : value).trim();
  var rows = readObjects_(sheetName);

  for (var index = 0; index < rows.length; index += 1) {
    if (String(rows[index][key] == null ? "" : rows[index][key]).trim() === normalized) {
      return rows[index];
    }
  }

  return null;
}

function countBy_(sheetName, key, value) {
  var normalized = String(value == null ? "" : value).trim();
  var rows = readObjects_(sheetName);
  var count = 0;

  rows.forEach(function (row) {
    if (String(row[key] == null ? "" : row[key]).trim() === normalized) {
      count += 1;
    }
  });

  return count;
}

function ensureSheet_(spreadsheet, sheetName) {
  var schema = schemaFor_(sheetName);
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, schema.length).setValues([
      schema.map(function (field) { return field.header; })
    ]);
  } else {
    assertSchema_(sheet, schema);
  }

  var headerRange = sheet.getRange(1, 1, 1, schema.length);
  headerRange
    .setBackground("#234F3A")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setVerticalAlignment("middle");

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);

  var dataRows = Math.max(sheet.getMaxRows() - 1, 1);

  schema.forEach(function (field, index) {
    if (field.type === "dateOnly" || field.type === "dateText") {
      sheet.getRange(2, index + 1, dataRows, 1).setNumberFormat("@");
    }

    if (field.width) {
      sheet.setColumnWidth(index + 1, field.width);
    }
  });

  return sheet;
}

function removeDefaultSheet_(spreadsheet) {
  var reserved = Object.keys(TCE.SHEETS).map(function (key) {
    return TCE.SHEETS[key];
  });

  var candidates = ["Hoja 1", "Hoja1", "Sheet1"];

  if (spreadsheet.getSheets().length <= 1) return;

  candidates.forEach(function (name) {
    var sheet = spreadsheet.getSheetByName(name);

    if (
      sheet &&
      reserved.indexOf(name) === -1 &&
      sheet.getLastRow() <= 1 &&
      spreadsheet.getSheets().length > 1
    ) {
      spreadsheet.deleteSheet(sheet);
    }
  });
}
