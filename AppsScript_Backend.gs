/**
 * BACKEND - Consultorio Dr. Ciavarelli
 * ---------------------------------------------------
 * INSTALACIÃ“N:
 * 1. AbrÃ­ tu Google Sheet "Consultorio_Dr_Ciavarelli_MAESTRO".
 * 2. MenÃº Extensiones > Apps Script.
 * 3. BorrÃ¡ el contenido de Code.gs y pegÃ¡ TODO este archivo.
 * 4. Arriba a la derecha, botÃ³n "Implementar" > "Nueva implementaciÃ³n".
 * 5. Tipo: "AplicaciÃ³n web". Ejecutar como: "Yo". QuiÃ©n tiene acceso: "Cualquier usuario".
 * 6. CopiÃ¡ la URL que te da ("URL de la aplicaciÃ³n web") y pegala en la app
 *    web cuando te la pida (icono de engranaje / ConfiguraciÃ³n).
 * 7. Cada vez que modifiques este script, tenÃ©s que crear una "Nueva
 *    implementaciÃ³n" de nuevo para que los cambios tomen efecto.
 * ---------------------------------------------------
 */

const SPREADSHEET_ID = '1gXeP_AGWLHLWERC_hdnOqkKblG2dbxRcKwefqIY4GZc';

// Carpeta de Drive donde se guardan los adjuntos (PDF/imÃ¡genes). Se crea sola
// la primera vez que se sube un archivo, dentro de "Mi unidad".
const DRIVE_FOLDER_NAME = 'Consultorio Dr. Ciavarelli - Adjuntos';

// DirecciÃ³n desde la que se intentan mandar los recordatorios de turno.
// Tiene que estar habilitada como "Enviar correo como" en la cuenta de
// Gmail que ejecuta este script (Gmail > ConfiguraciÃ³n > Cuentas), o el
// script directamente implementado con "Ejecutar como" esta cuenta.
const CONSULTORIO_EMAIL_ADDRESS = 'consultorio.ciavarelli@gmail.com';

const SHEETS = {
  pacientes: '1-Pacientes',
  agenda: '2-Agenda',
  facturacion: '3-FacturaciÃ³n',
  obrasSociales: '4-Obras Sociales',
  convenios: '5-Convenios',
  teleconsultas: '6-Teleconsultas',
  cobros: '7-Cobros',
  reintegros: '8-Reintegros',
  checklist: '9-Checklist',
  estadisticas: '10-EstadÃ­sticas',
  cirugias: '11-CirugÃ­as',
  informesQx: '12-Informes Qx',
  liquidaciones: '13-Liquidaciones',
  facturacionQx: '14-FacturaciÃ³n Qx'
};

const HEADERS = {
  pacientes: ['Apellido','Nombre','TelÃ©fono','Email','Obra Social / Prepaga','Plan','NÂ° de Afiliado','Fecha de Nacimiento','Domicilio','1Âª Consulta','Ãšltimo Control','PrÃ³ximo Turno','Observaciones'],
  agenda: ['Fecha','Hora','Paciente','TelÃ©fono','Email','Modalidad','Estado','CobrÃ³','Importe ($)','NÂ° Factura','Observaciones','Link de pago'],
  facturacion: ['Fecha','Paciente','NÂ° Factura','Concepto','Importe ($)','IVA','Total ($)','Cobrado','Medio de Pago'],
  obrasSociales: ['Obra Social / Prepaga','Estado del TrÃ¡mite','Usuario / RNOS','Clave','Vencimiento Credencial','Observaciones'],
  convenios: ['Financiador','Tipo de Convenio','DocumentaciÃ³n presentada','Estado','Observaciones'],
  teleconsultas: ['Paciente','Fecha','Hora','Link Meet / Zoom','PagÃ³','Receta enviada','Control programado','Link alternativo','Consentimiento'],
  cobros: ['Fecha','Paciente','Transferencia ($)','Mercado Pago ($)','Efectivo ($)','Pendiente ($)','NÂ° Factura'],
  reintegros: ['Paciente','Obra Social','NÂ° Factura enviada','Fecha de envÃ­o','Estado','Observaciones'],
  checklist: ['Tarea','Vencimiento','Realizado','Observaciones','Categoria'],
  cirugias: ['NÂ° CX','Fecha','Paciente','InstituciÃ³n','Tipo de cirugÃ­a','DiagnÃ³stico','Modalidad','Obra Social','Ayudante','Anestesista','Instrumentadora','Estado','Link Drive','Observaciones'],
  informesQx: ['NÂ° CX','Fecha','Paciente','Tipo de cirugÃ­a','DescripciÃ³n del procedimiento','Hallazgos intraoperatorios','Indicaciones postoperatorias','Estado del informe','Enviado a','Archivo adjunto'],
  liquidaciones: ['NÂ° CX','Fecha','Paciente','Obra Social / Financiador','Concepto','Importe ($)','Estado','Observaciones','Archivo adjunto'],
  facturacionQx: ['NÂ° CX','Fecha','Paciente','Obra Social','Hon. Cirujano ($)','Hon. Ayudante ($)','Hon. Anestesista ($)','Total ($)','NÂ° Factura','Fecha presentaciÃ³n','Fecha acreditaciÃ³n','Estado cobro','Observaciones','Archivo adjunto']
};

function doGet(e) {
  try {
    // Webhook de Mercado Pago: cuando un pago se aprueba, MP llama a esta
    // misma URL con parÃ¡metros propios (no manda "action"). Lo detectamos
    // asÃ­ y confirmamos el turno correspondiente automÃ¡ticamente.
    if (e.parameter.type === 'payment' || e.parameter.topic === 'payment') {
      return manejarWebhookMercadoPago(e);
    }
    const action = e.parameter.action || 'getAll';
    if (action === 'getAll') {
      return jsonOut(getAllData());
    }
    if (action === 'get') {
      const module = e.parameter.module;
      return jsonOut(getModuleData(module));
    }
    if (action === 'getConfigMP') {
      return jsonOut(getConfigMercadoPagoStatus());
    }
    return jsonOut({ error: 'AcciÃ³n no reconocida' });
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
    if (action === 'enviarLinkTeleconsulta') {
      enviarLinkTeleconsulta(body.row);
      return jsonOut({ success: true });
    }
    if (action === 'guardarConfigMP') {
      guardarConfigMercadoPago(body.publicKey, body.accessToken);
      return jsonOut({ success: true });
    }
    if (action === 'generarLinkPago') {
      const link = generarLinkPago(body.rowIndex, body.row);
      return jsonOut({ success: true, link: link });
    }
    return jsonOut({ error: 'AcciÃ³n no reconocida' });
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
 * y devuelve el link generado. Se usa para el mÃ³dulo Teleconsultas.
 * Usa la API avanzada de Calendar (Calendar v3) para forzar la creaciÃ³n
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
    description: 'Teleconsulta generada automÃ¡ticamente desde el sistema del consultorio.',
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
 * falla por el motivo que sea (no habilitado, falta de autorizaciÃ³n,
 * cuota, etc.) NUNCA deja el campo vacÃ­o: registra el error en el log
 * (Ver > Registros de ejecuciÃ³n en el editor de Apps Script, o Ejecuciones
 * en el panel izquierdo) y devuelve un link de reuniÃ³n instantÃ¡nea de
 * Meet como respaldo, que funciona siempre sin depender de ningÃºn
 * servicio adicional.
 */
function crearLinkMeetSeguro(paciente, fechaStr, horaStr) {
  try {
    const link = crearLinkMeet(paciente, fechaStr, horaStr);
    if (link) return link;
    console.error('crearLinkMeet devolviÃ³ un link vacÃ­o para: ' + paciente);
  } catch (err) {
    console.error('Error generando link de Meet para ' + paciente + ': ' + err.message);
  }
  // Respaldo: reuniÃ³n instantÃ¡nea de Meet. Se comparte igual que un link
  // programado; al abrirla se crea la sala en el momento.
  return 'https://meet.google.com/new';
}

function getSheet(moduleKey) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = SHEETS[moduleKey];
  if (!sheetName) throw new Error('MÃ³dulo desconocido: ' + moduleKey);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // El nombre exacto no matcheÃ³ (puede pasar si el texto con tildes se
    // corrompiÃ³ al copiar el script). Antes de crear una pestaÃ±a nueva
    // (y duplicar datos), buscamos tolerando tildes/mayÃºsculas/errores de
    // codificaciÃ³n por si la pestaÃ±a correcta ya existe con otro texto.
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
    // por Google Sheets como "30/12/1899 + esa hora" (es el dÃ­a cero de
    // Sheets/Excel). Si detectamos exactamente ese dÃ­a, es una hora pura:
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
 * Devuelve los encabezados TAL COMO estÃ¡n, literalmente, en la fila 1 de
 * la hoja real (no el array fijo HEADERS de este script). Esto es clave:
 * si tu Google Sheet (armada a partir del Excel original) tiene las
 * columnas en un orden distinto al que este script asume, escribir por
 * posiciÃ³n fija corre los datos a la columna equivocada. Buscando el
 * nombre real de cada columna evitamos ese problema por completo, sin
 * importar el orden en que estÃ©n.
 * Si la hoja estÃ¡ reciÃ©n creada (sin encabezados), escribe los de
 * HEADERS[moduleKey] como fila 1 y los devuelve.
 * ADEMÃS: si a la hoja le falta alguna columna que el mÃ³dulo necesita
 * (por ejemplo, "TelÃ©fono" en Agenda), la agrega sola al final â€” asÃ­ no
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
 * Revierte el error de codificaciÃ³n mÃ¡s comÃºn al copiar/pegar texto con
 * tildes entre distintas apps ("mojibake"): un caracter como "Ã©" termina
 * guardado como "ÃƒÂ©" porque sus bytes UTF-8 se reinterpretaron como
 * Latin-1. Si detecta ese patrÃ³n, reconstruye el texto correcto.
 */
function looksMojibake(s) {
  return /Ãƒ.|Ã‚./.test(s);
}
function fixMojibake(s) {
  if (!looksMojibake(s)) return s;
  try {
    const codes = [];
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c > 255) return s; // no es el patrÃ³n tÃ­pico, no tocar
      codes.push(c);
    }
    return Utilities.newBlob(codes).getDataAsString('UTF-8');
  } catch (e) {
    return s;
  }
}

/**
 * Quita tildes, espacios extra y diferencias de mayÃºsculas/minÃºsculas, y
 * corrige mojibake y la diferencia "NÂ°" vs "NÂº", para poder comparar
 * nombres de columna de forma tolerante sin importar cÃ³mo haya quedado
 * exactamente escrito el encabezado en tu hoja o en este script.
 */
function normalizeKey(s) {
  const clean = fixMojibake(String(s || ''));
  return clean
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[Â°Âº]/g, '')
    .replace(/\s+/g, ' ')
    .trim().toLowerCase();
}

/**
 * Arma el array de valores a escribir en una fila, respetando el orden
 * REAL de columnas de la hoja (headers), buscando cada dato en rowObj
 * primero por coincidencia exacta y, si no la encuentra, por coincidencia
 * "tolerante" (sin tildes/mayÃºsculas/espacios). Esto es lo que evita que
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
    if (!rowObj['TelÃ©fono']) {
      rowObj['TelÃ©fono'] = buscarDatoPaciente(rowObj['Paciente'], 'TelÃ©fono');
    }
    if (!rowObj['Email']) {
      rowObj['Email'] = buscarDatoPaciente(rowObj['Paciente'], 'Email');
    }
  }

  // Teleconsultas cargadas DIRECTO en su propio mÃ³dulo (no vÃ­a Agenda):
  // si no se cargÃ³ un link, se genera automÃ¡ticamente acÃ¡ tambiÃ©n.
  if (moduleKey === 'teleconsultas') {
    if (!rowObj['Link Meet / Zoom']) {
      rowObj['Link Meet / Zoom'] = crearLinkMeetSeguro(rowObj['Paciente'], rowObj['Fecha'], rowObj['Hora']);
    }
  }

  const sheet = getSheet(moduleKey);
  const headers = getHeaderRow(sheet, moduleKey);
  const rowValues = buildRowValues(headers, rowObj);
  sheet.appendRow(rowValues);

  // Si se agenda un turno en modalidad Teleconsulta, crear automÃ¡ticamente
  // el registro correspondiente en el mÃ³dulo Teleconsultas con el link de Meet.
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
    if (!rowObj['TelÃ©fono']) {
      rowObj['TelÃ©fono'] = buscarDatoPaciente(rowObj['Paciente'], 'TelÃ©fono');
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

  // Igual que en addRow: si es el mÃ³dulo Teleconsultas y se guarda sin
  // link, se genera automÃ¡ticamente antes de escribir la fila.
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
 * Genera (o regenera) el link de Meet para una fila puntual del mÃ³dulo
 * Teleconsultas y lo escribe directo en la celda correspondiente.
 * La usa el botÃ³n "ðŸŽ¥ Generar link de Meet" de la tabla, para las filas
 * que quedaron con el campo vacÃ­o.
 */
function generarMeetParaFila(moduleKey, rowIndex, rowObj) {
  if (moduleKey !== 'teleconsultas') {
    throw new Error('Esta acciÃ³n solo estÃ¡ disponible para Teleconsultas.');
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
 * de Meet y agrega automÃ¡ticamente el registro correspondiente en el
 * mÃ³dulo Teleconsultas, listo para enviar al paciente.
 */
function crearTeleconsultaDesdeAgenda(agendaRow) {
  const link = crearLinkMeetSeguro(agendaRow['Paciente'], agendaRow['Fecha'], agendaRow['Hora']);

  const teleRow = {
    'Paciente': agendaRow['Paciente'] || '',
    'Fecha': agendaRow['Fecha'] || '',
    'Hora': agendaRow['Hora'] || '',
    'Link Meet / Zoom': link,
    'PagÃ³': agendaRow['CobrÃ³'] === 'SÃ­' ? 'SÃ­' : 'No',
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
 * dedicada, organizada en subcarpetas por mÃ³dulo, y devuelve el link para
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
 * EnvÃ­a un mail de recordatorio de turno al paciente. Se dispara al
 * agendar un turno en Agenda, si el paciente tiene email cargado.
 */
function enviarRecordatorioMail(agendaRow) {
  const email = buscarDatoPaciente(agendaRow['Paciente'], 'Email') || agendaRow['Email'];
  if (!email) return;

  const modalidad = agendaRow['Modalidad'] || 'Presencial';
  const fecha = agendaRow['Fecha'] || '';
  const hora = agendaRow['Hora'] || '';

  let cuerpo = `Hola ${agendaRow['Paciente'] || ''},\n\n` +
    `Le recordamos su turno con el Dr. Ciavarelli:\n\n` +
    `Fecha: ${fecha}\nHora: ${hora}\nModalidad: ${modalidad}\n`;

  if (modalidad === 'Teleconsulta') {
    // El link de conexiÃ³n NO se manda en este primer recordatorio: se
    // envÃ­a aparte (ver enviarLinkTeleconsulta) reciÃ©n una vez que el
    // paciente prestÃ³ conformidad y abonÃ³ la consulta.
    cuerpo += `\nAl optar por la modalidad de teleconsulta, usted presta ` +
      `su conformidad para ser atendido/a bajo esta modalidad.\n` +
      `El link de conexiÃ³n a la videoconsulta le serÃ¡ enviado en un ` +
      `mensaje aparte una vez confirmado el pago.\n`;
    // TODO: cuando estÃ© disponible el link de pago (Mercado Pago), agregar
    // acÃ¡: `\nPuede abonar su turno desde este link: ${agendaRow['Link de pago']}\n`
  } else {
    // TODO: cuando el consultorio fÃ­sico estÃ© alquilado, agregar acÃ¡ la
    // direcciÃ³n: `\nDirecciÃ³n: ${DOMICILIO_CONSULTORIO}\n`
  }
  cuerpo += `\nAnte cualquier consulta, no dude en contactarnos.\n\nConsultorio Dr. Ciavarelli`;

  enviarMailComoConsultorio(email, 'Recordatorio de turno - Dr. Ciavarelli', cuerpo);
}

/**
 * EnvÃ­a el link de conexiÃ³n a la videoconsulta, POR SEPARADO del
 * recordatorio de turno. Pensado para dispararse a mano (botÃ³n "ðŸ“¤ Enviar
 * link" en la tabla de Teleconsultas) reciÃ©n cuando el paciente ya prestÃ³
 * conformidad (columna "Consentimiento" = SÃ­) y abonÃ³ (columna "PagÃ³" =
 * SÃ­). No lo manda solo â€” es una decisiÃ³n del profesional apretar el
 * botÃ³n, hasta que el pago se confirme automÃ¡ticamente vÃ­a Mercado Pago.
 */
function enviarLinkTeleconsulta(teleconsultaRow) {
  const email = buscarDatoPaciente(teleconsultaRow['Paciente'], 'Email');
  if (!email) throw new Error('El paciente "' + teleconsultaRow['Paciente'] + '" no tiene email cargado en Pacientes.');
  const link = teleconsultaRow['Link Meet / Zoom'];
  if (!link) throw new Error('Esta teleconsulta todavÃ­a no tiene un link de Meet generado.');

  const cuerpo = `Hola ${teleconsultaRow['Paciente'] || ''},\n\n` +
    `Su turno de teleconsulta con el Dr. Ciavarelli fue confirmado.\n\n` +
    `Link de conexiÃ³n: ${link}\n` +
    (teleconsultaRow['Fecha'] ? `Fecha: ${teleconsultaRow['Fecha']}\n` : '') +
    (teleconsultaRow['Hora'] ? `Hora: ${teleconsultaRow['Hora']}\n` : '') +
    `\nAnte cualquier consulta, no dude en contactarnos.\n\nConsultorio Dr. Ciavarelli`;

  enviarMailComoConsultorio(email, 'Link de conexiÃ³n - Teleconsulta Dr. Ciavarelli', cuerpo);
}

/**
 * EnvÃ­o de mail centralizado: intenta salir desde
 * consultorio.ciavarelli@gmail.com (requiere que esa direcciÃ³n estÃ© dada
 * de alta como "Enviar correo como" en Gmail de la cuenta que ejecuta el
 * script, o que el script estÃ© implementado directamente "Ejecutar como"
 * esa cuenta) y, si falla, cae en MailApp como respaldo para no perder el
 * envÃ­o.
 */
function enviarMailComoConsultorio(destinatario, asunto, cuerpo) {
  try {
    GmailApp.sendEmail(destinatario, asunto, cuerpo, {
      from: CONSULTORIO_EMAIL_ADDRESS,
      name: 'Consultorio Dr. Ciavarelli'
    });
  } catch (err) {
    try {
      MailApp.sendEmail(destinatario, asunto, cuerpo, { name: 'Consultorio Dr. Ciavarelli' });
    } catch (err2) {
      // Si falla el envÃ­o (email invÃ¡lido, etc.) no bloquea el resto del flujo.
    }
  }
}

/**
 * Busca un dato del paciente (TelÃ©fono, Email, etc.) en la hoja de Pacientes
 * a partir del nombre completo "Apellido, Nombre" o similar.
 */
function buscarDatoPaciente(nombrePaciente, campo) {
  if (!nombrePaciente) return '';
  try {
    const data = getModuleData('pacientes');
    const nombreNorm = normalizeKey(nombrePaciente);
    const match = data.rows.find(r => {
      const apellido = normalizeKey(r['Apellido'] || '');
      const nombre = normalizeKey(r['Nombre'] || '');
      const full1 = normalizeKey(`${r['Apellido']}, ${r['Nombre']}`);
      const full2 = normalizeKey(`${r['Nombre']} ${r['Apellido']}`);
      return full1 === nombreNorm || full2 === nombreNorm ||
        (apellido.length > 0 && nombreNorm.indexOf(apellido) !== -1) ||
        (nombre.length > 0 && nombreNorm.indexOf(nombre) !== -1);
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
 * --- Mercado Pago: guardado de credenciales (preparaciÃ³n) ---
 * Guardamos el Public Key y el Access Token en las "Propiedades del
 * script" (PropertiesService), NO en el Sheet ni en el cÃ³digo: es el
 * lugar correcto para datos sensibles en Apps Script â€” no se puede leer
 * desde afuera, no viaja en las respuestas JSON de la app, y asÃ­ una vez
 * cargados quedan guardados para siempre sin tener que volver a tocar el
 * script. El Access Token nunca se devuelve completo a la web, solo un
 * indicador de si estÃ¡ cargado (para no exponerlo en el navegador).
 * Esto es SOLO el guardado de las claves â€” el flujo de pago en sÃ­
 * (generar la preferencia de pago, el webhook de confirmaciÃ³n, etc.) se
 * arma en un paso aparte una vez que definamos cÃ³mo va a reservar el
 * paciente el turno.
 */
function guardarConfigMercadoPago(publicKey, accessToken) {
  const props = PropertiesService.getScriptProperties();
  if (publicKey !== undefined) props.setProperty('MP_PUBLIC_KEY', publicKey || '');
  if (accessToken !== undefined && accessToken !== 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢') {
    // Si el front-end manda el valor enmascarado (porque el usuario no
    // tocÃ³ el campo), no lo pisamos con eso.
    props.setProperty('MP_ACCESS_TOKEN', accessToken || '');
  }
}

function getConfigMercadoPagoStatus() {
  const props = PropertiesService.getScriptProperties();
  const publicKey = props.getProperty('MP_PUBLIC_KEY') || '';
  const accessToken = props.getProperty('MP_ACCESS_TOKEN') || '';
  return {
    publicKeyConfigured: publicKey.length > 0,
    accessTokenConfigured: accessToken.length > 0,
    // El Public Key no es secreto (se usa del lado del navegador en la
    // integraciÃ³n real de Mercado Pago), asÃ­ que se puede devolver entero.
    publicKey: publicKey
  };
}

/**
 * --- Mercado Pago: flujo elegido ---
 * Vos (o tu staff) cargan el turno en Agenda como siempre. Con este botÃ³n
 * se genera un link de pago real de Mercado Pago (Checkout Pro) para ESE
 * turno puntual, tomando el campo "Importe ($)" de la fila. El link se
 * guarda solo en la columna "Link de pago" de Agenda, listo para copiar y
 * mandar por WhatsApp o mail. Cuando el paciente paga, Mercado Pago avisa
 * solo (webhook) y el sistema marca "CobrÃ³" = SÃ­ automÃ¡ticamente.
 */
function generarLinkPago(rowIndex, row) {
  const token = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
  if (!token) {
    throw new Error('TodavÃ­a no cargaste el Access Token de Mercado Pago (botÃ³n ðŸ’³ Mercado Pago en la web).');
  }
  const importe = parseFloat(row['Importe ($)']);
  if (!importe || importe <= 0) {
    throw new Error('CargÃ¡ un "Importe ($)" mayor a 0 en el turno antes de generar el link de pago.');
  }
  if (!rowIndex) {
    throw new Error('GuardÃ¡ el turno primero (necesita existir en la hoja) antes de generar el link de pago.');
  }

  const payload = {
    items: [{
      title: 'Turno - ' + (row['Paciente'] || 'Consultorio Dr. Ciavarelli'),
      quantity: 1,
      unit_price: importe,
      currency_id: 'ARS'
    }],
    // Con esto identificamos, cuando llega la confirmaciÃ³n de pago, a QUÃ‰
    // fila de Agenda corresponde (ver manejarWebhookMercadoPago).
    external_reference: 'agenda_' + rowIndex,
    // Mercado Pago va a avisar acÃ¡ mismo (esta URL de la web app) cuando
    // el pago se confirme.
    notification_url: ScriptApp.getService().getUrl()
    // Nota: no configuramos "back_urls" (a dÃ³nde vuelve el paciente
    // despuÃ©s de pagar) porque todavÃ­a no hay una pÃ¡gina pÃºblica propia
    // para mostrarle. Mientras tanto, Mercado Pago le muestra su propia
    // pantalla de confirmaciÃ³n. Si mÃ¡s adelante arman una pÃ¡gina de
    // "gracias por tu pago", se puede agregar acÃ¡.
  };

  const res = UrlFetchApp.fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const data = JSON.parse(res.getContentText());
  if (!data.init_point) {
    throw new Error('Mercado Pago no devolviÃ³ un link de pago. Respuesta: ' + res.getContentText().slice(0, 300));
  }
  const link = data.init_point;

  const sheet = getSheet('agenda');
  const headers = getHeaderRow(sheet, 'agenda');
  const colIdx = headers.indexOf('Link de pago') + 1;
  if (colIdx > 0) {
    sheet.getRange(rowIndex, colIdx).setValue(link);
  }
  return link;
}

/**
 * Atiende el aviso ("webhook") que manda Mercado Pago cuando el estado de
 * un pago cambia. Busca el pago real en la API de Mercado Pago (nunca hay
 * que confiar ciegamente en los datos que vienen en la URL del aviso), y
 * si estÃ¡ aprobado, marca el turno correspondiente como cobrado.
 */
function manejarWebhookMercadoPago(e) {
  try {
    const paymentId = e.parameter['data.id'] || e.parameter.id;
    const token = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
    if (!paymentId || !token) return jsonOut({ received: true });

    const res = UrlFetchApp.fetch('https://api.mercadopago.com/v1/payments/' + paymentId, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    const payment = JSON.parse(res.getContentText());
    if (payment.status === 'approved' && payment.external_reference) {
      marcarTurnoComoPagado(payment.external_reference);
    }
    return jsonOut({ received: true });
  } catch (err) {
    return jsonOut({ received: true, error: err.message });
  }
}

function marcarTurnoComoPagado(externalReference) {
  const m = String(externalReference).match(/^agenda_(\d+)$/);
  if (!m) return;
  const rowIndex = parseInt(m[1], 10);
  const sheet = getSheet('agenda');
  const headers = getHeaderRow(sheet, 'agenda');

  const colCobro = headers.indexOf('CobrÃ³') + 1;
  if (colCobro > 0) sheet.getRange(rowIndex, colCobro).setValue('SÃ­');

  const colEstado = headers.indexOf('Estado') + 1;
  if (colEstado > 0) {
    const estadoActual = String(sheet.getRange(rowIndex, colEstado).getValue() || '');
    if (estadoActual.indexOf('Confirmado') === -1) {
      sheet.getRange(rowIndex, colEstado).setValue('âœ” Confirmado');
    }
  }
}

/**
 * FunciÃ³n de DIAGNÃ“STICO. Ejecutala manualmente desde el editor de Apps
 * Script (seleccionÃ¡ "testCalendarMeet" en el desplegable de funciones y
 * apretÃ¡ â–¶ Ejecutar) para:
 *  a) forzar el pedido de autorizaciÃ³n del scope de Calendar si todavÃ­a
 *     no se otorgÃ³ (esto es lo que suele romper el link cuando se habilitÃ³
 *     el servicio DESPUÃ‰S de haber hecho la primera implementaciÃ³n), y
 *  b) ver en los Registros de ejecuciÃ³n si el link se generÃ³ bien o
 *     quÃ© error concreto estÃ¡ devolviendo Calendar.
 * DespuÃ©s de correrla una vez y aceptar los permisos, hacÃ© de nuevo
 * "Implementar > Nueva implementaciÃ³n" para que la app web use el permiso
 * ya otorgado.
 */
function testCalendarMeet() {
  const link = crearLinkMeetSeguro('Paciente de prueba', '', '');
  Logger.log('Link generado: ' + link);
}

/**
 * FunciÃ³n de DIAGNÃ“STICO. Ejecutala manualmente (elegÃ­ "diagnosticarEncabezados"
 * en el desplegable de funciones y apretÃ¡ â–¶ Ejecutar) para comparar, hoja por
 * hoja, los encabezados que este script espera contra los que realmente tiene
 * cada pestaÃ±a de tu Google Sheet. MirÃ¡ el resultado en Ver > Registros de
 * ejecuciÃ³n. Si ves una columna marcada "âŒ FALTA EN LA HOJA", esa columna
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
      if (!encontrado) Logger.log('âŒ FALTA EN LA HOJA: "' + h + '"');
    });
  });
  Logger.log('DiagnÃ³stico terminado. RevisÃ¡ arriba si hay lÃ­neas "âŒ FALTA".');
}
