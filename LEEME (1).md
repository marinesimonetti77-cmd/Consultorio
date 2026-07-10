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

## ⚠️ Paso extra si ya tenías el sistema instalado (arreglo del link de Meet)

Si ya habías implementado una versión anterior del script y el link de Meet
te quedaba vacío en Teleconsultas, es casi seguro que fue por esto: habilitaste
el servicio avanzado de Calendar *después* de haber autorizado la app por
primera vez, y ese permiso nuevo nunca se terminó de otorgar. Para destrabarlo:

1. Pegá el `AppsScript_Backend.gs` actualizado (reemplazá todo el contenido).
2. Guardá (Ctrl+S).
3. En el desplegable de funciones (arriba, al lado de ▶ Ejecutar) elegí
   **`testCalendarMeet`** y apretá ▶ **Ejecutar**.
4. Te va a pedir autorización de nuevo — **revisá que en la lista de permisos
   aparezca "Ver y editar eventos de Calendar"** y aceptalo.
5. Mirá el resultado en **Ejecuciones** (panel izquierdo) o en **Ver → Registros
   de ejecución**: ahí vas a ver el link generado, o el error exacto de Calendar
   si algo sigue fallando.
6. **Implementar → Nueva implementación** (obligatorio para que la app web
   use el permiso ya otorgado).

Con este arreglo, además, **el sistema nunca va a dejar el campo vacío**: si
por algún motivo Calendar falla, se genera automáticamente un link de reunión
instantánea de Meet (`meet.google.com/new`) como respaldo, así siempre tenés
algo para mandarle al paciente.

## Novedades de esta revisión

- **Pacientes: campos nuevos** — Plan, N° de Afiliado, Fecha de Nacimiento y
  Domicilio, además de los que ya había. Se agregan solos a tu Sheet la
  próxima vez que guardes un paciente (no hace falta tocar la planilla).
- **Acceso directo a email** (además del de WhatsApp que ya había): en
  Pacientes y en Agenda, el email es un botón que abre tu programa de correo
  con el mensaje precargado (recordatorio de turno en Agenda).
- **Agenda ahora también autocompleta el Email** del paciente (antes solo
  autocompletaba el Teléfono), y en la tabla de Agenda ya se ven los accesos
  directos de WhatsApp y de email juntos.
- **Fix importante — campos "corridos" / datos que no se guardaban**: el
  script escribía cada dato en una posición de columna fija, asumiendo que
  el orden de columnas de tu Google Sheet coincidía exactamente con el del
  script. Si tu planilla (armada desde tu Excel original) tenía las columnas
  en otro orden, los valores se guardaban en la columna equivocada — esto
  explicaba el teléfono que no aparecía en Agenda, el "Archivo adjunto"
  vacío en Informes Qx, y el link de Meet que no se veía. Ahora cada valor
  se busca y se escribe por el **nombre real** de la columna en tu hoja, sin
  importar el orden ni pequeñas diferencias de tildes/mayúsculas/espacios.
- **Nueva función de diagnóstico `diagnosticarEncabezados`**: corré esta
  función manualmente desde el editor de Apps Script (Ver > Registros de
  ejecución para ver el resultado) para comparar los encabezados reales de
  cada hoja contra los que espera el script, y detectar si falta alguna
  columna con ese nombre exacto.
- **Fix de "30/12/1899" en el campo Hora**: era un artefacto de cómo Google
  Sheets guarda valores de solo-hora (sin fecha). Ahora se muestra
  correctamente como HH:MM.
- **Meet también se genera cargando la teleconsulta directo en su módulo**
  (antes solo funcionaba si el turno venía de Agenda). Además, ahora hay un
  botón 🎥 en la tabla de Teleconsultas para generar el link manualmente en
  los registros viejos que quedaron sin uno.
- **Visor de PDF/imagen integrado**: en Informes Qx, Liquidaciones y
  Facturación Qx, el botón "📎 Ver archivo adjunto" abre el PDF o imagen
  *dentro* de la app (en una ventana modal), sin salir a una pestaña nueva.
  También podés abrirlo en pestaña nueva desde ese mismo modal si preferís.
- **La columna "Archivo adjunto" ahora se ve siempre** en las tablas de
  Liquidaciones y Facturación Qx (antes quedaba oculta por el límite de
  columnas visibles).
- **WhatsApp Web directo también en Pacientes** (antes solo estaba en Agenda):
  el teléfono es un botón que abre `web.whatsapp.com` con el chat listo para
  escribir, con un mensaje precargado (recordatorio de turno en Agenda,
  saludo genérico en Pacientes). Vos das el último clic para mandarlo.
- **Botón "✨ Cargar ejemplos"** en el panel lateral: agrega un registro de
  muestra en cada uno de los 14 módulos para que veas el sistema funcionando
  de punta a punta. Podés editar o borrar esos registros como cualquier otro.

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
