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
  const cols = fields.filter(f => f.t !== 'textarea').slice(0, 7);
  return `
    <div class="table-wrap">
      <div style="overflow-x:auto;">
      <table>
        <thead><tr>
          ${cols.map(c => `<th>${c.k}</th>`).join('')}
          <th style="width:90px;">Acciones</th>
        </tr></thead>
        <tbody>
          ${rows.map((r, idx) => `
            <tr>
              ${cols.map(c => `<td>${renderCellValue(c, r[c.k])}</td>`).join('')}
              <td class="cell-actions">
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

function renderCellValue(field, val) {
  if (val === undefined || val === null || val === '') return '<span class="dim">—</span>';
  const s = String(val);
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
  return escapeHtml(s);
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

function formFieldHtml(f, value) {
  const id = 'f_' + sanitizeId(f.k);
  const v = value !== undefined && value !== null ? value : '';
  const fullClass = f.full ? ' full' : '';
  let inputHtml;
  if (f.t === 'textarea') {
    inputHtml = `<textarea id="${id}">${escapeHtml(v)}</textarea>`;
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
