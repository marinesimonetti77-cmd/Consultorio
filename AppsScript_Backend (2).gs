/**
 * BACKEND - Consultorio Dr. Ciavarelli
 * ---------------------------------------------------
 * INSTALACIÓN:
 * 1. Abrí tu Google Sheet "Consultorio_Dr_Ciavarelli_MAESTRO".
 * 2. Menú Extensiones > Apps Script.
 * 3. Borrá el contenido de Code.gs y pegá TODO este archivo.
 * 4. Arriba a la derecha, botón "Implementar" > "Nueva implementación".
 * 5. Tipo: "Aplicación web". Ejecutar como: "Yo". Quién tiene acceso: "Cualquier usuario".
 * 6. Copiá la URL que te da ("URL de la aplicación web") y pegala en la app
 *    web cuando te la pida (icono de engranaje / Configuración).
 * 7. Cada vez que modifiques este script, tenés que crear una "Nueva
 *    implementación" de nuevo para que los cambios tomen efecto.
 * ---------------------------------------------------
 */

const SPREADSHEET_ID = '1gXeP_AGWLHLWERC_hdnOqkKblG2dbxRcKwefqIY4GZc';

// Carpeta de Drive donde se guardan los adjuntos (PDF/imágenes). Se crea sola
// la primera vez que se sube un archivo, dentro de "Mi unidad".
const DRIVE_FOLDER_NAME = 'Consultorio Dr. Ciavarelli - Adjuntos';

const SHEETS = {
  pacientes: '1-Pacientes',
  agenda: '2-Agenda',
  facturacion: '3-Facturación',
  obrasSociales: '4-Obras Sociales',
  convenios: '5-Convenios',
  teleconsultas: '6-Teleconsultas',
  cobros: '7-Cobros',
  reintegros: '8-Reintegros',
  checklist: '9-Checklist',
  estadisticas: '10-Estadísticas',
  cirugias: '11-Cirugías',
  informesQx: '12-Informes Qx',
  liquidaciones: '13-Liquidaciones',
  facturacionQx: '14-Facturación Qx'
};

const HEADERS = {
  pacientes: ['Apellido','Nombre','Teléfono','Email','Obra Social / Prepaga','Plan','N° de Afiliado','Fecha de Nacimiento','Domicilio','1ª Consulta','Último Control','Próximo Turno','Observaciones'],
  agenda: ['Fecha','Hora','Paciente','Teléfono','Email','Modalidad','Estado','Cobró','N° Factura','Observaciones','Link de pago'],
  facturacion: ['Fecha','Paciente','N° Factura','Concepto','Importe ($)','IVA','Total ($)','Cobrado','Medio de Pago'],
  obrasSociales: ['Obra Social / Prepaga','Estado del Trámite','Usuario / RNOS','Clave','Vencimiento Credencial','Observaciones'],
  convenios: ['Financiador','Tipo de Convenio','Documentación presentada','Estado','Observaciones'],
  teleconsultas: ['Paciente','Fecha','Hora','Link Meet / Zoom','Pagó','Receta enviada','Control programado','Link alternativo','Consentimiento'],
  cobros: ['Fecha','Paciente','Transferencia ($)','Mercado Pago ($)','Efectivo ($)','Pendiente ($)','N° Factura'],
  reintegros: ['Paciente','Obra Social','N° Factura enviada','Fecha de envío','Estado','Observaciones'],
  checklist: ['Tarea','Vencimiento','Realizado','Observaciones','Categoria'],
  cirugias: ['N° CX','Fecha','Paciente','Institución','Tipo de cirugía','Diagnóstico','Modalidad','Obra Social','Ayudante','Anestesista','Instrumentadora','Estado','Link Drive','Observaciones'],
  informesQx: ['N° CX','Fecha','Paciente','Tipo de cirugía','Descripción del procedimiento','Hallazgos intraoperatorios','Indicaciones postoperatorias','Estado del informe','Enviado a','Archivo adjunto'],
  liquidaciones: ['N° CX','Fecha','Paciente','Obra Social / Financiador','Concepto','Importe ($)','Estado','Observaciones','Archivo adjunto'],
  facturacionQx: ['N° CX','Fecha','Paciente','Obra Social','Hon. Cirujano ($)','Hon. Ayudante ($)','Hon. Anestesista ($)','Total ($)','N° Factura','Fecha presentación','Fecha acreditación','Estado cobro','Observaciones','Archivo adjunto']
};

function doGet(e) {
  try {
    const action = e.parameter.action || 'getAll';
    if (action === 'getAll') {
      return jsonOut(getAllData());
    }
    if (action === 'get') {
      const module = e.parameter.module;
      return jsonOut(getModuleData(module));
    }
    return jsonOut({ error: 'Acción no reconocida' });
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'saveModule') {
      saveModuleData(body.module, body.rows);
      return jsonOut({ success: true });
    }
    if (action === 'addRow') {
      addRow(body.module, body.row);
      return jsonOut({ success: true });
    }
    if (action === 'updateRow') {
      updateRow(body.module, body.rowIndex, body.row);
      return jsonOut({ success: true });
    }
    if (action === 'deleteRow') {
      deleteRow(body.module, body.rowIndex);
      return jsonOut({ success: true });
    }
    if (action === 'uploadFile') {
      const link = subirArchivoADrive(body.fileName, body.mimeType, body.base64Data, body.module);
      return jsonOut({ success: true, link: link });
    }
    if (action === 'sendReminderEmail') {
      enviarRecordatorioMail(body.row);
      return jsonOut({ success: true });
    }
    if (action === 'generarMeet') {
      const link = generarMeetParaFila(body.module, body.rowIndex, body.row);
      return jsonOut({ success: true, link: link });
    }
    return jsonOut({ error: 'Acción no reconocida' });
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Crea un evento de Calendar con videollamada de Google Meet asociada
 * y devuelve el link generado. Se usa para el módulo Teleconsultas.
 * Usa la API avanzada de Calendar (Calendar v3) para forzar la creación
 * de conferenceData, ya que CalendarApp.createEvent() no siempre genera
 * el Hangout Link de forma confiable.
 */
function crearLinkMeet(paciente, fechaStr, horaStr) {
  let start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  if (fechaStr) {
    const parts = String(fechaStr).split('/');
    if (parts.length === 3) {
      const dd = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10);
      const yyyy = parseInt(parts[2], 10);
      let hh = 9, min = 0;
      if (horaStr) {
        const hParts = String(horaStr).split(':');
        hh = parseInt(hParts[0], 10) || 9;
        min = parseInt(hParts[1], 10) || 0;
      }
      start = new Date(yyyy, mm - 1, dd, hh, min);
    }
  }
  const end = new Date(start.getTime() + 30 * 60000); // 30 min

  const event = {
    summary: 'Teleconsulta - ' + (paciente || 'Paciente'),
    description: 'Teleconsulta generada automáticamente desde el sistema del consultorio.',
    start: { dateTime: start.toISOString(), timeZone: Session.getScriptTimeZone() },
    end: { dateTime: end.toISOString(), timeZone: Session.getScriptTimeZone() },
    conferenceData: {
      createRequest: {
        requestId: Utilities.getUuid(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] }
  };

  const created = Calendar.Events.insert(event, 'primary', { conferenceDataVersion: 1 });
  const link = created.hangoutLink || (created.conferenceData &&
    created.conferenceData.entryPoints &&
    created.conferenceData.entryPoints.length &&
    created.conferenceData.entryPoints[0].uri) || '';
  return link;
}

/**
 * Envoltorio seguro de crearLinkMeet: si el servicio avanzado de Calendar
 * falla por el motivo que sea (no habilitado, falta de autorización,
 * cuota, etc.) NUNCA deja el campo vacío: registra el error en el log
 * (Ver > Registros de ejecución en el editor de Apps Script, o Ejecuciones
 * en el panel izquierdo) y devuelve un link de reunión instantánea de
 * Meet como respaldo, que funciona siempre sin depender de ningún
 * servicio adicional.
 */
function crearLinkMeetSeguro(paciente, fechaStr, horaStr) {
  try {
    const link = crearLinkMeet(paciente, fechaStr, horaStr);
    if (link) return link;
    console.error('crearLinkMeet devolvió un link vacío para: ' + paciente);
  } catch (err) {
    console.error('Error generando link de Meet para ' + paciente + ': ' + err.message);
  }
  // Respaldo: reunión instantánea de Meet. Se comparte igual que un link
  // programado; al abrirla se crea la sala en el momento.
  return 'https://meet.google.com/new';
}

function getSheet(moduleKey) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = SHEETS[moduleKey];
  if (!sheetName) throw new Error('Módulo desconocido: ' + moduleKey);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // El nombre exacto no matcheó (puede pasar si el texto con tildes se
    // corrompió al copiar el script). Antes de crear una pestaña nueva
    // (y duplicar datos), buscamos tolerando tildes/mayúsculas/errores de
    // codificación por si la pestaña correcta ya existe con otro texto.
    const target = normalizeKey(sheetName);
    const match = ss.getSheets().find(sh => normalizeKey(sh.getName()) === target);
    if (match) {
      sheet = match;
    } else {
      sheet = ss.insertSheet(sheetName);
      if (HEADERS[moduleKey]) sheet.appendRow(HEADERS[moduleKey]);
    }
  }
  return sheet;
}

function getModuleData(moduleKey) {
  const sheet = getSheet(moduleKey);
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return { headers: HEADERS[moduleKey] || [], rows: [] };

  // Find header row (first row with text). Support sheets with title row above headers.
  let headerRowIdx = 0;
  const expectedHeaders = HEADERS[moduleKey] || [];
  for (let i = 0; i < Math.min(values.length, 5); i++) {
    const rowText = values[i].join('|');
    if (expectedHeaders.length && expectedHeaders.every(h => rowText.indexOf(h) !== -1)) {
      headerRowIdx = i;
      break;
    }
  }
  const headers = values[headerRowIdx].map(h => String(h).trim()).filter(h => h.length > 0);
  const rows = [];
  for (let i = headerRowIdx + 1; i < values.length; i++) {
    const row = values[i];
    if (row.every(c => c === '' || c === null)) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = formatCell(row[idx]); });
    obj.__rowIndex = i + 1; // 1-based sheet row number
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

function formatCell(val) {
  if (val instanceof Date) {
    const d = val;
    // Las celdas que guardan SOLO una hora (sin fecha) quedan almacenadas
    // por Google Sheets como "30/12/1899 + esa hora" (es el día cero de
    // Sheets/Excel). Si detectamos exactamente ese día, es una hora pura:
    // mostramos HH:MM en vez de la fecha completa.
    if (d.getFullYear() === 1899 && d.getMonth() === 11 && d.getDate() === 30) {
      const hh = ('0' + d.getHours()).slice(-2);
      const min = ('0' + d.getMinutes()).slice(-2);
      return hh + ':' + min;
    }
    const dd = ('0' + d.getDate()).slice(-2);
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
  }
  return val;
}

/**
 * Devuelve los encabezados TAL COMO están, literalmente, en la fila 1 de
 * la hoja real (no el array fijo HEADERS de este script). Esto es clave:
 * si tu Google Sheet (armada a partir del Excel original) tiene las
 * columnas en un orden distinto al que este script asume, escribir por
 * posición fija corre los datos a la columna equivocada. Buscando el
 * nombre real de cada columna evitamos ese problema por completo, sin
 * importar el orden en que estén.
 * Si la hoja está recién creada (sin encabezados), escribe los de
 * HEADERS[moduleKey] como fila 1 y los devuelve.
 * ADEMÁS: si a la hoja le falta alguna columna que el módulo necesita
 * (por ejemplo, "Teléfono" en Agenda), la agrega sola al final — así no
 * hay que tocar la planilla a mano para que un campo empiece a guardarse.
 */
function getHeaderRow(sheet, moduleKey) {
  const lastCol = sheet.getLastColumn();
  let headers;
  if (lastCol === 0) {
    const defaults = HEADERS[moduleKey] || [];
    if (defaults.length) sheet.appendRow(defaults);
    return defaults;
  }
  const values = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  headers = values.map(h => String(h).trim()).filter(h => h.length > 0);
  if (headers.length === 0) headers = HEADERS[moduleKey] || [];

  const expected = HEADERS[moduleKey] || [];
  const faltantes = expected.filter(h => !headers.some(real => normalizeKey(real) === normalizeKey(h)));
  if (faltantes.length > 0) {
    const startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, faltantes.length).setValues([faltantes]);
    headers = headers.concat(faltantes);
  }
  return headers;
}

/**
 * Revierte el error de codificación más común al copiar/pegar texto con
 * tildes entre distintas apps ("mojibake"): un caracter como "é" termina
 * guardado como "Ã©" porque sus bytes UTF-8 se reinterpretaron como
 * Latin-1. Si detecta ese patrón, reconstruye el texto correcto.
 */
function looksMojibake(s) {
  return /Ã.|Â./.test(s);
}
function fixMojibake(s) {
  if (!looksMojibake(s)) return s;
  try {
    const codes = [];
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c > 255) return s; // no es el patrón típico, no tocar
      codes.push(c);
    }
    return Utilities.newBlob(codes).getDataAsString('UTF-8');
  } catch (e) {
    return s;
  }
}

/**
 * Quita tildes, espacios extra y diferencias de mayúsculas/minúsculas, y
 * corrige mojibake y la diferencia "N°" vs "Nº", para poder comparar
 * nombres de columna de forma tolerante sin importar cómo haya quedado
 * exactamente escrito el encabezado en tu hoja o en este script.
 */
function normalizeKey(s) {
  const clean = fixMojibake(String(s || ''));
  return clean
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[°º]/g, '')
    .replace(/\s+/g, ' ')
    .trim().toLowerCase();
}

/**
 * Arma el array de valores a escribir en una fila, respetando el orden
 * REAL de columnas de la hoja (headers), buscando cada dato en rowObj
 * primero por coincidencia exacta y, si no la encuentra, por coincidencia
 * "tolerante" (sin tildes/mayúsculas/espacios). Esto es lo que evita que
 * los campos queden corridos cuando el orden o el texto exacto de las
 * columnas de tu hoja no coincide 100% con el de este script.
 */
function buildRowValues(headers, rowObj) {
  const normalizedObj = {};
  Object.keys(rowObj).forEach(k => { normalizedObj[normalizeKey(k)] = rowObj[k]; });
  return headers.map(h => {
    if (rowObj[h] !== undefined) return rowObj[h];
    const viaNormalizado = normalizedObj[normalizeKey(h)];
    return viaNormalizado !== undefined ? viaNormalizado : '';
  });
}

function getAllData() {
  const result = {};
  Object.keys(SHEETS).forEach(key => {
    try {
      result[key] = getModuleData(key);
    } catch (err) {
      result[key] = { headers: HEADERS[key] || [], rows: [], error: err.message };
    }
  });
  return result;
}

function addRow(moduleKey, rowObj) {
  if (moduleKey === 'agenda') {
    if (!rowObj['Teléfono']) {
      rowObj['Teléfono'] = buscarDatoPaciente(rowObj['Paciente'], 'Teléfono');
    }
    if (!rowObj['Email']) {
      rowObj['Email'] = buscarDatoPaciente(rowObj['Paciente'], 'Email');
    }
  }

  // Teleconsultas cargadas DIRECTO en su propio módulo (no vía Agenda):
  // si no se cargó un link, se genera automáticamente acá también.
  if (moduleKey === 'teleconsultas') {
    if (!rowObj['Link Meet / Zoom']) {
      rowObj['Link Meet / Zoom'] = crearLinkMeetSeguro(rowObj['Paciente'], rowObj['Fecha'], rowObj['Hora']);
    }
  }

  const sheet = getSheet(moduleKey);
  const headers = getHeaderRow(sheet, moduleKey);
  const rowValues = buildRowValues(headers, rowObj);
  sheet.appendRow(rowValues);

  // Si se agenda un turno en modalidad Teleconsulta, crear automáticamente
  // el registro correspondiente en el módulo Teleconsultas con el link de Meet.
  if (moduleKey === 'agenda') {
    let meetLink = '';
    if (rowObj['Modalidad'] === 'Teleconsulta') {
      meetLink = crearTeleconsultaDesdeAgenda(rowObj);
    }
    rowObj['__meetLink'] = meetLink;
    enviarRecordatorioMail(rowObj);
  }
}

function updateRow(moduleKey, rowIndex, rowObj) {
  let modalidadCambioATele = false;
  if (moduleKey === 'agenda') {
    if (!rowObj['Teléfono']) {
      rowObj['Teléfono'] = buscarDatoPaciente(rowObj['Paciente'], 'Teléfono');
    }
    if (!rowObj['Email']) {
      rowObj['Email'] = buscarDatoPaciente(rowObj['Paciente'], 'Email');
    }
    if (rowObj['Modalidad'] === 'Teleconsulta') {
      try {
        const sheetCheck = getSheet('agenda');
        const headersCheck = getHeaderRow(sheetCheck, 'agenda');
        const prevValues = sheetCheck.getRange(rowIndex, 1, 1, headersCheck.length).getValues()[0];
        const modalidadIdx = headersCheck.indexOf('Modalidad');
        const prevModalidad = modalidadIdx >= 0 ? prevValues[modalidadIdx] : null;
        if (prevModalidad !== 'Teleconsulta') modalidadCambioATele = true;
      } catch (err) {
        modalidadCambioATele = false;
      }
    }
  }

  // Igual que en addRow: si es el módulo Teleconsultas y se guarda sin
  // link, se genera automáticamente antes de escribir la fila.
  if (moduleKey === 'teleconsultas') {
    if (!rowObj['Link Meet / Zoom']) {
      rowObj['Link Meet / Zoom'] = crearLinkMeetSeguro(rowObj['Paciente'], rowObj['Fecha'], rowObj['Hora']);
    }
  }

  const sheet = getSheet(moduleKey);
  const headers = getHeaderRow(sheet, moduleKey);
  const rowValues = buildRowValues(headers, rowObj);
  sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);

  if (modalidadCambioATele) {
    const meetLink = crearTeleconsultaDesdeAgenda(rowObj);
    rowObj['__meetLink'] = meetLink;
  }
}

/**
 * Genera (o regenera) el link de Meet para una fila puntual del módulo
 * Teleconsultas y lo escribe directo en la celda correspondiente.
 * La usa el botón "🎥 Generar link de Meet" de la tabla, para las filas
 * que quedaron con el campo vacío.
 */
function generarMeetParaFila(moduleKey, rowIndex, rowObj) {
  if (moduleKey !== 'teleconsultas') {
    throw new Error('Esta acción solo está disponible para Teleconsultas.');
  }
  const link = crearLinkMeetSeguro(rowObj['Paciente'], rowObj['Fecha'], rowObj['Hora']);
  const sheet = getSheet('teleconsultas');
  const headers = getHeaderRow(sheet, 'teleconsultas');
  const colIdx = headers.indexOf('Link Meet / Zoom') + 1;
  if (colIdx > 0 && rowIndex) {
    sheet.getRange(rowIndex, colIdx).setValue(link);
  }
  return link;
}

/**
 * A partir de una fila de Agenda (paciente, fecha, hora), genera el link
 * de Meet y agrega automáticamente el registro correspondiente en el
 * módulo Teleconsultas, listo para enviar al paciente.
 */
function crearTeleconsultaDesdeAgenda(agendaRow) {
  const link = crearLinkMeetSeguro(agendaRow['Paciente'], agendaRow['Fecha'], agendaRow['Hora']);

  const teleRow = {
    'Paciente': agendaRow['Paciente'] || '',
    'Fecha': agendaRow['Fecha'] || '',
    'Hora': agendaRow['Hora'] || '',
    'Link Meet / Zoom': link,
    'Pagó': agendaRow['Cobró'] === 'Sí' ? 'Sí' : 'No',
    'Receta enviada': '',
    'Control programado': '',
    'Link alternativo': '',
    'Consentimiento': 'Pendiente'
  };

  const sheet = getSheet('teleconsultas');
  const headers = getHeaderRow(sheet, 'teleconsultas');
  const rowValues = buildRowValues(headers, teleRow);
  sheet.appendRow(rowValues);
  return link;
}

function deleteRow(moduleKey, rowIndex) {
  const sheet = getSheet(moduleKey);
  sheet.deleteRow(rowIndex);
}

/**
 * Sube un archivo (PDF o imagen) recibido en base64 a una carpeta de Drive
 * dedicada, organizada en subcarpetas por módulo, y devuelve el link para
 * ver/descargar el archivo.
 */
function subirArchivoADrive(fileName, mimeType, base64Data, moduleKey) {
  const rootFolder = getOrCreateFolder(DRIVE_FOLDER_NAME, DriveApp.getRootFolder());
  const subFolderName = moduleKey || 'General';
  const subFolder = getOrCreateFolder(subFolderName, rootFolder);

  const bytes = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = subFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function getOrCreateFolder(name, parent) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

/**
 * Envía un mail de recordatorio de turno al paciente. Se dispara al
 * agendar un turno en Agenda, si el paciente tiene email cargado.
 */
function enviarRecordatorioMail(agendaRow) {
  const email = buscarDatoPaciente(agendaRow['Paciente'], 'Email');
  if (!email) return;

  const modalidad = agendaRow['Modalidad'] || 'Presencial';
  const fecha = agendaRow['Fecha'] || '';
  const hora = agendaRow['Hora'] || '';

  let cuerpo = `Hola ${agendaRow['Paciente'] || ''},\n\n` +
    `Le recordamos su turno con el Dr. Ciavarelli:\n\n` +
    `Fecha: ${fecha}\nHora: ${hora}\nModalidad: ${modalidad}\n`;

  if (modalidad === 'Teleconsulta' && agendaRow['__meetLink']) {
    cuerpo += `\nLink de la videoconsulta: ${agendaRow['__meetLink']}\n`;
  }
  cuerpo += `\nAnte cualquier consulta, no dude en contactarnos.\n\nConsultorio Dr. Ciavarelli`;

  try {
    MailApp.sendEmail(email, 'Recordatorio de turno - Dr. Ciavarelli', cuerpo);
  } catch (err) {
    // Si falla el envío (email inválido, etc.) no bloquea el resto del flujo.
  }
}

/**
 * Busca un dato del paciente (Teléfono, Email, etc.) en la hoja de Pacientes
 * a partir del nombre completo "Apellido, Nombre" o similar.
 */
function buscarDatoPaciente(nombrePaciente, campo) {
  if (!nombrePaciente) return '';
  try {
    const data = getModuleData('pacientes');
    const nombreNorm = String(nombrePaciente).trim().toLowerCase();
    const match = data.rows.find(r => {
      const full1 = `${r['Apellido']}, ${r['Nombre']}`.trim().toLowerCase();
      const full2 = `${r['Nombre']} ${r['Apellido']}`.trim().toLowerCase();
      return full1 === nombreNorm || full2 === nombreNorm || nombreNorm.indexOf((r['Apellido']||'').toLowerCase()) !== -1;
    });
    return match ? (match[campo] || '') : '';
  } catch (err) {
    return '';
  }
}

function saveModuleData(moduleKey, rows) {
  const sheet = getSheet(moduleKey);
  const headers = HEADERS[moduleKey];
  sheet.clear();
  sheet.appendRow(headers);
  if (rows && rows.length > 0) {
    const values = rows.map(r => headers.map(h => r[h] !== undefined ? r[h] : ''));
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }
}

/**
 * Función de DIAGNÓSTICO. Ejecutala manualmente desde el editor de Apps
 * Script (seleccioná "testCalendarMeet" en el desplegable de funciones y
 * apretá ▶ Ejecutar) para:
 *  a) forzar el pedido de autorización del scope de Calendar si todavía
 *     no se otorgó (esto es lo que suele romper el link cuando se habilitó
 *     el servicio DESPUÉS de haber hecho la primera implementación), y
 *  b) ver en los Registros de ejecución si el link se generó bien o
 *     qué error concreto está devolviendo Calendar.
 * Después de correrla una vez y aceptar los permisos, hacé de nuevo
 * "Implementar > Nueva implementación" para que la app web use el permiso
 * ya otorgado.
 */
function testCalendarMeet() {
  const link = crearLinkMeetSeguro('Paciente de prueba', '', '');
  Logger.log('Link generado: ' + link);
}

/**
 * Función de DIAGNÓSTICO. Ejecutala manualmente (elegí "diagnosticarEncabezados"
 * en el desplegable de funciones y apretá ▶ Ejecutar) para comparar, hoja por
 * hoja, los encabezados que este script espera contra los que realmente tiene
 * cada pestaña de tu Google Sheet. Mirá el resultado en Ver > Registros de
 * ejecución. Si ves una columna marcada "❌ FALTA EN LA HOJA", esa columna
 * no existe con ese nombre exacto en tu planilla y conviene agregarla o
 * renombrarla para que coincida (o avisame el nombre real que tiene y lo
 * ajusto en el script).
 */
function diagnosticarEncabezados() {
  Object.keys(SHEETS).forEach(moduleKey => {
    const sheet = getSheet(moduleKey);
    const real = getHeaderRow(sheet, moduleKey);
    const esperados = HEADERS[moduleKey] || [];
    Logger.log('--- ' + SHEETS[moduleKey] + ' ---');
    Logger.log('Orden real en la hoja: ' + real.join(' | '));
    esperados.forEach(h => {
      const encontrado = real.some(r => normalizeKey(r) === normalizeKey(h));
      if (!encontrado) Logger.log('❌ FALTA EN LA HOJA: "' + h + '"');
    });
  });
  Logger.log('Diagnóstico terminado. Revisá arriba si hay líneas "❌ FALTA".');
}
