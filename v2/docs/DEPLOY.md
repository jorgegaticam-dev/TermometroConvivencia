# Despliegue

## 1. Crear el proyecto de Apps Script

1. Abre [script.google.com](https://script.google.com) con la cuenta dueña de la hoja.
2. Crea un proyecto nuevo llamado **API_TCE_v2**.
3. Crea estos archivos con los nombres exactos y pega el contenido de `appsscript/`:

```text
Config.gs
Utils.gs
Scoring.gs
SheetRepository.gs
Setup.gs
SurveyService.gs
ResponseService.gs
MeasurementService.gs
Migration.gs
Api.gs
Tests.gs
appsscript.json
```

4. Si el editor no muestra `appsscript.json`, activa **Configuración del proyecto > Mostrar el archivo de manifiesto `appsscript.json`** y pégalo desde `appsscript/appsscript.json`.
5. Guarda el proyecto.

## 2. Inicializar la base

1. En el editor de Apps Script, selecciona la función `setup`.
2. Ejecuta una vez y autoriza los permisos.
3. Revisa **Ejecuciones > Registro**. Debes ver:
   - URL de la hoja `TCE_BD_v2`.
   - Token de administración.
4. Guarda el token en un lugar seguro. No lo publiques ni lo subas a GitHub.

`setup()` es idempotente: si vuelves a ejecutarlo, no borra datos ni cambia el token existente.

Si necesitas regenerar el token, ejecuta `resetAdminToken()` y guarda el nuevo valor.

## 3. Publicar el API

1. `Implementar` > `Nueva implementación`.
2. Tipo: **Aplicación web**.
3. Descripción: `TCE v2 API`.
4. **Ejecutar como:** `Yo`.
5. **Quién tiene acceso:** `Cualquier persona`.
6. Implementar y copiar la URL `/exec`.

> Si más adelante actualizas el código, usa `Implementar > Gestionar implementaciones > Editar > Nueva versión`. Así conservas la misma URL `/exec`.

## 4. Configurar el frontend

Edita `js/config.js`:

```js
API_URL: "https://script.google.com/macros/s/.../exec",
```

No agregues `Content-Type: application/json` al `fetch`; el cliente ya envía el JSON como texto simple para evitar el preflight de CORS.

## 5. Verificar el API

Abre en una ventana de incógnito:

```text
.../exec?accion=ping
```

Debe devolver:

```json
{ "ok": true, "version": "2.0.0", "hoja": "TCE_BD_v2" }
```

Luego:

```text
.../exec?accion=obtenerEncuesta&codigo=NOEXISTE
```

Debe devolver `ok:false` con `ENCUESTA_NO_ENCONTRADA`. Si devuelve datos de mediciones, estás usando una implementación antigua.

## 6. Publicar en GitHub Pages

La v2 se publica dentro del mismo repositorio, en una carpeta `v2/`:

```text
TermometroConvivencia/
├── index.html          ← versión actual, no tocar
├── css/
├── js/
└── v2/
    ├── index.html      ← nueva versión
    ├── css/
    ├── js/
    └── ...
```

Pasos:

1. Copia el contenido de `tce-v2/` dentro de `v2/` del repositorio.
2. Haz commit y push a `main`.
3. Espera la publicación de GitHub Pages.
4. Abre `https://jorgegaticam-dev.github.io/TermometroConvivencia/v2/`.

La versión actual sigue disponible en la raíz. Cuando la v2 esté validada, se promueve a la raíz y se conserva la anterior en `legacy/`.

## 7. Probar el flujo completo

1. En el panel v2, configura el token.
2. Crea una encuesta con todos los campos.
3. Copia el enlace.
4. Ábrelo en otro dispositivo o en una ventana de incógnito.
5. Responde las 7 preguntas.
6. Verifica que el contador del administrador suba.
7. Procesa la encuesta.
8. Revisa que aparezca una fila en `MEDICIONES` y que el dashboard se actualice.

## 8. Migrar datos históricos

Solo después de validar el flujo nuevo:

1. Haz una copia de la hoja antigua y de `TCE_BD_v2`.
2. Ejecuta `migrarMedicionesAntiguas()` en Apps Script.
3. Revisa el registro: filas migradas, filas omitidas y motivos.
4. Verifica que la fila inválida con `#NUM!` no se haya copiado.
5. No borres la hoja antigua.

## 9. Seguridad mínima

- No publiques el token en GitHub.
- No hagas pública la hoja de cálculo.
- No devuelvas respuestas individuales al frontend.
- Mantén la implementación con acceso “Cualquier persona” solo porque el estudiante debe responder sin cuenta. Las acciones administrativas siguen protegidas por token.
- Si el proyecto crece, migra a autenticación con Google Workspace y separa el endpoint administrativo del público.
