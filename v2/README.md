# TCE v2 · Termómetro de la Convivencia Educativa

Reconstrucción del sistema de monitoreo de convivencia escolar del **Liceo Bicentenario Los Ángeles**.

La versión 2 mantiene las 7 dimensiones, la escala Likert, los umbrales y la identidad visual de la versión anterior, pero separa responsabilidades, elimina dependencias frágiles y deja Google Sheets como única fuente de verdad.

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Decisiones y arquitectura | Completada |
| 1 | Estructura, dominio, pruebas y documentación | Completada |
| 2 | API Apps Script v2 + hoja `TCE_BD_v2` | Implementada · falta publicar |
| 3 | Flujo administrador | Implementada · falta validar |
| 4 | Flujo estudiante | Implementada · falta validar |
| 5 | Dashboard, historial, ranking y comparación | Implementada · falta validar |
| 6 | Publicación, seguridad y migración histórica | Pendiente |

## Estructura

```text
tce-v2/
├── index.html
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── components.css
│   └── pages.css
├── js/
│   ├── main.js
│   ├── config.js
│   ├── core/
│   │   ├── api.js
│   │   ├── router.js
│   │   ├── state.js
│   │   └── storage.js
│   ├── domain/
│   │   ├── courses.js
│   │   ├── dimensions.js
│   │   ├── scoring.js
│   │   └── validation.js
│   ├── services/
│   ├── ui/
│   └── utils/
├── tests/
├── docs/
└── appsscript/
```

## Desarrollo local

1. Abre la carpeta `tce-v2` en VS Code.
2. Usa **Live Server** sobre `index.html`, o ejecuta el servidor incluido:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tools/serve.ps1 -Port 8123
   ```

3. Abre `http://localhost:8123/`.
4. Configura `js/config.js` con la URL `/exec` de Apps Script.
5. No uses la app publicada en GitHub Pages hasta que la v2 esté validada.

## Pruebas

Con Node.js instalado:

```bash
npm test
```

Si no tienes Node, abre `tests/test.html` con un servidor local (Live Server) para ejecutar la misma batería en el navegador.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Hojas de cálculo](docs/SHEETS.md)
- [Despliegue](docs/DEPLOY.md)
- [Pruebas](docs/TESTING.md)

## Principios

1. Una sola fuente de verdad: Google Sheets.
2. LocalStorage solo como caché o comodidad, nunca como base compartida.
3. Validar en el navegador **y** en Apps Script.
4. No exponer datos individuales de estudiantes.
5. Cambios pequeños, con prueba y documentación.
6. No modificar datos históricos sin respaldo.
