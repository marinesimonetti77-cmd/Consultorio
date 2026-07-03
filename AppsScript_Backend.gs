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
  facturacionQx: '13-Facturación Qx'
};

const HEADERS = {
  pacientes: ['Apellido','Nombre','Teléfono','Email','Obra Social / Prepaga','1ª Consulta','Último Control','Próximo Turno','Observaciones'],
  agenda: ['Fecha','Hora','Paciente','Modalidad','Estado','Cobró','N° Factura','Observaciones','Link de pago'],
  facturacion: ['Fecha','Paciente','N° Factura','Concepto','Importe ($)','IVA','Total ($)','Cobrado','Medio de Pago'],
  obrasSociales: ['Obra Social / Prepaga','Estado del Trámite','Usuario / RNOS','Clave','Vencimiento Credencial','Observaciones'],
  convenios: ['Financiador','Tipo de Convenio','Documentación presentada','Estado','Observaciones'],
  teleconsultas: ['Paciente','Fecha','Hora','Link Meet / Zoom','Pagó','Receta enviada','Control programado','Link alternativo','Consentimiento'],
  cobros: ['Fecha','Paciente','Transferencia ($)','Mercado Pago ($)','Efectivo ($)','Pendiente ($)','N° Factura'],
  reintegros: ['Paciente','Obra Social','N° Factura enviada','Fecha de envío','Estado','Observaciones'],
  checklist: ['Tarea','Vencimiento','Realizado','Observaciones','Categoria'],
  cirugias: ['N° CX','Fecha','Paciente','Institución','Tipo de cirugía','Diagnóstico','Modalidad','Obra Social','Ayudante','Anestesista','Instrumentadora','Estado','Link Drive','Observaciones'],
  informesQx: ['N° CX','Fecha','Paciente','Tipo de cirugía','Descripción del procedimiento','Hallazgos intraoperatorios','Indicaciones postoperatorias','Estado del informe','Enviado a','Link PDF en Drive'],
  facturacionQx: ['N° CX','Fecha','Paciente','Obra Social','Hon. Cirujano ($)','Hon. Ayudante ($)','Hon. Anestesista ($)','Total ($)','N° Factura','Fecha presentación','Fecha acreditación','Estado cobro','Observaciones','Link liquidación']
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
 */
function crearLinkMeet(paciente, fechaStr, horaStr) {
  const calendar = CalendarApp.getDefaultCalendar();

  // Parsear fecha DD/MM/AAAA y hora HH:MM. Si faltan, usar ahora + 1 hora.
  let start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  if (fechaStr) {
    const parts = String(fechaStr).split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
      let hh = 9, min = 0;
      if (horaStr) {
        const hParts = String(horaStr).split(':');
        hh = parseInt(hParts[0], 10) || 9;
        min = parseInt(hParts[1], 10) || 0;
      }
      start = new Date(yyyy, mm - 1, dd, hh, min);
    }
  }
  const end = new Date(start.getTime() + 30 * 60000); // 30 min de duración

  const event = calendar.createEvent(
    'Teleconsulta - ' + (paciente || 'Paciente'),
    start,
    end,
    { description: 'Teleconsulta generada automáticamente desde el sistema del consultorio.' }
  );
  event.addPopupReminder(15);

  const hangoutLink = event.getHangoutLink ? event.getHangoutLink() : null;
  return hangoutLink || '';
}

function getSheet(moduleKey) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = SHEETS[moduleKey];
  if (!sheetName) throw new Error('Módulo desconocido: ' + moduleKey);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(HEADERS[moduleKey]);
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
    const dd = ('0' + d.getDate()).slice(-2);
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
  }
  return val;
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
  if (moduleKey === 'teleconsultas' && !rowObj['Link Meet / Zoom']) {
    try {
      rowObj['Link Meet / Zoom'] = crearLinkMeet(rowObj['Paciente'], rowObj['Fecha'], rowObj['Hora']);
    } catch (err) {
      // Si falla la creación del evento (permisos, etc.), seguimos sin bloquear el guardado.
      rowObj['Link Meet / Zoom'] = '';
    }
  }
  const sheet = getSheet(moduleKey);
  const headers = HEADERS[moduleKey];
  const rowValues = headers.map(h => rowObj[h] !== undefined ? rowObj[h] : '');
  sheet.appendRow(rowValues);
}

function updateRow(moduleKey, rowIndex, rowObj) {
  if (moduleKey === 'teleconsultas' && !rowObj['Link Meet / Zoom']) {
    try {
      rowObj['Link Meet / Zoom'] = crearLinkMeet(rowObj['Paciente'], rowObj['Fecha'], rowObj['Hora']);
    } catch (err) {
      rowObj['Link Meet / Zoom'] = '';
    }
  }
  const sheet = getSheet(moduleKey);
  const headers = HEADERS[moduleKey];
  const rowValues = headers.map(h => rowObj[h] !== undefined ? rowObj[h] : '');
  sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
}

function deleteRow(moduleKey, rowIndex) {
  const sheet = getSheet(moduleKey);
  sheet.deleteRow(rowIndex);
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
