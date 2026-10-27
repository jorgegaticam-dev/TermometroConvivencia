# Pruebas

## Pruebas de dominio

Con Node.js:

```bash
npm test
```

Sin Node.js, abre `tests/test.html` con Live Server. La página ejecuta las mismas funciones y muestra `PASS` o `FAIL`.

Cubren:

- Promedio por dimensión y promedio general.
- Umbrales de categoría: 4,1 / 3,1 / 2,1.
- Última medición por curso.
- Nivel a partir del curso.
- Validación de encuesta y de respuestas.
- Fechas ISO sin corrimiento de zona horaria.

## Pruebas de Apps Script

En el editor de Apps Script, ejecuta:

```text
runAllTests()
```

Cubren funciones puras y el router sin escribir datos:

- `testScoring_()`
- `testThresholds_()`
- `testLevel_()`
- `testCourses_()`
- `testSurveyCode_()`
- `testDeviceHash_()`
- `testSchema_()`
- `testInvalidResponse_()`
- `testMeasurementDto_()`
- `testInvalidToken_()`
- `testPing_()` (se omite si no existe hoja configurada)

No ejecutes pruebas de integración sobre la hoja real sin respaldo.

## Vistas previas sin API

Con el servidor local (`tools/serve.ps1`) o Live Server:

| Página | Qué muestra |
|---|---|
| `tests/preview.html` | Dashboard con 8 mediciones de ejemplo. |
| `tests/student-preview.html` | Encuesta activa, código inexistente, cerrada, procesada y respuesta duplicada, con API simulada. |
| `tests/test.html` | Batería de dominio en el navegador. |

Las vistas previas no leen ni escriben Google Sheets.

## Prueba manual de extremo a extremo

### Preparación

- Navegador A: administrador.
- Navegador B o teléfono: estudiante.
- Token administrativo a mano.

### Flujo

1. En A, abre `/v2/` y configura el token.
2. Crea una encuesta para un curso de prueba.
3. Copia el enlace.
4. En B, abre el enlace en incógnito.
5. Verifica que se vean curso, responsable y las 7 preguntas.
6. Intenta enviar con preguntas incompletas: debe bloquear.
7. Responde todo y envía: debe mostrar “Gracias”.
8. En A, pulsa “Actualizar”: el contador debe subir a 1.
9. En B, intenta responder de nuevo: debe indicar que ya respondió.
10. En A, procesa la encuesta:
    - Debe aparecer una fila en `MEDICIONES`.
    - El estado debe ser `PROCESADA`.
    - El dashboard debe reflejar el resultado.
11. Procesa de nuevo: no debe duplicar la medición.
12. Cierra una encuesta nueva y verifica que un estudiante reciba “Encuesta finalizada”.

### Casos negativos

- Enlace con código inexistente.
- Token incorrecto.
- Encuesta cerrada.
- Encuesta procesada.
- Respuesta con valor 0, 6 o texto.
- API caída o URL mal configurada.

## Canarios del API

| Prueba | Resultado esperado |
|---|---|
| `?accion=ping` | `ok:true` y nombre de hoja |
| `?accion=obtenerEncuesta&codigo=NOEXISTE` | `ok:false`, `ENCUESTA_NO_ENCONTRADA` |
| `?accion=listarMediciones` | arreglo de mediciones agregadas |
| POST con token inválido | `ok:false`, `NO_AUTORIZADO` |

Si `ping` funciona pero `obtenerEncuesta` devuelve mediciones, la implementación publicada está desactualizada.
