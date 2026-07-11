/* ============================================================
   RENDERING — vistas de cada módulo
   ============================================================ */

function renderModule(key) {
  const content = document.getElementById('content');
  const actions = document.getElementById('topbarActions');
  actions.innerHTML = '';
  content.innerHTML = '';

  if (key === 'inicio') return renderInicio();
  if (key === 'estadisticas') return renderEstadisticas();
  if (key === 'checklist') return renderChecklist();
  return renderTableModule(key);
}

/* ---------------- INICIO ---------------- */
function renderInicio() {
  const content = document.getElementById('content');
  const d = state.data;

  const pacientes = (d.pacientes && d.pacientes.rows) || [];
  const agenda = (d.agenda && d.agenda.rows) || [];
  const facturacion = (d.facturacion && d.facturacion.rows) || [];
  const reintegros = (d.reintegros && d.reintegros.rows) || [];

  const hoy = new Date();
  const hoyStr = fmtDateAR(hoy);
  const turnosHoy = agenda.filter(r => r['Fecha'] === hoyStr);
  const pendienteCobro = facturacion.filter(r => r['Cobrado'] !== 'Sí').length;
  const reintegrosProceso = reintegros.filter(r => (r['Estado']||'').indexOf('proceso') !== -1).length;

  content.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">Pacientes registrados</div>
        <div class="value">${pacientes.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Turnos hoy</div>
        <div class="value accent">${turnosHoy.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Facturas sin cobrar</div>
        <div class="value warn">${pendienteCobro}</div>
      </div>
      <div class="stat-card">
        <div class="label">Reintegros en proceso</div>
        <div class="value">${reintegrosProceso}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">
      ${MODULES.filter(m=>m.key!=='inicio').map(m => `
        <div class="stat-card" style="cursor:pointer;" data-nav="${m.key}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-size:20px;">${m.icon}</span>
            <span style="font-weight:700;font-size:14px;">${m.num ? m.num+'. ' : ''}${m.label}</span>
          </div>
          <div class="delta">${moduleDesc(m.key)}</div>
        </div>
      `).join('')}
    </div>
  `;
  content.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.nav));
  });
}

function moduleDesc(key) {
  const map = {
    pacientes:'Registro y seguimiento de pacientes',
    agenda:'Turnos presenciales y virtuales',
    facturacion:'Facturas emitidas y control de cobros',
    obrasSociales:'Credenciales y estado de trámites',
    convenios:'Financiadores y documentación',
    teleconsultas:'Consultas virtuales y links',
    cobros:'Registro de pagos por modalidad',
    reintegros:'Seguimiento por obra social',
    checklist:'Control mensual de obligaciones',
    estadisticas:'Indicadores del consultorio',
    cirugias:'Registro de cirugías, equipo e institución',
    informesQx:'Protocolos e informes quirúrgicos',
    facturacionQx:'Honorarios, facturación y cobro quirúrgico',
  };
  return map[key] || '';
}

function fmtDateAR(d) {
  const dd = ('0'+d.getDate()).slice(-2);
  const mm = ('0'+(d.getMonth()+1)).slice(-2);
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/* ---------------- TABLE MODULES (generic) ---------------- */
function renderTableModule(key) {
  const content = document.getElementById('content');
  const actions = document.getElementById('topbarActions');
  const mod = state.data[key] || { headers: [], rows: [] };
  const fields = FIELD_DEFS[key] || [];

  actions.innerHTML = `<button class="btn btn-primary" id="addRowBtn">+ Nuevo registro</button>`;
  document.getElementById('addRowBtn').addEventListener('click', () => openRowModal(key, null));

  const rows = filterRows(mod.rows, state.searchTerm);

  content.innerHTML = `
    <div class="search-row">
      <input class="search-input" id="searchInput" placeholder="Buscar en ${MODULES.find(m=>m.key===key).label.toLowerCase()}..." value="${escapeHtml(state.searchTerm)}">
    </div>
    ${rows.length === 0 ? emptyStateHtml(key) : tableHtml(key, fields, rows)}
  `;

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', debounce(e => {
    state.searchTerm = e.target.value;
    renderTableModule(key);
    document.getElementById('searchInput').focus();
    const val = document.getElementById('searchInput').value;
    document.getElementById('searchInput').setSelectionRange(val.length, val.length);
  }, 250));

  content.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.edit, 10);
      openRowModal(key, rows[idx]);
    });
  });
  content.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.del, 10);
      const row = rows[idx];
      if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
      try {
        await apiPost({ action:'deleteRow', module:key, rowIndex: row.__rowIndex });
        await refreshModule(key);
        renderTableModule(key);
        showToast('Registro eliminado');
      } catch(e) {}
    });
  });

  // Visor de PDF/imagen embebido (Informes Qx, Liquidaciones, Facturación Qx).
  content.querySelectorAll('[data-viewfile]').forEach(btn => {
    btn.addEventListener('click', () => openFileViewerModal(btn.dataset.viewfile));
  });

  // Generar (o regenerar) el link de Meet para una teleconsulta que quedó
  // sin link — por ejemplo, filas viejas creadas antes de este arreglo.
  content.querySelectorAll('[data-genmeet]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.genmeet, 10);
      const row = rows[idx];
      btn.disabled = true;
      btn.textContent = '⏳';
      try {
        await apiPost({ action:'generarMeet', module:key, rowIndex: row.__rowIndex, row: row });
        await refreshModule(key);
        renderTableModule(key);
        showToast('Link de Meet generado');
      } catch (e) {
        btn.disabled = false;
        btn.textContent = '🎥';
      }
    });
  });

  // Enviar (o reenviar) el mail de recordatorio de turno a mano, como
  // ejemplo o para pacientes que lo perdieron.
  content.querySelectorAll('[data-remind]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.remind, 10);
      const row = rows[idx];
      btn.disabled = true;
      btn.textContent = '⏳';
      try {
        await apiPost({ action:'sendReminderEmail', row: row });
        showToast('Recordatorio enviado (si el paciente tiene email cargado en Pacientes).');
      } catch (e) {
      } finally {
        btn.disabled = false;
        btn.textContent = '📧';
      }
    });
  });

  // Enviar el link de conexión de la teleconsulta, aparte del recordatorio
  // — pensado para usar una vez que el paciente dio su conformidad y pagó.
  content.querySelectorAll('[data-sendlink]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.sendlink, 10);
      const row = rows[idx];
      if (row['Consentimiento'] !== 'Sí' || row['Pagó'] !== 'Sí') {
        const seguro = confirm('Esta teleconsulta todavía no figura con Consentimiento = "Sí" y Pagó = "Sí". ¿Mandar igual el link de conexión?');
        if (!seguro) return;
      }
      btn.disabled = true;
      btn.textContent = '⏳';
      try {
        await apiPost({ action:'enviarLinkTeleconsulta', row: row });
        showToast('Link de conexión enviado al paciente.');
      } catch (e) {
      } finally {
        btn.disabled = false;
        btn.textContent = '📤';
      }
    });
  });

  // Generar el link de pago de Mercado Pago para un turno puntual.
  content.querySelectorAll('[data-genpago]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.genpago, 10);
      const row = rows[idx];
      if (!row['Importe ($)'] || parseFloat(row['Importe ($)']) <= 0) {
        showToast('Cargá un "Importe ($)" en el turno (editalo con ✏️) antes de generar el link de pago.', true);
        return;
      }
      btn.disabled = true;
      btn.textContent = '⏳';
      try {
        await apiPost({ action:'generarLinkPago', rowIndex: row.__rowIndex, row: row });
        await refreshModule(key);
        renderTableModule(key);
        showToast('Link de pago generado y guardado en el turno.');
      } catch (e) {
        btn.disabled = false;
        btn.textContent = '💳';
      }
    });
  });
}

function emptyStateHtml(key) {
  return `
    <div class="table-wrap">
      <div class="empty-state">
        <div class="icon">${MODULES.find(m=>m.key===key).icon}</div>
        <p>Todavía no hay registros en este módulo.</p>
        <button class="btn btn-primary" onclick="document.getElementById('addRowBtn').click()">+ Agregar el primero</button>
      </div>
    </div>
  `;
}

function tableHtml(key, fields, rows) {
  // El límite de 7 columnas es solo para no saturar la tabla, pero el
  // campo "Archivo adjunto" (si existe en el módulo) SIEMPRE tiene que
  // verse, aunque eso implique dejar afuera alguna otra columna. Antes
  // se cortaba en Liquidaciones y Facturación Qx porque caía después
  // de la columna 7.
  const nonTextarea = fields.filter(f => f.t !== 'textarea');
  const fileFields = nonTextarea.filter(f => f.t === 'file');
  const otherFields = nonTextarea.filter(f => f.t !== 'file');
  const maxOther = Math.max(1, 8 - fileFields.length);
  const cols = otherFields.slice(0, maxOther).concat(fileFields);

  return `
    <div class="table-wrap">
      <div style="overflow-x:auto;">
      <table>
        <thead><tr>
          ${cols.map(c => `<th>${c.k}</th>`).join('')}
          <th style="width:${(key === 'teleconsultas' || key === 'agenda') ? '170px' : '90px'};">Acciones</th>
        </tr></thead>
        <tbody>
          ${rows.map((r, idx) => `
            <tr>
              ${cols.map(c => `<td>${renderCellValue(c, r[c.k], key, r)}</td>`).join('')}
              <td class="cell-actions">
                ${key === 'teleconsultas' && !r['Link Meet / Zoom'] ? `<button class="btn btn-sm btn-icon" data-genmeet="${idx}" title="Generar link de Meet">🎥</button>` : ''}
                ${key === 'teleconsultas' && r['Link Meet / Zoom'] ? `<button class="btn btn-sm btn-icon" data-sendlink="${idx}" title="Enviar link de conexión al paciente (una vez confirmada la conformidad y el pago)">📤</button>` : ''}
                ${key === 'agenda' ? `<button class="btn btn-sm btn-icon" data-remind="${idx}" title="Enviar recordatorio de turno por mail">📧</button>` : ''}
                ${key === 'agenda' ? `<button class="btn btn-sm btn-icon" data-genpago="${idx}" title="Generar link de pago (Mercado Pago)">💳</button>` : ''}
                <button class="btn btn-sm btn-icon" data-edit="${idx}" title="Editar">✏️</button>
                <button class="btn btn-sm btn-icon btn-danger" data-del="${idx}" title="Eliminar">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>
    </div>
  `;
}

function renderCellValue(field, val, moduleKey, row) {
  if (val === undefined || val === null || val === '') return '<span class="dim">—</span>';
  const s = String(val);
  if (field.k === 'Teléfono' && (moduleKey === 'agenda' || moduleKey === 'pacientes')) {
    return waPhonePill(s, moduleKey, row);
  }
  if (field.k === 'Email' && (moduleKey === 'agenda' || moduleKey === 'pacientes') && s.indexOf('@') !== -1) {
    return emailPill(s, moduleKey, row);
  }
  if (s.startsWith('✔')) return `<span class="pill pill-ok">${escapeHtml(s)}</span>`;
  if (s.startsWith('✘')) return `<span class="pill pill-danger">${escapeHtml(s)}</span>`;
  if (s.startsWith('⏳')) return `<span class="pill pill-warn">${escapeHtml(s)}</span>`;
  if (s.startsWith('⏸')) return `<span class="pill pill-neutral">${escapeHtml(s)}</span>`;
  if (s.startsWith('📝') || s.startsWith('📋')) return `<span class="pill pill-info">${escapeHtml(s)}</span>`;
  if (field.k === 'Cobrado' || field.k === 'Pagó') {
    return s === 'Sí' ? `<span class="pill pill-ok">Sí</span>` : `<span class="pill pill-danger">No</span>`;
  }
  if (field.t === 'number' && s !== '') {
    const n = parseFloat(s);
    if (!isNaN(n)) return `$${n.toLocaleString('es-AR')}`;
  }
  if (field.t === 'file' && s.startsWith('http')) {
    return `<button type="button" class="pill pill-info" data-viewfile="${escapeHtml(s)}" style="cursor:pointer;border:none;">📎 Ver archivo adjunto</button>`;
  }
  return escapeHtml(s);
}

/**
 * Arma el botón de teléfono que abre WhatsApp Web directo (sin pasar por
 * la pantalla intermedia de wa.me), con un mensaje precargado según el
 * módulo (recordatorio de turno en Agenda, saludo genérico en Pacientes).
 * Esto es un "abrir chat con este número", no un envío automático: el
 * mensaje lo termina de mandar la persona con un clic.
 */
function waPhonePill(s, moduleKey, row) {
  const digits = s.replace(/[^0-9]/g, '');
  if (!digits) return escapeHtml(s);
  const waNumber = digits.startsWith('54') ? digits : ('54' + digits.replace(/^0/, ''));

  let text = 'Hola, te escribimos del consultorio del Dr. Ciavarelli.';
  if (moduleKey === 'agenda' && row) {
    const paciente = row['Paciente'] || '';
    const fecha = row['Fecha'] || '';
    const hora = row['Hora'] || '';
    const modalidad = row['Modalidad'] || 'Presencial';
    text = `Hola${paciente ? ' ' + paciente : ''}, te escribimos del consultorio del Dr. Ciavarelli para recordarte tu turno` +
      (fecha ? ` del ${fecha}` : '') + (hora ? ` a las ${hora}` : '') + ` (${modalidad}).`;
    if (modalidad === 'Teleconsulta') {
      text += ' Al optar por esta modalidad, das tu conformidad para ser atendido/a por teleconsulta. ' +
        'El link de conexión te lo mandamos aparte, una vez confirmado el pago.';
    }
  } else if (moduleKey === 'pacientes' && row) {
    const apellido = row['Apellido'] || '';
    text = `Hola${apellido ? ' ' + apellido : ''}, te escribimos del consultorio del Dr. Ciavarelli.`;
  }
  const msg = encodeURIComponent(text);
  return `<a href="https://web.whatsapp.com/send?phone=${waNumber}&text=${msg}" target="_blank" class="pill pill-ok" title="Abrir WhatsApp Web para escribirle">💬 ${escapeHtml(s)}</a>`;
}

/**
 * Arma el botón de email. Abre Gmail directo (no el mailto: genérico del
 * sistema) con la cuenta del consultorio preseleccionada como remitente,
 * y el asunto/cuerpo ya cargados. Para que efectivamente envíe desde
 * consultorio.ciavarelli@gmail.com, el navegador tiene que tener esa
 * cuenta de Google iniciada sesión (si no, Gmail va a pedir loguearse).
 */
const CONSULTORIO_EMAIL = 'consultorio.ciavarelli@gmail.com';

function emailPill(email, moduleKey, row) {
  let subject = 'Consultorio Dr. Ciavarelli';
  let body = 'Hola, te escribimos del consultorio del Dr. Ciavarelli.';
  if (moduleKey === 'agenda' && row) {
    const paciente = row['Paciente'] || '';
    const fecha = row['Fecha'] || '';
    const hora = row['Hora'] || '';
    subject = 'Recordatorio de turno - Dr. Ciavarelli';
    body = `Hola${paciente ? ' ' + paciente : ''}, te recordamos tu turno` +
      (fecha ? ` del ${fecha}` : '') + (hora ? ` a las ${hora}` : '') + '.';
  } else if (moduleKey === 'pacientes' && row) {
    const apellido = row['Apellido'] || '';
    body = `Hola${apellido ? ' ' + apellido : ''}, te escribimos del consultorio del Dr. Ciavarelli.`;
  }
  const href = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(email)}` +
    `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` +
    `&authuser=${encodeURIComponent(CONSULTORIO_EMAIL)}`;
  return `<a href="${href}" target="_blank" class="pill pill-info" title="Enviar email desde ${CONSULTORIO_EMAIL}">✉️ ${escapeHtml(email)}</a>`;
}

/**
 * Visor de PDF/imagen embebido en un modal, para no tener que salir de
 * la app a ver el archivo adjunto. Convierte el link de Google Drive
 * (.../file/d/ID/view) al formato de vista embebible (.../preview).
 */
function toDrivePreviewUrl(url) {
  const m = url.match(/\/d\/([^/]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return url;
}

function openFileViewerModal(url) {
  const root = document.getElementById('modalRoot');
  const embedUrl = toDrivePreviewUrl(url);
  root.innerHTML = `
    <div class="modal-overlay" id="fileOverlay">
      <div class="modal" style="max-width:900px;">
        <div class="modal-header">
          <h3>📎 Ver archivo adjunto</h3>
          <button class="modal-close" id="fileClose">✕</button>
        </div>
        <div class="modal-body" style="padding:0;">
          <iframe src="${escapeHtml(embedUrl)}" style="width:100%;height:70vh;border:none;display:block;" allow="autoplay"></iframe>
        </div>
        <div class="modal-footer">
          <a class="btn" href="${escapeHtml(url)}" target="_blank">Abrir en una pestaña nueva</a>
          <button class="btn btn-primary" id="fileCloseBtn">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  const close = () => { root.innerHTML = ''; };
  document.getElementById('fileClose').addEventListener('click', close);
  document.getElementById('fileCloseBtn').addEventListener('click', close);
}

function filterRows(rows, term) {
  if (!term) return rows;
  const t = term.toLowerCase();
  return rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(t)));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

/* ---------------- Row Modal (add/edit) ---------------- */
function openRowModal(key, existingRow) {
  const fields = FIELD_DEFS[key] || [];
  const root = document.getElementById('modalRoot');
  const isEdit = !!existingRow;

  root.innerHTML = `
    <div class="modal-overlay" id="rowOverlay">
      <div class="modal">
        <div class="modal-header">
          <h3>${isEdit ? 'Editar registro' : 'Nuevo registro'}</h3>
          <button class="modal-close" id="rowClose">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid" id="rowForm">
            ${fields.map(f => formFieldHtml(f, existingRow ? existingRow[f.k] : '')).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="rowCancel">Cancelar</button>
          <button class="btn btn-primary" id="rowSave">${isEdit ? 'Guardar cambios' : 'Agregar'}</button>
        </div>
      </div>
    </div>
  `;
  const close = () => { root.innerHTML = ''; };
  document.getElementById('rowClose').addEventListener('click', close);
  document.getElementById('rowCancel').addEventListener('click', close);

  root.querySelectorAll('[data-viewfile]').forEach(btn => {
    btn.addEventListener('click', () => openFileViewerModal(btn.dataset.viewfile));
  });

  // Conectar inputs de tipo archivo: al elegir un archivo, subirlo a Drive
  // y guardar el link resultante en el input oculto correspondiente.
  fields.filter(f => f.t === 'file').forEach(f => {
    const id = 'f_' + sanitizeId(f.k);
    const fileInput = document.getElementById(id + '_input');
    const statusEl = document.getElementById(id + '_status');
    const hiddenInput = document.getElementById(id);
    if (!fileInput) return;
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (file.size > 15 * 1024 * 1024) {
        statusEl.textContent = 'El archivo supera 15MB, elegí uno más chico.';
        statusEl.style.color = 'var(--danger)';
        return;
      }
      statusEl.textContent = 'Subiendo archivo...';
      statusEl.style.color = 'var(--text-dim)';
      try {
        const base64Data = await fileToBase64(file);
        const res = await apiPost({
          action: 'uploadFile',
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Data: base64Data,
          module: key,
        });
        hiddenInput.value = res.link;
        statusEl.innerHTML = `✅ Subido: <button type="button" data-viewfile="${escapeHtml(res.link)}" style="background:none;border:none;color:var(--accent);cursor:pointer;text-decoration:underline;padding:0;font:inherit;">Ver archivo adjunto</button>`;
        statusEl.querySelector('[data-viewfile]').addEventListener('click', (ev) => openFileViewerModal(ev.target.dataset.viewfile));
      } catch (e) {
        statusEl.textContent = 'Error al subir el archivo.';
        statusEl.style.color = 'var(--danger)';
      }
    });
  });

  document.getElementById('rowSave').addEventListener('click', async () => {
    const obj = {};
    let missingReq = false;
    fields.forEach(f => {
      const el = document.getElementById('f_' + sanitizeId(f.k));
      const val = el.value;
      if (f.req && !val) missingReq = true;
      obj[f.k] = val;
    });
    if (missingReq) { showToast('Completá los campos obligatorios', true); return; }

    const saveBtn = document.getElementById('rowSave');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';
    try {
      if (isEdit) {
        await apiPost({ action:'updateRow', module:key, rowIndex: existingRow.__rowIndex, row: obj });
      } else {
        await apiPost({ action:'addRow', module:key, row: obj });
      }
      await refreshModule(key);
      close();
      renderTableModule(key);
      showToast(isEdit ? 'Registro actualizado' : 'Registro agregado');
    } catch (e) {
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Agregar';
    }
  });
}

function sanitizeId(k) {
  return k.replace(/[^a-zA-Z0-9]/g, '_');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formFieldHtml(f, value) {
  const id = 'f_' + sanitizeId(f.k);
  const v = value !== undefined && value !== null ? value : '';
  const fullClass = f.full ? ' full' : '';
  let inputHtml;
  if (f.t === 'textarea') {
    inputHtml = `<textarea id="${id}">${escapeHtml(v)}</textarea>`;
  } else if (f.t === 'file') {
    const hasFile = v && String(v).startsWith('http');
    inputHtml = `
      <input type="hidden" id="${id}" value="${escapeHtml(v)}">
      <div id="${id}_wrap">
        ${hasFile ? `<div style="margin-bottom:8px;"><button type="button" class="pill pill-info" data-viewfile="${escapeHtml(v)}" style="cursor:pointer;border:none;">📎 Ver archivo adjunto actual</button></div>` : ''}
        <input type="file" id="${id}_input" accept="application/pdf,image/*">
        <div id="${id}_status" style="font-size:11.5px;color:var(--text-dim);margin-top:6px;"></div>
      </div>
    `;
  } else if (f.t === 'select') {
    inputHtml = `<select id="${id}">
      ${f.opts.map(o => `<option value="${escapeHtml(o)}" ${o===v?'selected':''}>${o || '—'}</option>`).join('')}
    </select>`;
  } else if (f.t === 'date') {
    inputHtml = `<input type="text" id="${id}" placeholder="DD/MM/AAAA" value="${escapeHtml(v)}">`;
  } else {
    inputHtml = `<input type="${f.t}" id="${id}" value="${escapeHtml(v)}">`;
  }
  return `
    <div class="form-field${fullClass}">
      <label>${f.k}${f.req ? ' *' : ''}</label>
      ${inputHtml}
      ${f.hint ? `<span style="font-size:11px;color:var(--text-faint);">${f.hint}</span>` : ''}
    </div>
  `;
}

/* ---------------- ESTADISTICAS ---------------- */
function renderEstadisticas() {
  const content = document.getElementById('content');
  const mod = state.data.estadisticas || { headers:[], rows:[] };

  if (!mod.rows || mod.rows.length === 0) {
    content.innerHTML = emptyStateHtml('estadisticas');
    return;
  }

  const periodCols = mod.headers.filter(h => h !== 'Indicador' && h !== 'Observaciones');
  const groups = {};
  let currentGroup = 'General';
  mod.rows.forEach(r => {
    const indicador = r['Indicador'];
    const isGroupHeader = periodCols.every(c => r[c] === '' || r[c] === undefined) && !r['Observaciones'];
    if (isGroupHeader && indicador) {
      currentGroup = indicador;
      groups[currentGroup] = groups[currentGroup] || [];
    } else {
      groups[currentGroup] = groups[currentGroup] || [];
      groups[currentGroup].push(r);
    }
  });

  content.innerHTML = Object.keys(groups).map(g => `
    <div style="margin-bottom:24px;">
      <h4 style="font-size:12.5px;color:var(--accent);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px;font-weight:700;">${g}</h4>
      <div class="table-wrap">
        <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Indicador</th>${periodCols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
          <tbody>
            ${groups[g].map(r => `
              <tr>
                <td>${escapeHtml(r['Indicador']||'')}</td>
                ${periodCols.map(c => `<td>${r[c] !== undefined && r[c] !== '' ? escapeHtml(String(r[c])) : '<span class="dim">—</span>'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  `).join('');
}

/* ---------------- CHECKLIST ---------------- */
function renderChecklist() {
  const content = document.getElementById('content');
  const actions = document.getElementById('topbarActions');
  const mod = state.data.checklist || { headers:[], rows:[] };

  actions.innerHTML = `<button class="btn btn-primary" id="addRowBtn">+ Nueva tarea</button>`;

  if (!mod.rows || mod.rows.length === 0) {
    content.innerHTML = emptyStateHtml('checklist');
    document.getElementById('addRowBtn').addEventListener('click', () => openRowModal('checklist', null));
    return;
  }

  const groups = {};
  let currentGroup = 'General';
  mod.rows.forEach(r => {
    const tarea = r['Tarea'] || '';
    const isCategoryRow = !r['Vencimiento'] && !r['Realizado'];
    if (isCategoryRow) {
      currentGroup = tarea;
      groups[currentGroup] = groups[currentGroup] || [];
    } else {
      groups[currentGroup] = groups[currentGroup] || [];
      groups[currentGroup].push(r);
    }
  });

  content.innerHTML = Object.keys(groups).map(g => `
    <div class="checklist-group">
      <h4>${g}</h4>
      ${groups[g].map(r => {
        const done = String(r['Realizado']).toUpperCase() === 'TRUE';
        return `
        <div class="check-row">
          <input type="checkbox" ${done?'checked':''} data-rowidx="${r.__rowIndex}">
          <span class="task-name ${done?'done':''}">${escapeHtml(r['Tarea']||'')}</span>
          <span class="due">${escapeHtml(r['Vencimiento']||'')}</span>
        </div>`;
      }).join('')}
    </div>
  `).join('');

  document.getElementById('addRowBtn').addEventListener('click', () => openRowModal('checklist', null));

  content.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', async () => {
      const rowIndex = parseInt(cb.dataset.rowidx, 10);
      const row = mod.rows.find(r => r.__rowIndex === rowIndex);
      if (!row) return;
      const updated = Object.assign({}, row);
      updated['Realizado'] = cb.checked ? 'TRUE' : 'FALSE';
      try {
        await apiPost({ action:'updateRow', module:'checklist', rowIndex, row: updated });
        row['Realizado'] = updated['Realizado'];
        renderChecklist();
      } catch(e) {}
    });
  });
}
