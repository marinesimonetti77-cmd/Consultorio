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
3. **Habilitar el servicio de Calendar avanzado** (necesario para generar los links de Meet):
   - En el editor de Apps Script, panel izquierdo → **Servicios** (ícono ➕).
   - Buscá **Google Calendar API** y agregala.
   - Verificá que en el código quede como `Calendar` (nombre por defecto, no cambiar).
4. Guardá (ícono de disquete o Ctrl+S).
5. Arriba a la derecha: **Implementar → Nueva implementación**.
6. Tipo: **Aplicación web**.
   - Ejecutar como: **Yo (tu cuenta)**.
   - Quién tiene acceso: **Cualquier usuario**.
7. Clic en **Implementar**. Google te va a pedir autorización la primera vez — vas a ver permisos para:
   - Ver y editar eventos de Calendar (para los links de Meet)
   - Enviar mail en tu nombre (para los recordatorios automáticos)
   - Ver y administrar archivos de Drive (para los adjuntos de PDF/imágenes)
   Aceptalos todos, son necesarios para que funcione el sistema completo.
8. Copiá la **URL de la aplicación web** que te da (termina en `/exec`).

### 3. Conectar la app
1. Abrí `index.html` en el navegador (doble clic, o subilo a GitHub Pages como hiciste con Westricity).
2. Al abrir por primera vez te va a pedir la URL — pegá ahí la URL del paso anterior.
3. Listo. A partir de ahí todo lo que cargues en la app se guarda directo en tu Google Sheet,
   y si editás el Sheet a mano, la app lo va a reflejar la próxima vez que entrés a ese módulo.

## Notas importantes

- **Cada vez que modifiques el script** (`AppsScript_Backend.gs`) tenés que hacer
  **Implementar → Nueva implementación** de nuevo (no alcanza con guardar).
- **Teleconsultas automáticas**: si en Agenda cargás un turno con Modalidad = "Teleconsulta",
  el sistema crea automáticamente el evento en tu Google Calendar con link de Meet y agrega
  el registro correspondiente en el módulo Teleconsultas, listo para copiar y enviar al paciente.
- **Recordatorio automático por mail**: al agendar cualquier turno (presencial o teleconsulta),
  si el paciente tiene email cargado en el módulo Pacientes, se le envía automáticamente un mail
  de recordatorio (incluye el link de Meet si es teleconsulta). No hace falta tocar nada, se dispara solo.
- **WhatsApp con un clic**: en la tabla de Agenda, el teléfono del paciente aparece como un botón
  verde que abre directamente WhatsApp Web/app con ese número, para que le escribas manualmente
  cuando lo necesites. El teléfono se completa automático tomando el dato de Pacientes (no hace
  falta cargarlo a mano al crear el turno).
  - *Nota:* esto es distinto a un envío automático de WhatsApp — no existe una forma gratuita de
    mandar WhatsApp sin intervención humana salvo dando de alta la WhatsApp Business Platform de
    Meta (con número verificado y plantillas aprobadas). Si más adelante querés eso, avisame y lo sumamos.
- **Adjuntar archivos (PDF/imágenes)**: en Informes Qx, Liquidaciones y Facturación Qx hay un
  campo "Archivo adjunto" donde podés subir un PDF o imagen directo desde el formulario. Se guarda
  automáticamente en una carpeta de tu Google Drive llamada "Consultorio Dr. Ciavarelli - Adjuntos"
  (con subcarpetas por módulo), y el link queda guardado en la fila correspondiente.
- **Nuevo módulo: Liquidaciones** (ubicado entre Informes Qx y Facturación Qx) — para llevar el
  seguimiento de liquidaciones por cirugía, con su propio archivo adjunto.
- Los nombres de las hojas deben coincidir con los del Excel original
  (ej: `1-Pacientes`, `2-Agenda`, etc.). Si el script no encuentra una hoja, la crea sola.
  Con estos cambios, la hoja de Informes Qx pasa a ser la 12, Liquidaciones la 13, y
  Facturación Qx la 14 (se corrió un número).
- El módulo **Checklist** y **Estadísticas** tienen filas de "categoría" (como
  "📊 IMPUESTOS Y FACTURACIÓN") que se detectan automáticamente por no tener
  vencimiento/valores — no hace falta tocar nada ahí.
- Todo el sistema queda accesible desde el celular también, ya que es una página web común.

## Estructura de módulos

1. Pacientes · 2. Agenda · 3. Facturación · 4. Obras Sociales · 5. Convenios ·
6. Teleconsultas · 7. Cobros · 8. Reintegros · 9. Checklist · 10. Estadísticas ·
11. Cirugías · 12. Informes Qx · 13. Liquidaciones · 14. Facturación Qx

Cada módulo tiene: tabla con búsqueda, alta/edición/borrado de registros mediante
formularios (no hace falta tocar celdas), y estados visuales tipo "pill"
(✔ verde, ⏳ amarillo, ✘ rojo) igual que en el Excel original.
