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
    {k:'Obra Social / Prepaga',t:'text'},{k:'Plan',t:'text'},
    {k:'N° de Afiliado',t:'text'},{k:'Fecha de Nacimiento',t:'date'},
    {k:'Domicilio',t:'text'},
    {k:'1ª Consulta',t:'date'},
    {k:'Último Control',t:'date'},{k:'Próximo Turno',t:'date'},
    {k:'Observaciones',t:'textarea',full:true},
  ],
  agenda: [
    {k:'Fecha',t:'date',req:true},{k:'Hora',t:'time',req:true},
    {k:'Paciente',t:'text',req:true},
    {k:'Teléfono',t:'text',hint:'Se completa automático desde Pacientes si lo dejás vacío'},
    {k:'Email',t:'email',hint:'Se completa automático desde Pacientes si lo dejás vacío'},
    {k:'Modalidad',t:'select',opts:['Presencial','Teleconsulta']},
    {k:'Estado',t:'select',opts:['✔ Confirmado','✔ Atendido','✘ Canceló','⏳ Reprogramado','⏸ Ausente sin aviso']},
    {k:'Cobró',t:'select',opts:['Sí','No']},
    {k:'Importe ($)',t:'number',hint:'Necesario para generar el link de pago de Mercado Pago'},
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
    {k:'Link Meet / Zoom',t:'text',full:true,hint:'Dejalo vacío: se genera un link de Meet automáticamente al guardar'},
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

/* ---------------- Datos de ejemplo ----------------
   Un registro de muestra por módulo, para que se vea el sistema
   operativo apenas te conectás. Se cargan con el botón "✨ Cargar
   ejemplos" del panel lateral, usando el mismo mecanismo con el que
   se guarda cualquier registro nuevo. Podés editarlos o borrarlos
   como a cualquier otra fila. */
const EXAMPLE_DATA = {
  pacientes: {
    'Apellido':'Pérez', 'Nombre':'Juan',
    'Teléfono':'1122334455', 'Email':'juan.perez@example.com',
    'Obra Social / Prepaga':'OSDE', 'Plan':'210',
    'N° de Afiliado':'123456789/00', 'Fecha de Nacimiento':'14/05/1980',
    'Domicilio':'Av. Siempre Viva 123, Morón',
    '1ª Consulta':'01/03/2026', 'Último Control':'15/06/2026',
    'Próximo Turno':'20/07/2026',
    'Observaciones':'Paciente de ejemplo — podés editarlo o eliminarlo.',
  },
  agenda: {
    'Fecha':'20/07/2026', 'Hora':'10:00', 'Paciente':'Pérez, Juan',
    'Teléfono':'1122334455', 'Email':'juan.perez@example.com', 'Modalidad':'Presencial',
    'Estado':'✔ Confirmado', 'Cobró':'No', 'Importe ($)':15000, 'N° Factura':'', 'Link de pago':'',
    'Observaciones':'Turno de ejemplo.',
  },
  facturacion: {
    'Fecha':'15/06/2026', 'Paciente':'Pérez, Juan', 'N° Factura':'0001-00001234',
    'Concepto':'Consulta', 'Importe ($)':15000, 'IVA':'', 'Total ($)':15000,
    'Cobrado':'Sí', 'Medio de Pago':'Transferencia',
  },
  obrasSociales: {
    'Obra Social / Prepaga':'OSDE', 'Estado del Trámite':'✔ Activo',
    'Usuario / RNOS':'123456', 'Clave':'',
    'Vencimiento Credencial':'31/12/2026',
    'Observaciones':'Registro de ejemplo.',
  },
  convenios: {
    'Financiador':'Swiss Medical', 'Tipo de Convenio':'Prestador directo',
    'Documentación presentada':'Contrato firmado, constancia AFIP',
    'Estado':'✔ Aprobado', 'Observaciones':'Registro de ejemplo.',
  },
  teleconsultas: {
    'Paciente':'Pérez, Juan', 'Fecha':'22/07/2026', 'Hora':'16:00',
    'Link Meet / Zoom':'', // se genera solo al guardar (ver Meet)
    'Pagó':'No', 'Receta enviada':'', 'Control programado':'',
    'Link alternativo':'', 'Consentimiento':'Pendiente',
  },
  cobros: {
    'Fecha':'15/06/2026', 'Paciente':'Pérez, Juan',
    'Transferencia ($)':15000, 'Mercado Pago ($)':0, 'Efectivo ($)':0,
    'Pendiente ($)':0, 'N° Factura':'0001-00001234',
  },
  reintegros: {
    'Paciente':'Pérez, Juan', 'Obra Social':'OSDE',
    'N° Factura enviada':'0001-00001234', 'Fecha de envío':'16/06/2026',
    'Estado':'⏳ En proceso', 'Observaciones':'Registro de ejemplo.',
  },
  checklist: {
    'Tarea':'Renovar habilitación municipal (ejemplo)',
    'Vencimiento':'31/12/2026', 'Realizado':'FALSE',
    'Observaciones':'Tarea de ejemplo, podés marcarla como hecha.',
  },
  cirugias: {
    'N° CX':'CX-0001', 'Fecha':'10/08/2026', 'Paciente':'Pérez, Juan',
    'Institución':'Sanatorio Modelo', 'Tipo de cirugía':'Colecistectomía laparoscópica',
    'Diagnóstico':'Litiasis vesicular', 'Modalidad':'Programada',
    'Obra Social':'OSDE', 'Ayudante':'Dr. Gómez', 'Anestesista':'Dra. López',
    'Instrumentadora':'Sra. Fernández', 'Estado':'⏳ Programada',
    'Link Drive':'', 'Observaciones':'Cirugía de ejemplo.',
  },
  informesQx: {
    'N° CX':'CX-0001', 'Fecha':'10/08/2026', 'Paciente':'Pérez, Juan',
    'Tipo de cirugía':'Colecistectomía laparoscópica',
    'Descripción del procedimiento':'Procedimiento de ejemplo — reemplazar por el informe real.',
    'Hallazgos intraoperatorios':'Sin hallazgos relevantes (ejemplo).',
    'Indicaciones postoperatorias':'Reposo relativo 48hs, control en 7 días (ejemplo).',
    'Estado del informe':'📝 Redactado', 'Enviado a':'',
    'Archivo adjunto':'', // subilo desde el formulario para ver el visor de PDF en acción
  },
  liquidaciones: {
    'N° CX':'CX-0001', 'Fecha':'10/08/2026', 'Paciente':'Pérez, Juan',
    'Obra Social / Financiador':'OSDE', 'Concepto':'Honorarios cirujano',
    'Importe ($)':180000, 'Estado':'📋 Pendiente',
    'Observaciones':'Registro de ejemplo.', 'Archivo adjunto':'',
  },
  facturacionQx: {
    'N° CX':'CX-0001', 'Fecha':'10/08/2026', 'Paciente':'Pérez, Juan',
    'Obra Social':'OSDE', 'Hon. Cirujano ($)':180000, 'Hon. Ayudante ($)':60000,
    'Hon. Anestesista ($)':70000, 'Total ($)':310000, 'N° Factura':'0001-00001235',
    'Fecha presentación':'12/08/2026', 'Fecha acreditación':'',
    'Estado cobro':'📋 Pendiente', 'Observaciones':'Registro de ejemplo.',
    'Archivo adjunto':'',
  },
};

const state = {
  scriptUrl: localStorage.getItem('consultorio_script_url') || '',
  clave: localStorage.getItem('consultorio_clave') || '',
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
    const ok = await loadAllData();
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    if (ok) navigateTo('inicio');
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

  // Botón "Cargar ejemplos": se inyecta arriba del botón de Configuración,
  // sin necesidad de tocar index.html.
  const footer = document.getElementById('sidebar-footer');
  const cfgBtn = document.getElementById('config-btn');
  const exBtn = document.createElement('button');
  exBtn.id = 'loadExamplesBtn';
  exBtn.className = 'btn';
  exBtn.style.width = '100%';
  exBtn.style.marginBottom = '8px';
  exBtn.innerHTML = '✨ Cargar ejemplos';
  footer.insertBefore(exBtn, cfgBtn);
  exBtn.addEventListener('click', loadExampleData);

  // Botón "Mercado Pago": guarda el Public Key / Access Token de forma
  // segura (Script Properties del lado del backend), para cuando esté
  // listo el flujo de pago. Se puede cargar/actualizar en cualquier
  // momento sin tocar código.
  const mpBtn = document.createElement('button');
  mpBtn.id = 'mpConfigBtn';
  mpBtn.className = 'btn';
  mpBtn.style.width = '100%';
  mpBtn.style.marginBottom = '8px';
  mpBtn.innerHTML = '💳 Mercado Pago';
  footer.insertBefore(mpBtn, cfgBtn);
  mpBtn.addEventListener('click', openMercadoPagoConfigModal);

  // Botón "Cerrar sesión": borra la clave guardada en este navegador (no
  // la clave en sí, que sigue viva en el servidor) y pide volver a
  // ingresarla.
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logoutBtn';
  logoutBtn.className = 'btn';
  logoutBtn.style.width = '100%';
  logoutBtn.style.marginBottom = '8px';
  logoutBtn.innerHTML = '🔒 Cerrar sesión';
  footer.insertBefore(logoutBtn, cfgBtn);
  logoutBtn.addEventListener('click', () => {
    if (!confirm('¿Cerrar sesión? Vas a tener que ingresar la clave de nuevo la próxima vez.')) return;
    localStorage.removeItem('consultorio_clave');
    state.clave = '';
    location.reload();
  });
}

/* ---------------- Mercado Pago: guardado de credenciales ---------------- */
async function openMercadoPagoConfigModal() {
  if (!state.scriptUrl) {
    showToast('Conectá primero con Google Sheets desde ⚙ Configuración', true);
    return;
  }
  let status = { publicKeyConfigured:false, accessTokenConfigured:false, publicKey:'' };
  try {
    const res = await fetch(state.scriptUrl + '?action=getConfigMP&clave=' + encodeURIComponent(state.clave));
    status = await res.json();
  } catch (err) {
    console.error(err);
  }

  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay" id="mpOverlay">
      <div class="modal">
        <div class="modal-header">
          <h3>💳 Credenciales de Mercado Pago</h3>
          <button class="modal-close" id="mpClose">✕</button>
        </div>
        <div class="modal-body">
          <div class="config-note">
            Estas credenciales las conseguís en tu cuenta de Mercado Pago
            (Tus integraciones → tu aplicación → Credenciales de producción).
            Se guardan de forma segura del lado del servidor (no quedan
            visibles en la web ni en el Sheet). Esto es solo el guardado de
            las claves — el flujo de pago en sí todavía se está terminando
            de definir.
          </div>
          <div class="form-field">
            <label>Public Key ${status.publicKeyConfigured ? '✅ cargada' : ''}</label>
            <input type="text" id="mpPublicKey" placeholder="APP_USR-xxxxxxxx-xxxx-xxxx..." value="${escapeHtml(status.publicKey || '')}">
          </div>
          <div class="form-field" style="margin-top:14px;">
            <label>Access Token ${status.accessTokenConfigured ? '✅ cargado (oculto por seguridad)' : ''}</label>
            <input type="password" id="mpAccessToken" placeholder="${status.accessTokenConfigured ? '••••••••  (dejalo así para no modificarlo)' : 'APP_USR-xxxxxxxxxxxxxxxx...'}" value="${status.accessTokenConfigured ? '••••••••' : ''}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="mpCancel">Cancelar</button>
          <button class="btn-primary btn" id="mpSave">Guardar</button>
        </div>
      </div>
    </div>
  `;
  const close = () => { root.innerHTML = ''; };
  document.getElementById('mpClose').addEventListener('click', close);
  document.getElementById('mpCancel').addEventListener('click', close);
  document.getElementById('mpSave').addEventListener('click', async () => {
    const publicKey = document.getElementById('mpPublicKey').value.trim();
    const accessToken = document.getElementById('mpAccessToken').value.trim();
    try {
      await apiPost({ action:'guardarConfigMP', publicKey, accessToken });
      showToast('Credenciales de Mercado Pago guardadas.');
      close();
    } catch (err) {}
  });
}

/* ---------------- Datos de ejemplo: carga ---------------- */
async function loadExampleData() {
  if (!state.scriptUrl) {
    showToast('Conectá primero con Google Sheets desde ⚙ Configuración', true);
    return;
  }
  const ok = confirm('Esto agrega UN registro de ejemplo en cada módulo de tu planilla, para que veas el sistema completo funcionando. Podés editarlos o borrarlos después. ¿Continuar?');
  if (!ok) return;

  const btn = document.getElementById('loadExamplesBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Cargando...'; }
  showToast('Cargando ejemplos en cada módulo...');

  const keys = Object.keys(EXAMPLE_DATA);
  let okCount = 0, errCount = 0;
  for (const key of keys) {
    try {
      await apiPost({ action: 'addRow', module: key, row: EXAMPLE_DATA[key] });
      await refreshModule(key);
      okCount++;
    } catch (err) {
      console.error('Error cargando ejemplo de', key, err);
      errCount++;
    }
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '✨ Cargar ejemplos'; }
  showToast(errCount === 0
    ? `Listo: se cargaron ${okCount} ejemplos. Recorré los módulos para verlos.`
    : `Se cargaron ${okCount} ejemplos, ${errCount} fallaron (revisá la consola del navegador).`, errCount > 0);
  navigateTo(state.currentModule || 'inicio');
}

/* ---------------- Data loading / sync ---------------- */
async function loadAllData() {
  updateSyncUI('pending');
  try {
    const res = await fetch(state.scriptUrl + '?action=getAll&clave=' + encodeURIComponent(state.clave));
    const json = await res.json();
    if (json.unauthorized) {
      updateSyncUI('idle');
      openLoginModal();
      return false;
    }
    if (json.error) throw new Error(json.error);
    state.data = json;
    updateSyncUI('ok');
    return true;
  } catch (err) {
    console.error(err);
    updateSyncUI('err');
    showToast('No se pudo conectar con Google Sheets. Revisá la configuración.', true);
    return false;
  }
}

async function apiPost(body) {
  updateSyncUI('pending');
  try {
    const payload = Object.assign({}, body, { clave: state.clave });
    const res = await fetch(state.scriptUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.unauthorized) {
      updateSyncUI('idle');
      openLoginModal();
      throw new Error('unauthorized-handled');
    }
    if (json.error) throw new Error(json.error);
    updateSyncUI('ok');
    return json;
  } catch (err) {
    updateSyncUI('err');
    if (err.message !== 'unauthorized-handled') {
      console.error(err);
      showToast('Error al guardar: ' + err.message, true);
    }
    throw err;
  }
}

/* ---------------- Login (clave de acceso) ---------------- */
function openLoginModal() {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-overlay" id="loginOverlay">
      <div class="modal" style="max-width:380px;">
        <div class="modal-header">
          <h3>🔒 Ingresar</h3>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label>Clave de acceso del consultorio</label>
            <input type="password" id="loginClave" placeholder="Ingresá la clave">
          </div>
          <div id="loginError" style="color:var(--danger);font-size:12px;margin-top:8px;"></div>
        </div>
        <div class="modal-footer" style="justify-content:stretch;">
          <button class="btn-primary btn" id="loginBtn" style="width:100%;">Ingresar</button>
        </div>
      </div>
    </div>
  `;
  const tryLogin = async () => {
    const clave = document.getElementById('loginClave').value;
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    try {
      const res = await fetch(state.scriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', clave }),
      });
      const json = await res.json();
      if (json.success) {
        state.clave = clave;
        localStorage.setItem('consultorio_clave', clave);
        root.innerHTML = '';
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        const ok = await loadAllData();
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        if (ok) navigateTo(state.currentModule || 'inicio');
      } else {
        errEl.textContent = json.error || 'Clave incorrecta.';
      }
    } catch (err) {
      errEl.textContent = 'Error de conexión. Probá de nuevo.';
    }
  };
  document.getElementById('loginBtn').addEventListener('click', tryLogin);
  document.getElementById('loginClave').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') tryLogin();
  });
  document.getElementById('loginClave').focus();
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
    const res = await fetch(state.scriptUrl + '?action=get&module=' + moduleKey + '&clave=' + encodeURIComponent(state.clave));
    const json = await res.json();
    if (json.unauthorized) { openLoginModal(); return; }
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
