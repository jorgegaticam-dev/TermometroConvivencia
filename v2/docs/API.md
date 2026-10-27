# API v2

Base: URL `/exec` de la implementación de Google Apps Script.

Todas las respuestas son JSON. Los errores usan:

```json
{
  "ok": false,
  "error": {
    "code": "ENCUESTA_CERRADA",
    "message": "La encuesta ya está cerrada."
  }
}
```

## GET

### `ping`

Verifica que el API esté publicado y que la hoja sea accesible.

```http
GET .../exec?accion=ping
```

```json
{
  "ok": true,
  "version": "2.0.0",
  "ahora": "2026-10-26T12:00:00.000Z",
  "hoja": "TCE_BD_v2"
}
```

### `obtenerEncuesta`

```http
GET .../exec?accion=obtenerEncuesta&codigo=AB12CD34
```

```json
{
  "ok": true,
  "encuesta": {
    "id": "AB12CD34",
    "fechaCreacion": "2026-10-26T12:00:00.000Z",
    "curso": "7° Básico A",
    "nivel": "7° Básico",
    "responsable": "Encargado de convivencia",
    "participantesEsperados": 35,
    "estado": "ACTIVA",
    "fechaCierre": "",
    "fechaProcesamiento": "",
    "medicionID": "",
    "respuestasRecibidas": 12
  }
}
```

Estados posibles: `ACTIVA`, `CERRADA`, `PROCESADA`.

### `listarMediciones`

Devuelve solo mediciones agregadas. No incluye respuestas individuales.

```http
GET .../exec?accion=listarMediciones
```

```json
{
  "ok": true,
  "mediciones": [
    {
      "id": "uuid",
      "fecha": "2026-10-26",
      "curso": "7° Básico A",
      "nivel": "7° Básico",
      "responsable": "Encargado de convivencia",
      "participantes": 30,
      "promedio": 3.42,
      "categoria": "DESARROLLO",
      "dimensiones": {
        "bienestar": 3.6,
        "inclusion": 3.4,
        "buenTrato": 3.2,
        "participacion": 3.1,
        "seguridad": 3.5,
        "pertenencia": 3.4,
        "relaciones": 3.7
      },
      "encuestaID": "AB12CD34",
      "origen": "ENCUESTA",
      "creadoEn": "2026-10-26T12:10:00.000Z"
    }
  ]
}
```

## POST

El cuerpo se envía como JSON sin cabecera `Content-Type` para evitar el preflight de CORS. Apps Script lo lee con `e.postData.contents`.

### `crearEncuesta`

Requiere token.

```json
{
  "accion": "crearEncuesta",
  "token": "TOKEN_ADMIN",
  "curso": "7° Básico A",
  "responsable": "Encargado de convivencia",
  "participantes": 35
}
```

```json
{
  "ok": true,
  "encuesta": {
    "id": "AB12CD34",
    "curso": "7° Básico A",
    "estado": "ACTIVA",
    "respuestasRecibidas": 0
  },
  "fila": 2
}
```

### `guardarRespuesta`

No requiere token. El `deviceId` lo genera el navegador y es anónimo.

```json
{
  "accion": "guardarRespuesta",
  "codigo": "AB12CD34",
  "deviceId": "uuid-anonimo",
  "respuestas": {
    "bienestar": 4,
    "inclusion": 3,
    "buenTrato": 4,
    "participacion": 3,
    "seguridad": 5,
    "pertenencia": 4,
    "relaciones": 4
  }
}
```

```json
{
  "ok": true,
  "duplicado": false,
  "recibidas": 13
}
```

Si el mismo dispositivo intenta responder otra vez:

```json
{
  "ok": true,
  "duplicado": true,
  "recibidas": 13
}
```

### `cerrarEncuesta`

Requiere token. No borra respuestas.

```json
{
  "accion": "cerrarEncuesta",
  "token": "TOKEN_ADMIN",
  "codigo": "AB12CD34"
}
```

### `procesarEncuesta`

Requiere token. Es idempotente: si ya existe una medición para la encuesta, no duplica.

```json
{
  "accion": "procesarEncuesta",
  "token": "TOKEN_ADMIN",
  "codigo": "AB12CD34"
}
```

```json
{
  "ok": true,
  "encuesta": { "id": "AB12CD34", "estado": "PROCESADA" },
  "medicion": { "id": "uuid", "promedio": 3.42, "categoria": "DESARROLLO" }
}
```

### `listarEncuestas`

Requiere token.

```json
{
  "accion": "listarEncuestas",
  "token": "TOKEN_ADMIN"
}
```

### `guardarMedicionManual`

Requiere token. Se usa para el ingreso masivo por curso. Recibe un arreglo de respuestas individuales; el servidor calcula los promedios. `fecha` es opcional (`YYYY-MM-DD`); si se omite, se usa la fecha actual de Santiago.

```json
{
  "accion": "guardarMedicionManual",
  "token": "TOKEN_ADMIN",
  "curso": "7° Básico A",
  "responsable": "Encargado de convivencia",
  "fecha": "2026-10-26",
  "respuestas": [
    { "bienestar": 4, "inclusion": 3, "buenTrato": 4, "participacion": 3, "seguridad": 5, "pertenencia": 4, "relaciones": 4 }
  ]
}
```

```json
{
  "ok": true,
  "medicion": {
    "id": "uuid",
    "fecha": "2026-10-26",
    "curso": "7° Básico A",
    "promedio": 3.86,
    "categoria": "DESARROLLO",
    "origen": "MANUAL"
  },
  "fila": 3
}
```

## Códigos de error

| Código | Significado |
|---|---|
| `NO_AUTORIZADO` | Token administrativo inválido o ausente. |
| `TOKEN_NO_CONFIGURADO` | Ejecuta `setup()` para crear el token. |
| `ACCION_REQUERIDA` | Falta el parámetro `accion`. |
| `ACCION_NO_RECONOCIDA` | La acción no existe. |
| `JSON_INVALIDO` | El cuerpo no es JSON válido. |
| `CUERPO_VACIO` | No se recibieron datos. |
| `SISTEMA_OCUPADO` | Otra solicitud está escribiendo; reintenta. |
| `BASE_NO_CONFIGURADA` | Ejecuta `setup()` para crear la hoja. |
| `BASE_NO_ACCESIBLE` | La hoja existe, pero no se puede abrir. |
| `HOJA_NO_EXISTE` | Falta una pestaña en la hoja. |
| `ESQUEMA_INVALIDO` | Los encabezados no coinciden con el esquema. |
| `CODIGO_REQUERIDO` | Falta el código de la encuesta. |
| `ENCUESTA_NO_ENCONTRADA` | El código no existe. |
| `ENCUESTA_CERRADA` | La encuesta ya fue cerrada. |
| `ENCUESTA_PROCESADA` | La encuesta ya fue procesada. |
| `ENCUESTA_NO_ACTIVA` | La encuesta no está en estado `ACTIVA`. |
| `SIN_RESPUESTAS` | No hay respuestas para procesar. |
| `RESPUESTA_INVALIDA` | Alguna respuesta no es un entero entre 1 y 5. |
| `DEVICE_INVALIDO` | El identificador anónimo del dispositivo no es válido. |
| `PARTICIPANTES_INVALIDOS` | El número de participantes no es válido. |
| `DEMASIADAS_RESPUESTAS` | Se superó el máximo de filas manuales (100). |
| `FECHA_INVALIDA` | La fecha de la medición no es válida. |
| `CURSO_INVALIDO` | El curso no está en la lista permitida. |
| `RESPONSABLE_REQUERIDO` | Falta el responsable. |
| `ERROR_INTERNO` | Error inesperado; revisar Ejecuciones en Apps Script. |

Errores solo del cliente:

| Código | Significado |
|---|---|
| `API_NO_CONFIGURADA` | Falta la URL `/exec` en `js/config.js`. |
| `RED` | No se pudo conectar con el servidor. |
| `TIMEOUT` | El servidor tardó más de 30 segundos. |
| `RESPUESTA_NO_JSON` | La URL no apunta a una implementación v2 pública. |
