# Hojas de cálculo · TCE_BD_v2

La versión 2 usa una hoja nueva. La base actual se conserva como respaldo y solo se usa para migrar mediciones válidas.

## Pestañas

### `MEDICIONES`

Una fila por resultado procesado. No se guardan respuestas individuales aquí.

| Columna | Campo | Tipo |
|---|---|---|
| A | `ID` | UUID |
| B | `Fecha` | Texto `YYYY-MM-DD` |
| C | `Curso` | Texto |
| D | `Nivel` | Texto |
| E | `Responsable` | Texto |
| F | `Participantes` | Entero |
| G | `Promedio` | Número 1.00–5.00 |
| H | `Categoria` | `FORTALECIDA`, `DESARROLLO`, `ALERTA`, `CRITICA` |
| I | `Bienestar` | Número |
| J | `Inclusion` | Número |
| K | `BuenTrato` | Número |
| L | `Participacion` | Número |
| M | `Seguridad` | Número |
| N | `Pertenencia` | Número |
| O | `Relaciones` | Número |
| P | `EncuestaID` | Código o vacío (medición manual) |
| Q | `Origen` | `ENCUESTA`, `MANUAL`, `MIGRADA` |
| R | `CreadoEn` | ISO 8601 |

### `ENCUESTAS`

| Columna | Campo | Tipo |
|---|---|---|
| A | `ID` | Código de 8 caracteres |
| B | `FechaCreacion` | ISO 8601 |
| C | `Curso` | Texto |
| D | `Nivel` | Texto |
| E | `Responsable` | Texto |
| F | `ParticipantesEsperados` | Entero |
| G | `Estado` | `ACTIVA`, `CERRADA`, `PROCESADA` |
| H | `FechaCierre` | ISO 8601 o vacío |
| I | `FechaProcesamiento` | ISO 8601 o vacío |
| J | `MedicionID` | UUID o vacío |
| K | `CreadoPor` | Texto |

### `RESPUESTAS`

Respuestas anónimas. No se guardan nombres, correos ni IP.

| Columna | Campo | Tipo |
|---|---|---|
| A | `ID` | Hash de encuesta + dispositivo |
| B | `EncuestaID` | Código |
| C | `Fecha` | ISO 8601 |
| D | `DeviceHash` | Hash del identificador anónimo |
| E | `Bienestar` | Entero 1–5 |
| F | `Inclusion` | Entero 1–5 |
| G | `BuenTrato` | Entero 1–5 |
| H | `Participacion` | Entero 1–5 |
| I | `Seguridad` | Entero 1–5 |
| J | `Pertenencia` | Entero 1–5 |
| K | `Relaciones` | Entero 1–5 |
| L | `Promedio` | Número |

## Reglas

1. No cambiar el orden ni el nombre de los encabezados sin actualizar `Config.gs`.
2. Las columnas de fecha se configuran como texto (`@`) para evitar conversiones de zona horaria.
3. No borrar filas históricas. Para corregir, agregar una columna o una nota.
4. Antes de cualquier cambio estructural, hacer **Archivo > Hacer una copia**.
5. La hoja debe permanecer privada. El acceso público se hace por Apps Script, no compartiendo el documento.

## Migración desde la base anterior

`Migration.gs` lee la hoja antigua `MEDICIONES`, valida cada fila y copia solo las mediciones con:

- Curso no vacío.
- Promedio numérico entre 1 y 5.
- Las 7 dimensiones numéricas entre 1 y 5.

Las filas inválidas (por ejemplo, la que tiene `#NUM!`) se omiten y se informan en el registro. La hoja antigua no se modifica.

La categoría se recalcula con los umbrales vigentes; no se copia el texto antiguo.

## Estados

| Estado | Significado |
|---|---|
| `ACTIVA` | Acepta respuestas. |
| `CERRADA` | No acepta respuestas; aún se puede procesar. |
| `PROCESADA` | Ya generó una medición; no se vuelve a procesar. |

`ABIERTA` de la versión anterior se reemplaza por `ACTIVA`. Como la hoja nueva parte vacía, no hay datos históricos que migrar en esta columna.
