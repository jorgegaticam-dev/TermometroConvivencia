/**
 * TCE v2 · Configuración general
 * Apps Script · Google Sheets como fuente de verdad
 */

var TCE = {
  VERSION: "2.0.0",
  SPREADSHEET_NAME: "TCE_BD_v2",
  PROP_SPREADSHEET_ID: "TCE_SPREADSHEET_ID",
  PROP_ADMIN_TOKEN: "TCE_ADMIN_TOKEN",
  PROP_OLD_SPREADSHEET_ID: "TCE_OLD_SPREADSHEET_ID",
  OLD_SPREADSHEET_ID: "1H0pa-zOfqTfy0lLsG6gttFdLAex1SwNV6HV8JP4sT04",

  SHEETS: {
    MEDICIONES: "MEDICIONES",
    ENCUESTAS: "ENCUESTAS",
    RESPUESTAS: "RESPUESTAS"
  },

  ESTADOS: {
    ACTIVA: "ACTIVA",
    CERRADA: "CERRADA",
    PROCESADA: "PROCESADA"
  },

  ADMIN_ACTIONS: [
    "crearEncuesta",
    "listarEncuestas",
    "cerrarEncuesta",
    "procesarEncuesta",
    "guardarMedicionManual"
  ],

  CODE_ALPHABET: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  CODE_LENGTH: 8,
  MAX_PARTICIPANTES: 100,
  MAX_RESPUESTAS_MANUALES: 100,
  LOCK_TIMEOUT_MS: 60000
};

var TCE_DIMENSIONS = [
  { key: "bienestar", header: "Bienestar", label: "Bienestar" },
  { key: "inclusion", header: "Inclusion", label: "Inclusión" },
  { key: "buenTrato", header: "BuenTrato", label: "Buen Trato" },
  { key: "participacion", header: "Participacion", label: "Participación" },
  { key: "seguridad", header: "Seguridad", label: "Seguridad" },
  { key: "pertenencia", header: "Pertenencia", label: "Pertenencia" },
  { key: "relaciones", header: "Relaciones", label: "Relaciones" }
];

var TCE_SCHEMAS = {
  MEDICIONES: [
    { header: "ID", key: "id", type: "text", width: 250 },
    { header: "Fecha", key: "fecha", type: "dateOnly", width: 110 },
    { header: "Curso", key: "curso", type: "text", width: 130 },
    { header: "Nivel", key: "nivel", type: "text", width: 105 },
    { header: "Responsable", key: "responsable", type: "text", width: 170 },
    { header: "Participantes", key: "participantes", type: "number", width: 105 },
    { header: "Promedio", key: "promedio", type: "number", width: 95 },
    { header: "Categoria", key: "categoria", type: "text", width: 120 },
    { header: "Bienestar", key: "bienestar", type: "number", width: 90 },
    { header: "Inclusion", key: "inclusion", type: "number", width: 90 },
    { header: "BuenTrato", key: "buenTrato", type: "number", width: 90 },
    { header: "Participacion", key: "participacion", type: "number", width: 100 },
    { header: "Seguridad", key: "seguridad", type: "number", width: 90 },
    { header: "Pertenencia", key: "pertenencia", type: "number", width: 95 },
    { header: "Relaciones", key: "relaciones", type: "number", width: 90 },
    { header: "EncuestaID", key: "encuestaID", type: "text", width: 105 },
    { header: "Origen", key: "origen", type: "text", width: 95 },
    { header: "CreadoEn", key: "creadoEn", type: "dateText", width: 210 }
  ],

  ENCUESTAS: [
    { header: "ID", key: "id", type: "text", width: 105 },
    { header: "FechaCreacion", key: "fechaCreacion", type: "dateText", width: 210 },
    { header: "Curso", key: "curso", type: "text", width: 130 },
    { header: "Nivel", key: "nivel", type: "text", width: 105 },
    { header: "Responsable", key: "responsable", type: "text", width: 170 },
    { header: "ParticipantesEsperados", key: "participantesEsperados", type: "number", width: 140 },
    { header: "Estado", key: "estado", type: "text", width: 105 },
    { header: "FechaCierre", key: "fechaCierre", type: "dateText", width: 210 },
    { header: "FechaProcesamiento", key: "fechaProcesamiento", type: "dateText", width: 210 },
    { header: "MedicionID", key: "medicionID", type: "text", width: 250 },
    { header: "CreadoPor", key: "creadoPor", type: "text", width: 150 }
  ],

  RESPUESTAS: [
    { header: "ID", key: "id", type: "text", width: 270 },
    { header: "EncuestaID", key: "encuestaID", type: "text", width: 105 },
    { header: "Fecha", key: "fecha", type: "dateText", width: 210 },
    { header: "DeviceHash", key: "deviceHash", type: "text", width: 270 },
    { header: "Bienestar", key: "bienestar", type: "number", width: 90 },
    { header: "Inclusion", key: "inclusion", type: "number", width: 90 },
    { header: "BuenTrato", key: "buenTrato", type: "number", width: 90 },
    { header: "Participacion", key: "participacion", type: "number", width: 100 },
    { header: "Seguridad", key: "seguridad", type: "number", width: 90 },
    { header: "Pertenencia", key: "pertenencia", type: "number", width: 95 },
    { header: "Relaciones", key: "relaciones", type: "number", width: 90 },
    { header: "Promedio", key: "promedio", type: "number", width: 95 }
  ]
};

var TCE_COURSES = [
  "7° Básico A", "7° Básico B", "7° Básico C", "7° Básico D", "7° Básico E",
  "8° Básico A", "8° Básico B", "8° Básico C", "8° Básico D", "8° Básico E", "8° Básico F",
  "1° Medio A", "1° Medio B", "1° Medio C", "1° Medio D", "1° Medio E", "1° Medio F",
  "2° Medio A", "2° Medio B", "2° Medio C", "2° Medio D", "2° Medio E", "2° Medio F",
  "3° Medio A", "3° Medio B", "3° Medio C", "3° Medio D", "3° Medio E", "3° Medio F",
  "4° Medio A", "4° Medio B", "4° Medio C", "4° Medio D", "4° Medio E", "4° Medio F"
];
