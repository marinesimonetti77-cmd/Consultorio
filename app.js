/* ============================================================
   CONSULTORIO DR. CIAVARELLI — App core
   ============================================================ */

const MODULES = [
  { key:'inicio', icon:'🏠', label:'Inicio', num:'' },
  { key:'pacientes', icon:'📋', label:'Pacientes', num:'1' },
  { key:'agenda', icon:'📅', label:'Agenda', num:'2' },
  { key:'facturacion', icon:'🧾', label:'Facturación', num:'3' },
  { key:'obrasSociales', icon:'🏥', label:'Obras Sociales', num:'4' },
  { key:'convenios', icon:'🤝', label:'Convenios', num:'5' },
  { key:'teleconsultas', icon:'💻', label:'Teleconsultas', num:'6' },
  { key:'cobros', icon:'💰', label:'Cobros', num:'7' },
  { key:'reintegros', icon:'🔄', label:'Reintegros', num:'8' },
  { key:'checklist', icon:'✅', label:'Checklist', num:'9' },
  { key:'estadisticas', icon:'📊', label:'Estadísticas', num:'10' },
  { key:'cirugias', icon:'🔪', label:'Cirugías', num:'11' },
  { key:'informesQx', icon:'📝', label:'Informes Qx', num:'12' },
  { key:'liquidaciones', icon:'📑', label:'Liquidaciones', num:'13' },
  { key:'facturacionQx', icon:'💵', label:'Facturación Qx', num:'14' },
];

const FIELD_DEFS = {
  pacientes: [
    {k:'Apellido',t:'text',req:true},{k:'Nombre',t:'text',req:true},
    {k:'Teléfono',t:'text'},{k:'Email',t:'email'},
    {k:'Obra Social / Prepaga',t:'text'},{k:'1ª Consulta',t:'date'},
    {k:'Último Control',t:'date'},{k:'Próximo Turno',t:'date'},
    {k:'Observaciones',t:'textarea',full:true},
  ],
  agenda: [
    {k:'Fecha',t:'date',req:true},{k:'Hora',t:'time',req:true},
    {k:'Paciente',t:'text',req:true},
    {k:'Teléfono',t:'text',hint:'Se completa automático desde Pacientes si lo dejás vacío'},
    {k:'Modalidad',t:'select',opts:['Presencial','Teleconsulta']},
    {k:'Estado',t:'select',opts:['✔ Confirmado','✔ Atendido','✘ Canceló','⏳ Reprogramado','⏸ Ausente sin aviso']},
    {k:'Cobró',t:'select',opts:['Sí','No']},
    {k:'N° Factura',t:'text'},{k:'Link de pago',t:'text'},
    {k:'Observaciones',t:'textarea',full:true},
  ],
  facturacion: [
    {k:'Fecha',t:'date',req:true},{k:'Paciente',t:'text',req:true},
    {k:'N° Factura',t:'text'},{k:'Concepto',t:'text'},
    {k:'Importe ($)',t:'number'},{k:'IVA',t:'text'},{k:'Total ($)',t:'number'},
    {k:'Cobrado',t:'select',opts:['Sí','No']},
    {k:'Medio de Pago',t:'select',opts:['Transferencia','Mercado Pago','Efectivo','']},
  ],
  obrasSociales: [
    {k:'Obra Social / Prepaga',t:'text',req:true},
    {k:'Estado del Trámite',t:'select',opts:['✔ Activo','⏳ En trámite','⏸ Sin convenio']},
    {k:'Usuario / RNOS',t:'text'},{k:'Clave',t:'text'},
    {k:'Vencimiento Credencial',t:'date'},
    {k:'Observaciones',t:'textarea',full:true},
  ],
  convenios: [
    {k:'Financiador',t:'text',req:true},{k:'Tipo de Convenio',t:'text'},
    {k:'Documentación presentada',t:'text',full:true},
    {k:'Estado',t:'select',opts:['✔ Aprobado','⏳ En trámite','✘ Rechazado']},
    {k:'Observaciones',t:'textarea',full:true},
  ],
  teleconsultas: [
    {k:'Paciente',t:'text',req:true},{k:'Fecha',t:'date'},{k:'Hora',t:'time'},
    {k:'Link Meet / Zoom',t:'text',full:true,hint:'Dejalo vacío para generar un link de Meet automáticamente'},
    {k:'Pagó',t:'select',opts:['Sí','No']},
    {k:'Receta enviada',t:'text'},{k:'Control programado',t:'date'},
    {k:'Link alternativo',t:'text'},{k:'Consentimiento',t:'select',opts:['Sí','No','Pendiente']},
  ],
  cobros: [
    {k:'Fecha',t:'date',req:true},{k:'Paciente',t:'text',req:true},
    {k:'Transferencia ($)',t:'number'},{k:'Mercado Pago ($)',t:'number'},
    {k:'Efectivo ($)',t:'number'},{k:'Pendiente ($)',t:'number'},
    {k:'N° Factura',t:'text'},
  ],
  reintegros: [
    {k:'Paciente',t:'text',req:true},{k:'Obra Social',t:'text'},
    {k:'N° Factura enviada',t:'text'},{k:'Fecha de envío',t:'date'},
    {k:'Estado',t:'select',opts:['✔ Acreditado','⏳ En proceso','✘ Rechazado']},
    {k:'Observaciones',t:'textarea',full:true},
  ],
  checklist: [
    {k:'Tarea',t:'text',req:true,full:true},
    {k:'Vencimiento',t:'text'},
    {k:'Realizado',t:'select',opts:['FALSE','TRUE']},
    {k:'Observaciones',t:'textarea',full:true},
  ],
  cirugias: [
    {k:'N° CX',t:'text',req:true},{k:'Fecha',t:'date',req:true},
    {k:'Paciente',t:'text',req:true},{k:'Institución',t:'text'},
    {k:'Tipo de cirugía',t:'text',full:true},{k:'Diagnóstico',t:'text',full:true},
    {k:'Modalidad',t:'select',opts:['Programada','Urgencia']},
    {k:'Obra Social',t:'text'},{k:'Ayudante',t:'text'},
    {k:'Anestesista',t:'text'},{k:'Instrumentadora',t:'text'},
    {k:'Estado',t:'select',opts:['⏳ Programada','✔ Realizada','✘ Suspendida']},
    {k:'Link Drive',t:'text'},{k:'Observaciones',t:'textarea',full:true},
  ],
  informesQx: [
    {k:'N° CX',t:'text',req:true},{k:'Fecha',t:'date'},{k:'Paciente',t:'text',req:true},
    {k:'Tipo de cirugía',t:'text',full:true},
    {k:'Descripción del procedimiento',t:'textarea',full:true},
    {k:'Hallazgos intraoperatorios',t:'textarea',full:true},
    {k:'Indicaciones postoperatorias',t:'textarea',full:true},
    {k:'Estado del informe',t:'select',opts:['⏳ Pendiente','📝 Redactado','✔ Enviado']},
    {k:'Enviado a',t:'text'},
    {k:'Archivo adjunto',t:'file',full:true},
  ],
  liquidaciones: [
    {k:'N° CX',t:'text',req:true},{k:'Fecha',t:'date'},{k:'Paciente',t:'text',req:true},
    {k:'Obra Social / Financiador',t:'text'},{k:'Concepto',t:'text',full:true},
    {k:'Importe ($)',t:'number'},
    {k:'Estado',t:'select',opts:['📋 Pendiente','⏳ En proceso','✔ Liquidado']},
    {k:'Observaciones',t:'textarea',full:true},
    {k:'Archivo adjunto',t:'file',full:true},
  ],
  facturacionQx: [
    {k:'N° CX',t:'text',req:true},{k:'Fecha',t:'date'},{k:'Paciente',t:'text',req:true},
    {k:'Obra Social',t:'text'},
    {k:'Hon. Cirujano ($)',t:'number'},{k:'Hon. Ayudante ($)',t:'number'},
    {k:'Hon. Anestesista ($)',t:'number'},{k:'Total ($)',t:'number'},
    {k:'N° Factura',t:'text'},{k:'Fecha presentación',t:'date'},
    {k:'Fecha acreditación',t:'date'},
    {k:'Estado cobro',t:'select',opts:['📋 Pendiente','⏳ En proceso','✔ Cobrado']},
    {k:'Observaciones',t:'textarea',full:true},
    {k:'Archivo adjunto',t:'file',full:true},
  ],
};

const state = {
  scriptUrl: localStorage.getItem('consultorio_script_url') || '',
  data: {},          // moduleKey -> {headers, rows}
  currentModule: 'inicio',
  syncStatus: 'idle', // idle | pending | ok | err
  searchTerm: '',
};

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  renderNav();
  bindGlobalUI();
  if (!state.scriptUrl) {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    openConfigModal(true);
    updateSyncUI('idle');
  } else {
    await loadAllData();
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    navigateTo('inicio');
  }
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  MODULES.forEach(m => {
    const el = document.createElement('div');
    el.className = 'nav-item' + (m.key === state.currentModule ? ' active' : '');
    el.dataset.module = m.key;
    el.innerHTML = `<span class="icon">${m.icon}</span><span class="num">${m.num}</span><span>${m.label}</span>`;
    el.addEventListener('click', () => {
      navigateTo(m.key);
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('mobileOverlay').classList.remove('open');
    });
    nav.appendChild(el);
  });
}

function bindGlobalUI() {
  document.getElementById('config-btn').addEventListener('click', () => openConfigModal(false));
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('mobileOverlay').classList.toggle('open');
  });
  document.getElementById('mobileOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('open');
  });
}

/* ---------------- Data loading / sync ---------------- */
async function loadAllData() {
  updateSyncUI('pending');
  try {
    const res = await fetch(state.scriptUrl + '?action=getAll');
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    state.data = json;
    updateSyncUI('ok');
  } catch (err) {
    console.error(err);
    updateSyncUI('err');
    showToast('No se pudo conectar con Google Sheets. Revisá la configuración.', true);
  }
}

async function apiPost(body) {
  updateSyncUI('pending');
  try {
    const res = await fetch(state.scriptUrl, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    updateSyncUI('ok');
    return json;
  } catch (err) {
    console.error(err);
    updateSyncUI('err');
    showToast('Error al guardar: ' + err.message, true);
    throw err;
  }
}

function updateSyncUI(status) {
  state.syncStatus = status;
  const dot = document.getElementById('syncDot');
  const text = document.getElementById('syncText');
  dot.className = 'sync-dot';
  if (status === 'ok') { dot.classList.add('ok'); text.textContent = 'Sincronizado con Sheets'; }
  else if (status === 'pending') { dot.classList.add('pending'); text.textContent = 'Sincronizando...'; }
  else if (status === 'err') { dot.classList.add('err'); text.textContent = 'Error de conexión'; }
  else { text.textContent = 'Sin conectar'; }
}

/* ---------------- Navigation ---------------- */
function navigateTo(moduleKey) {
  state.currentModule = moduleKey;
  state.searchTerm = '';
  renderNav();
  const mod = MODULES.find(m => m.key === moduleKey);
  document.getElementById('pageTitle').textContent = `${mod.icon} ${mod.label}`;
  document.getElementById('pageSubtitle').textContent = mod.num ? `Módulo ${mod.num}` : 'Panel general';
  renderModule(moduleKey);
}

async function refreshModule(moduleKey) {
  try {
    const res = await fetch(state.scriptUrl + '?action=get&module=' + moduleKey);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    state.data[moduleKey] = json;
  } catch (err) {
    console.error(err);
  }
}

/* ---------------- Toast ---------------- */
function showToast(msg, isErr) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast' + (isErr ? ' err' : '');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.remove(); }, 4000);
}

/* ---------------- Config modal ---------------- */
function openConfigModal(forceOpen) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay" id="cfgOverlay">
      <div class="modal">
        <div class="modal-header">
          <h3>⚙ Conectar con Google Sheets</h3>
          <button class="modal-close" id="cfgClose">✕</button>
        </div>
        <div class="modal-body">
          <div class="config-note">
            1. Abrí tu Google Sheet y andá a <code>Extensiones → Apps Script</code>.<br>
            2. Pegá el script (te lo paso en un archivo <code>AppsScript_Backend.gs</code>).<br>
            3. <code>Implementar → Nueva implementación → Aplicación web</code>.<br>
            4. Acceso: "Cualquier usuario". Copiá la URL y pegala acá abajo.
          </div>
          <div class="form-field">
            <label>URL de la Web App de Google Apps Script</label>
            <input type="text" id="cfgUrl" placeholder="https://script.google.com/macros/s/.../exec" value="${state.scriptUrl || ''}">
          </div>
        </div>
        <div class="modal-footer">
          ${forceOpen ? '' : '<button class="btn" id="cfgCancel">Cancelar</button>'}
          <button class="btn-primary btn" id="cfgSave">Guardar y conectar</button>
        </div>
      </div>
    </div>
  `;
  const close = () => { root.innerHTML = ''; };
  document.getElementById('cfgClose').addEventListener('click', close);
  if (!forceOpen) document.getElementById('cfgCancel').addEventListener('click', close);
  document.getElementById('cfgSave').addEventListener('click', async () => {
    const url = document.getElementById('cfgUrl').value.trim();
    if (!url) { showToast('Pegá la URL del script', true); return; }
    state.scriptUrl = url;
    localStorage.setItem('consultorio_script_url', url);
    close();
    document.getElementById('loading-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    await loadAllData();
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    navigateTo(state.currentModule || 'inicio');
  });
}
