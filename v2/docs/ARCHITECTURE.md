# Arquitectura

## Objetivo

Permitir que un administrador cree una encuesta en un computador y que un estudiante la responda desde otro dispositivo, sin depender de `localStorage`.

## Capas

```text
Navegador
  UI (js/ui)
    ↓
  Servicios (js/services)
    ↓
  API cliente (js/core/api.js)
    ↓  HTTPS / JSON
Google Apps Script (appsscript/)
  Api.gs (router)
    ↓
  SurveyService / ResponseService / MeasurementService
    ↓
  SheetRepository
    ↓
Google Sheets (TCE_BD_v2)
```

## Decisiones

### JavaScript nativo con módulos ES

- Sin build, sin dependencias obligatorias.
- GitHub Pages sirve los módulos directamente.
- Live Server funciona sin configuración adicional.
- Se evita la complejidad de un framework para un equipo pequeño.

### Una sola fuente de verdad

- `Google Sheets` guarda encuestas, respuestas y mediciones.
- `localStorage` solo cachea mediciones y recuerda el `DeviceID` anónimo.
- Si el API falla, la UI muestra un error; no simula que guardó.

### Separación administrador / estudiante

- `?encuesta=CODIGO` activa el modo estudiante.
- Sin ese parámetro se muestra el panel administrativo.
- El modo estudiante no descarga mediciones ni inicializa el dashboard.

### Identificadores

- Encuesta: código corto de 8 caracteres, sin ambigüedad (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
- Medición: UUID.
- Respuesta: hash SHA-256 de `codigo + hash(deviceId)`, para evitar duplicados del mismo dispositivo sin guardar el identificador original.

### Fechas

- Fecha de medición: `YYYY-MM-DD`.
- Marcas de tiempo: ISO 8601 (`new Date().toISOString()`).
- Las columnas de fecha se configuran como texto en Sheets para evitar conversiones de zona horaria.

### Seguridad

- Las acciones públicas son `ping`, `obtenerEncuesta`, `guardarRespuesta` y `listarMediciones` (agregadas).
- Las acciones administrativas requieren un token guardado en Script Properties.
- El token se pide una vez por sesión y se guarda en `sessionStorage`, no en el código.
- No se devuelven respuestas individuales al panel; solo agregados y conteos.

> El token es una barrera razonable para un contexto escolar, no seguridad de nivel bancario. Si el proyecto crece, se debe migrar a autenticación con Google Workspace.

## Flujo de una encuesta

1. El administrador ingresa curso, responsable y participantes esperados.
2. `crearEncuesta` valida el token y los datos, genera un código y escribe en `ENCUESTAS`.
3. El administrador comparte `https://.../?encuesta=CODIGO`.
4. El estudiante abre el enlace. `obtenerEncuesta` devuelve curso, responsable, estado y conteo.
5. El estudiante responde las 7 preguntas. `guardarRespuesta` valida, controla duplicados y escribe en `RESPUESTAS`.
6. El administrador ve el avance consultando el conteo.
7. `procesarEncuesta` calcula promedios, escribe una sola fila en `MEDICIONES` y marca la encuesta como `PROCESADA`.
8. `cerrarEncuesta` impide nuevas respuestas.

## Manejo de errores

- El API siempre responde JSON:

```json
{ "ok": false, "error": { "code": "ENCUESTA_CERRADA", "message": "La encuesta ya está cerrada." } }
```

- La UI muestra un mensaje claro y no oculta el error.
- Los errores internos se registran en Apps Script y se devuelve un mensaje genérico.
