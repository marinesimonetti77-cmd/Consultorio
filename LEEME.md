# Consultorio Dr. Ciavarelli — App Web

App web moderna (tema oscuro, estilo Westricity) que reemplaza la planilla de Excel,
manteniendo los 13 módulos y guardando todo en tu Google Sheet.

## Archivos

- `index.html`, `app.js`, `app-render.js` → la app web (subir juntos a cualquier hosting, o abrir `index.html` directo en el navegador).
- `AppsScript_Backend.gs` → el "backend" que va DENTRO de tu Google Sheet.

## Instalación (10 minutos)

### 1. Preparar el Google Sheet
Subí tu archivo `Consultorio_Dr_Ciavarelli_MAESTRO_.xlsx` a Google Drive y abrilo como
Google Sheets (se convierte automáticamente, o usá "Archivo > Guardar como Google Sheets").

### 2. Instalar el script
1. En el Sheet: menú **Extensiones → Apps Script**.
2. Borrá todo el contenido de `Code.gs` y pegá el contenido completo de `AppsScript_Backend.gs`.
3. Guardá (ícono de disquete o Ctrl+S).
4. Arriba a la derecha: **Implementar → Nueva implementación**.
5. Tipo: **Aplicación web**.
   - Ejecutar como: **Yo (tu cuenta)**.
   - Quién tiene acceso: **Cualquier usuario**.
6. Clic en **Implementar**. Google te va a pedir autorización la primera vez (aceptá los permisos).
7. Copiá la **URL de la aplicación web** que te da (termina en `/exec`).

### 3. Conectar la app
1. Abrí `index.html` en el navegador (doble clic, o subilo a GitHub Pages como hiciste con Westricity).
2. Al abrir por primera vez te va a pedir la URL — pegá ahí la URL del paso anterior.
3. Listo. A partir de ahí todo lo que cargues en la app se guarda directo en tu Google Sheet,
   y si editás el Sheet a mano, la app lo va a reflejar la próxima vez que entrés a ese módulo.

## Notas importantes

- **Cada vez que modifiques el script** (`AppsScript_Backend.gs`) tenés que hacer
  **Implementar → Nueva implementación** de nuevo (no alcanza con guardar).
- Los nombres de las hojas deben coincidir con los del Excel original
  (ej: `1-Pacientes`, `2-Agenda`, etc.). Si el script no encuentra una hoja, la crea sola.
- El módulo **Checklist** y **Estadísticas** tienen filas de "categoría" (como
  "📊 IMPUESTOS Y FACTURACIÓN") que se detectan automáticamente por no tener
  vencimiento/valores — no hace falta tocar nada ahí.
- Todo el sistema queda accesible desde el celular también, ya que es una página web común.

## Estructura de módulos

1. Pacientes · 2. Agenda · 3. Facturación · 4. Obras Sociales · 5. Convenios ·
6. Teleconsultas · 7. Cobros · 8. Reintegros · 9. Checklist · 10. Estadísticas ·
11. Cirugías · 12. Informes Qx · 13. Facturación Qx

Cada módulo tiene: tabla con búsqueda, alta/edición/borrado de registros mediante
formularios (no hace falta tocar celdas), y estados visuales tipo "pill"
(✔ verde, ⏳ amarillo, ✘ rojo) igual que en el Excel original.
