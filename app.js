/* ============================================================
   CARIBEPLANNERS — APP PAREJA
   Datos, autenticación, navegación, dashboard básico
   ============================================================ */

/* ==================== ALMACENAMIENTO ==================== */
const K = {
  users:      'cp_u',
  sess:       'cp_s',
  wed:        'cp_w',
  tasks:      'cp_t',
  guests:     'cp_g',
  budget:     'cp_b',
  tables:     'cp_m',
  cron:       'cp_c',
  providers:  'cp_prov',
  directory:  'cp_dir',
  categories: 'cp_cat'
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const read = (k, f = []) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? f; }
  catch { return f; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const hash = s => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return 'h' + Math.abs(h).toString(36);
};
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ==================== FORMATO ==================== */
function formatMoney(n) {
  if (n === undefined || n === null || isNaN(n)) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

/* ==================== TOAST ==================== */
function toast(msg) {
  const t = $('toast');
  t.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' + escapeHtml(msg);
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ==================== CATEGORÍAS ==================== */
const DEFAULT_CATEGORIES = [
  'Catering', 'Fotografía', 'Video', 'Música / DJ', 'Decoración', 'Flores',
  'Locación', 'Vestuario', 'Invitaciones', 'Transporte', 'Pastelería', 'Otros'
];

function getCategories() {
  let cats = read(K.categories, null);
  if (!cats) {
    cats = DEFAULT_CATEGORIES.map(name => ({ id: uid(), name }));
    write(K.categories, cats);
  }
  return cats;
}

/* ==================== SEED DEMO ==================== */
(function seed() {
  const users = read(K.users);
  let couple = users.find(u => u.email === 'pareja@caribeplanners.com');
  if (!couple) {
    couple = {
      id: 'couple-demo',
      name: 'Ana y Carlos',
      email: 'pareja@caribeplanners.com',
      password: hash('pareja123'),
      role: 'couple',
      type: 'couple',
      active: true,
      createdAt: now()
    };
    users.push(couple);
    write(K.users, users);
  }

  const weds = read(K.wed);
  if (!weds.find(w => w.ownerId === couple.id)) {
    weds.push({
      id: 'wed-ana-carlos',
      ownerId: couple.id,
      partnerA: 'Ana',
      partnerB: 'Carlos',
      date: '2026-12-12',
      location: 'Cartagena, Colombia',
      status: 'en_planificacion',
      priority: 'alta',
      createdAt: now()
    });
    write(K.wed, weds);
  }

  const provs = read(K.providers);
  if (!provs.find(p => p.weddingId === 'wed-ana-carlos')) {
    const cats = getCategories();
    const fotoCat = cats.find(c => c.name === 'Fotografía')?.id;
    const catCat = cats.find(c => c.name === 'Catering')?.id;

    provs.push({
      id: 'prov-1',
      weddingId: 'wed-ana-carlos',
      name: 'Juan Pérez',
      categoryId: fotoCat,
      details: 'Sesión completa + álbum digital',
      amountTotal: 3000,
      payments: [
        { id: uid(), amount: 750, date: '2026-06-15', note: 'Primer anticipo' },
        { id: uid(), amount: 500, date: '2026-08-20', note: 'Segundo abono' }
      ],
      contractedAt: '2026-06-01',
      finalPaymentDue: '2026-11-30',
      notes: 'Fotógrafo recomendado.',
      attachments: [],
      isPrivate: false,
      manualStatus: null,
      createdAt: now()
    });

    provs.push({
      id: 'prov-2',
      weddingId: 'wed-ana-carlos',
      name: 'Delicias del Caribe',
      categoryId: catCat,
      details: 'Menú 5 tiempos x 120 personas',
      amountTotal: 4500,
      payments: [
        { id: uid(), amount: 4500, date: '2026-05-20', note: 'Pago completo' }
      ],
      contractedAt: '2026-05-15',
      finalPaymentDue: '2026-05-20',
      notes: '',
      attachments: [],
      isPrivate: false,
      manualStatus: null,
      createdAt: now()
    });

    write(K.providers, provs);
  }
})();

/* ==================== AUTH ==================== */
const Auth = {
  register({ name, email, password }) {
    const users = read(K.users);
    if (users.find(x => x.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Este correo ya está registrado');
    }
    const user = {
      id: uid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash(password),
      role: 'couple',
      type: 'couple',
      active: true,
      createdAt: now()
    };
    users.push(user);
    write(K.users, users);
    return user;
  },
  login(email, password) {
    const users = read(K.users);
    const user = users.find(x =>
      x.email.toLowerCase() === email.toLowerCase() &&
      x.password === hash(password) &&
      x.type === 'couple'
    );
    if (!user) throw new Error('Correo o contraseña incorrectos');
    write(K.sess, { userId: user.id, at: now() });
    return user;
  },
  current() {
    const s = read(K.sess, null);
    if (!s) return null;
    const u = read(K.users).find(x => x.id === s.userId);
    return u && u.type === 'couple' ? u : null;
  },
  logout() { localStorage.removeItem(K.sess); }
};

/* ==================== ENTIDADES ==================== */
const Weddings = {
  forUser: userId => read(K.wed).find(w => w.ownerId === userId) || null,
  create: (userId, data = {}) => {
    const a = read(K.wed);
    const w = {
      id: uid(),
      ownerId: userId,
      partnerA: data.partnerA || '',
      partnerB: data.partnerB || '',
      date: data.date || '',
      location: data.location || '',
      status: data.status || 'nuevas',
      priority: data.priority || 'media',
      createdAt: now()
    };
    a.push(w);
    write(K.wed, a);
    return w;
  },
  update: (id, patch) => {
    const a = read(K.wed);
    const w = a.find(x => x.id === id);
    if (w) Object.assign(w, patch);
    write(K.wed, a);
    return w;
  }
};

const Tasks = {
  forWedding: id => read(K.tasks).filter(t => t.weddingId === id),
  add: (wid, text) => {
    const a = read(K.tasks);
    a.push({ id: uid(), weddingId: wid, text, done: false, createdAt: now() });
    write(K.tasks, a);
  },
  toggle: id => {
    const a = read(K.tasks);
    const t = a.find(x => x.id === id);
    if (t) { t.done = !t.done; write(K.tasks, a); }
  },
  remove: id => write(K.tasks, read(K.tasks).filter(t => t.id !== id))
};

const Guests = {
  forWedding: id => read(K.guests).filter(g => g.weddingId === id),
  add: (wid, d) => {
    const a = read(K.guests);
    a.push({ id: uid(), weddingId: wid, name: d.name, email: d.email || '', rsvp: 'pendiente', tableId: null, createdAt: now() });
    write(K.guests, a);
  },
  setRsvp: (id, r) => {
    const a = read(K.guests);
    const g = a.find(x => x.id === id);
    if (g) { g.rsvp = r; write(K.guests, a); }
  },
  remove: id => write(K.guests, read(K.guests).filter(g => g.id !== id))
};

const Budget = {
  forWedding: id => read(K.budget).filter(b => b.weddingId === id),
  add: (wid, d) => {
    const a = read(K.budget);
    a.push({ id: uid(), weddingId: wid, concept: d.concept, amount: Number(d.amount) || 0, paid: false, createdAt: now() });
    write(K.budget, a);
  },
  toggle: id => {
    const a = read(K.budget);
    const b = a.find(x => x.id === id);
    if (b) { b.paid = !b.paid; write(K.budget, a); }
  },
  remove: id => write(K.budget, read(K.budget).filter(b => b.id !== id))
};

const Tables = {
  forWedding: id => read(K.tables).filter(t => t.weddingId === id),
  add: (wid, name) => {
    const a = read(K.tables);
    a.push({ id: uid(), weddingId: wid, name });
    write(K.tables, a);
  },
  remove: id => write(K.tables, read(K.tables).filter(t => t.id !== id))
};

const Cron = {
  forWedding: id => read(K.cron).filter(c => c.weddingId === id).sort((a, b) => a.time.localeCompare(b.time)),
  add: (wid, time, what) => {
    const a = read(K.cron);
    a.push({ id: uid(), weddingId: wid, time, what });
    write(K.cron, a);
  },
  remove: id => write(K.cron, read(K.cron).filter(c => c.id !== id))
};

/* ==================== ESTADO ==================== */
let currentUser = null;
let currentWedding = null;
let currentView = 'inicio';
let currentProvId = null;
let currentProvTab = 'datos';
/* ==================== NAVEGACIÓN ENTRE VISTAS ==================== */
function showLanding() {
  $('landingView').classList.remove('hidden');
  $('authView').classList.add('hidden');
  $('appView').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function goToAuth() {
  $('landingView').classList.add('hidden');
  $('authView').classList.remove('hidden');
  $('appView').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ==================== TABS LOGIN/REGISTRO ==================== */
function switchTab(which) {
  $('tabLogin').classList.toggle('active', which === 'login');
  $('tabReg').classList.toggle('active', which === 'register');
  $('loginForm').classList.toggle('hidden', which !== 'login');
  $('regForm').classList.toggle('hidden', which !== 'register');
  $('errBox').classList.remove('show');
}

/* ==================== LOGIN ==================== */
$('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const err = $('errBox');
  err.classList.remove('show');
  try {
    const u = Auth.login($('logEmail').value, $('logPass').value);
    startApp(u);
  } catch (error) {
    err.textContent = error.message;
    err.classList.add('show');
  }
});

$('regForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const err = $('errBox');
  err.classList.remove('show');
  try {
    const u = Auth.register({
      name: $('regName').value,
      email: $('regEmail').value,
      password: $('regPass').value
    });
    Auth.login(u.email, $('regPass').value);
    startApp(u);
  } catch (error) {
    err.textContent = error.message;
    err.classList.add('show');
  }
});

window.quickLogin = function (email, password) {
  const err = $('errBox');
  err.classList.remove('show');
  try {
    const u = Auth.login(email, password);
    startApp(u);
  } catch (error) {
    err.textContent = error.message;
    err.classList.add('show');
  }
};

$('gBtn').addEventListener('click', () => toast('Google OAuth requiere backend. Usa el registro por email.'));
$('aBtn').addEventListener('click', () => toast('Apple Sign In requiere backend. Usa el registro por email.'));

/* ==================== LOGOUT ==================== */
function logout() {
  if (!confirm('¿Cerrar sesión?')) return;
  Auth.logout();
  currentUser = null;
  currentWedding = null;
  $('appView').classList.add('hidden');
  showLanding();
  $('loginForm').reset();
  $('regForm').reset();
}

/* ==================== APP START ==================== */
function startApp(user) {
  currentUser = user;
  currentWedding = Weddings.forUser(user.id);
  if (!currentWedding) {
    currentWedding = Weddings.create(user.id, { partnerA: user.name, partnerB: '', date: '', location: '' });
  }

  $('landingView').classList.add('hidden');
  $('authView').classList.add('hidden');
  $('appView').classList.remove('hidden');

  $('uName').textContent = user.name;
  $('uEmail').textContent = user.email;
  $('uRole').textContent = 'Pareja';
  $('topbarUser').textContent = user.name;

  renderNav();
  showView('inicio');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ==================== NAV DASHBOARD ==================== */
const NAV_ITEMS = [
  { key: 'inicio',      icon: '<path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"/>', label: 'Inicio' },
  { key: 'tareas',      icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>', label: 'Tareas' },
  { key: 'invitados',   icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17" cy="9" r="2.5"/>', label: 'Invitados' },
  { key: 'presupuesto', icon: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/>', label: 'Presupuesto' },
  { key: 'proveedores', icon: '<path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>', label: 'Proveedores' },
  { key: 'mesas',       icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>', label: 'Mesas' },
  { key: 'cronograma',  icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', label: 'Cronograma' },
  { key: 'web',         icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>', label: 'Web de boda' }
];

const VIEW_TITLES = {
  inicio: 'Inicio',
  tareas: 'Tareas',
  invitados: 'Invitados',
  presupuesto: 'Presupuesto',
  proveedores: 'Proveedores',
  mesas: 'Plano de mesas',
  cronograma: 'Cronograma',
  web: 'Web de boda'
};

function renderNav() {
  const nav = $('navList');
  nav.innerHTML = '';
  NAV_ITEMS.forEach(item => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.view = item.key;
    btn.innerHTML = '<span class="ico"><svg viewBox="0 0 24 24">' + item.icon + '</svg></span> ' + item.label;
    if (item.key === currentView) btn.classList.add('active');
    btn.addEventListener('click', () => showView(item.key));
    li.appendChild(btn);
    nav.appendChild(li);
  });
}

function showView(key) {
  currentView = key;
  $$('main > section').forEach(s => s.classList.add('hidden'));
  const target = $('v-' + key);
  if (target) target.classList.remove('hidden');
  $('pgTitle').textContent = VIEW_TITLES[key] || key;

  $$('.nav-dash button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === key);
  });

  renderCurrentView();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderCurrentView() {
  switch (currentView) {
    case 'inicio':      renderInicio(); break;
    case 'tareas':      renderTareas(); break;
    case 'invitados':   renderInvitados(); break;
    case 'presupuesto': renderPresupuesto(); break;
    case 'proveedores': renderProveedoresHome(); break;
    case 'mesas':       renderMesas(); break;
    case 'cronograma':  renderCronograma(); break;
    case 'web':         renderWeb(); break;
  }
}

/* ==================== VISTA: INICIO ==================== */
function renderInicio() {
  if (!currentWedding) return;
  const tasks = Tasks.forWedding(currentWedding.id);
  const guests = Guests.forWedding(currentWedding.id);
  const provs = read(K.providers).filter(p => p.weddingId === currentWedding.id);
  const totalBudget = provs.reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);

  $('sTasks').textContent = tasks.filter(t => !t.done).length;
  $('sGuests').textContent = guests.length;
  $('sConf').textContent = guests.filter(g => g.rsvp === 'confirmado').length;
  $('sBudget').textContent = formatMoney(totalBudget);

  const tools = [
    { k: 'invitados',   ico: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/>', t: 'Invitados',   d: 'Lista, RSVP y contacto.' },
    { k: 'presupuesto', ico: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/>', t: 'Presupuesto', d: 'Gastos y pagos.' },
    { k: 'proveedores', ico: '<path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>', t: 'Proveedores', d: 'Servicios y pagos.' },
    { k: 'tareas',      ico: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>', t: 'Tareas', d: 'Checklist con plazos.' },
    { k: 'mesas',       ico: '<circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>', t: 'Mesas', d: 'Distribución del banquete.' },
    { k: 'cronograma',  ico: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', t: 'Cronograma', d: 'Programa del día.' },
    { k: 'web',         ico: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>', t: 'Web de boda', d: 'Su web pública.' }
  ];
  const grid = $('toolsGrid');
  grid.innerHTML = '';
  tools.forEach(t => {
    const d = document.createElement('div');
    d.className = 'tool';
    d.innerHTML = '<div class="ico"><svg viewBox="0 0 24 24">' + t.ico + '</svg></div><h3>' + t.t + '</h3><p>' + t.d + '</p>';
    d.addEventListener('click', () => showView(t.k));
    grid.appendChild(d);
  });

  const info = $('wedInfo');
  if (currentWedding.partnerA && currentWedding.partnerB) {
    info.classList.remove('empty');
    info.innerHTML = '<p style="font-size:17px;font-weight:600;margin-bottom:4px;font-family:var(--font-display)">' +
      escapeHtml(currentWedding.partnerA) + ' &amp; ' + escapeHtml(currentWedding.partnerB) + '</p>' +
      '<p style="color:var(--text-sec);font-size:14px">' +
      formatDate(currentWedding.date) + ' · ' +
      escapeHtml(currentWedding.location || 'Lugar por definir') + '</p>';
  }
  $('wA').value = currentWedding.partnerA || '';
  $('wB').value = currentWedding.partnerB || '';
  $('wDate').value = currentWedding.date || '';
  $('wLoc').value = currentWedding.location || '';
}

/* ==================== VISTA: TAREAS ==================== */
function renderTareas() {
  const list = $('taskList');
  const items = Tasks.forWedding(currentWedding.id);
  if (!items.length) {
    list.innerHTML = '<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/></svg></div><h3>Sin tareas</h3><p>Agreguen su primera tarea arriba</p></div>';
    return;
  }
  list.innerHTML = items.map(t => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask('${t.id}')" style="width:18px;height:18px;accent-color:var(--primary-dark);cursor:pointer">
      <span style="flex:1;font-size:14px;${t.done ? 'text-decoration:line-through;color:var(--text-ter)' : ''}">${escapeHtml(t.text)}</span>
      <button class="btn-icon" onclick="removeTask('${t.id}')" style="font-size:16px">✕</button>
    </div>
  `).join('');
}

function toggleTask(id) { Tasks.toggle(id); renderTareas(); renderInicio(); }
function removeTask(id) { Tasks.remove(id); renderTareas(); renderInicio(); }

/* ==================== VISTA: INVITADOS ==================== */
function renderInvitados() {
  const tbody = $('guestTbl').querySelector('tbody');
  const items = Guests.forWedding(currentWedding.id);
  $('guestCount').textContent = items.length + ' invitados';

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Sin invitados</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(g => `
    <tr>
      <td>${escapeHtml(g.name)}</td>
      <td class="text-sm text-sec">${escapeHtml(g.email || '—')}</td>
      <td>
        <select class="filter-select" onchange="setRsvp('${g.id}',this.value)" style="padding:4px 8px;font-size:12px">
          <option value="pendiente" ${g.rsvp === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="confirmado" ${g.rsvp === 'confirmado' ? 'selected' : ''}>Confirmado</option>
          <option value="rechazado" ${g.rsvp === 'rechazado' ? 'selected' : ''}>Rechazado</option>
        </select>
      </td>
      <td class="actions"><button class="btn-icon" onclick="removeGuest('${g.id}')">✕</button></td>
    </tr>
  `).join('');
}

function setRsvp(id, r) { Guests.setRsvp(id, r); renderInicio(); }
function removeGuest(id) { Guests.remove(id); renderInvitados(); renderInicio(); }

/* ==================== VISTA: PRESUPUESTO ==================== */
function renderPresupuesto() {
  const tbody = $('budgetTbl').querySelector('tbody');
  const items = Budget.forWedding(currentWedding.id);
  $('budgetCount').textContent = items.length + ' conceptos';

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Sin conceptos</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(b => `
    <tr>
      <td>${escapeHtml(b.concept)}</td>
      <td>${formatMoney(b.amount)}</td>
      <td><span class="badge ${b.paid ? 'badge-success' : 'badge-warning'}">${b.paid ? 'Pagado' : 'Pendiente'}</span></td>
      <td class="actions">
        <button class="btn-icon" onclick="toggleBudget('${b.id}')" title="${b.paid ? 'Marcar pendiente' : 'Marcar pagado'}">${b.paid ? '↺' : '✓'}</button>
        <button class="btn-icon" onclick="removeBudget('${b.id}')">✕</button>
      </td>
    </tr>
  `).join('');
}

function toggleBudget(id) { Budget.toggle(id); renderPresupuesto(); renderInicio(); }
function removeBudget(id) { Budget.remove(id); renderPresupuesto(); renderInicio(); }

/* ==================== VISTA: MESAS ==================== */
function renderMesas() {
  const wrap = $('tablesWrap');
  wrap.innerHTML = '';
  const tables = Tables.forWedding(currentWedding.id);
  const guests = Guests.forWedding(currentWedding.id);

  if (!tables.length) {
    wrap.innerHTML = '<div class="empty" style="grid-column:1/-1"><p>Sin mesas. Agrega la primera arriba.</p></div>';
    return;
  }

  tables.forEach(t => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg);padding:16px;border-radius:12px;border:1px solid var(--border)';
    const seated = guests.filter(g => g.tableId === t.id);

    card.innerHTML = `
      <div class="flex-between" style="margin-bottom:12px">
        <strong style="font-family:var(--font-display)">${escapeHtml(t.name)}</strong>
        <button class="btn-icon" onclick="removeTable('${t.id}')">✕</button>
      </div>
      <select class="filter-select" style="width:100%;margin-bottom:10px" onchange="assignGuestToTable(this.value,'${t.id}');this.value=''">
        <option value="">— Agregar invitado —</option>
        ${guests.filter(g => g.tableId !== t.id).map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('')}
      </select>
      <div style="font-size:13px;color:var(--text-sec)">
        ${seated.length ? seated.map(g => `
          <div class="flex-between" style="padding:4px 0">
            <span>• ${escapeHtml(g.name)}</span>
            <button class="btn-icon" style="padding:2px 6px;font-size:12px" onclick="unassignGuest('${g.id}')">✕</button>
          </div>
        `).join('') : 'Sin invitados asignados'}
      </div>
    `;
    wrap.appendChild(card);
  });
}

function removeTable(id) { Tables.remove(id); renderMesas(); }

function assignGuestToTable(guestId, tableId) {
  const a = read(K.guests);
  const g = a.find(x => x.id === guestId);
  if (g) { g.tableId = tableId; write(K.guests, a); renderMesas(); }
}

function unassignGuest(guestId) {
  const a = read(K.guests);
  const g = a.find(x => x.id === guestId);
  if (g) { g.tableId = null; write(K.guests, a); renderMesas(); }
}

/* ==================== VISTA: CRONOGRAMA ==================== */
function renderCronograma() {
  const list = $('cronList');
  const items = Cron.forWedding(currentWedding.id);
  if (!items.length) {
    list.innerHTML = '<div class="empty"><p>Sin actividades. Agrega la primera arriba.</p></div>';
    return;
  }
  list.innerHTML = items.map(c => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
      <strong style="min-width:60px;color:var(--primary-dark);font-family:var(--font-display)">${c.time}</strong>
      <span style="flex:1;font-size:14px">${escapeHtml(c.what)}</span>
      <button class="btn-icon" onclick="removeCron('${c.id}')">✕</button>
    </div>
  `).join('');
}

function removeCron(id) { Cron.remove(id); renderCronograma(); }

/* ==================== VISTA: WEB ==================== */
function renderWeb() {
  const slug = ((currentWedding.partnerA + '-' + currentWedding.partnerB) || 'su-boda')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  $('wedUrl').textContent = 'caribeplanners.com/boda/' + slug;
}

/* ==================== FORMULARIOS INTERNOS ==================== */
$('wedForm').addEventListener('submit', function (e) {
  e.preventDefault();
  Weddings.update(currentWedding.id, {
    partnerA: $('wA').value,
    partnerB: $('wB').value,
    date: $('wDate').value,
    location: $('wLoc').value
  });
  currentWedding = Weddings.forUser(currentUser.id);
  renderInicio();
  toast('Datos guardados');
});

$('taskForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const text = $('newTask').value.trim();
  if (!text) return;
  Tasks.add(currentWedding.id, text);
  $('newTask').value = '';
  renderTareas();
  renderInicio();
});

$('guestForm').addEventListener('submit', function (e) {
  e.preventDefault();
  Guests.add(currentWedding.id, { name: $('gName').value, email: $('gEmail').value });
  $('gName').value = '';
  $('gEmail').value = '';
  renderInvitados();
  renderInicio();
});

$('budgetForm').addEventListener('submit', function (e) {
  e.preventDefault();
  Budget.add(currentWedding.id, { concept: $('bConcept').value, amount: $('bAmount').value });
  $('bConcept').value = '';
  $('bAmount').value = '';
  renderPresupuesto();
  renderInicio();
});

$('tableForm').addEventListener('submit', function (e) {
  e.preventDefault();
  Tables.add(currentWedding.id, $('mName').value.trim());
  $('mName').value = '';
  renderMesas();
});

$('cronForm').addEventListener('submit', function (e) {
  e.preventDefault();
  Cron.add(currentWedding.id, $('cronTime').value, $('cronWhat').value.trim());
  $('cronTime').value = '';
  $('cronWhat').value = '';
  renderCronograma();
});
/* ==================== PROVIDERS helper ==================== */
const Providers = {
  forWedding: id => read(K.providers).filter(p => p.weddingId === id),
  get: id => read(K.providers).find(p => p.id === id),
  update: (id, patch) => {
    const a = read(K.providers);
    const p = a.find(x => x.id === id);
    if (p) Object.assign(p, patch);
    write(K.providers, a);
    return p;
  },
  create: data => {
    const a = read(K.providers);
    const p = {
      id: uid(),
      weddingId: data.weddingId,
      name: data.name,
      categoryId: data.categoryId,
      details: data.details || '',
      amountTotal: Number(data.amountTotal) || 0,
      payments: data.payments || [],
      contractedAt: data.contractedAt || '',
      finalPaymentDue: data.finalPaymentDue || '',
      notes: data.notes || '',
      attachments: [],
      isPrivate: false,
      manualStatus: null,
      createdAt: now()
    };
    a.push(p);
    write(K.providers, a);
    return p;
  },
  amountPaid: p => (p.payments || []).reduce((s, x) => s + (Number(x.amount) || 0), 0),
  amountPending: p => Math.max(0, (Number(p.amountTotal) || 0) - Providers.amountPaid(p)),
  progress: p => {
    const total = Number(p.amountTotal) || 0;
    if (total === 0) return 0;
    return Math.min(100, Math.round((Providers.amountPaid(p) / total) * 100));
  },
  status: p => {
    if (p.manualStatus) return p.manualStatus;
    const paid = Providers.amountPaid(p);
    const total = Number(p.amountTotal) || 0;
    if (paid <= 0) return 'sin_iniciar';
    if (paid >= total && total > 0) return 'pagado';
    return 'en_curso';
  }
};

/* ==================== VISTA: PROVEEDORES ==================== */
function renderProveedoresHome() {
  if (!currentWedding) return;

  const catSel = $('filterProvCatHome');
  const cats = getCategories();
  catSel.innerHTML = '<option value="all">Todas las categorías</option>' +
    cats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

  renderProvSummaryHome();
  renderProveedoresListHome();
}

function renderProvSummaryHome() {
  if (!currentWedding) return;
  const provs = Providers.forWedding(currentWedding.id);
  const totalContratado = provs.reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);
  const totalAbonado = provs.reduce((s, p) => s + Providers.amountPaid(p), 0);
  const totalPendiente = Math.max(0, totalContratado - totalAbonado);
  const pct = totalContratado > 0 ? Math.round((totalAbonado / totalContratado) * 100) : 0;

  const pagados = provs.filter(p => Providers.status(p) === 'pagado').length;
  const enCurso = provs.filter(p => Providers.status(p) === 'en_curso').length;
  const sinIniciar = provs.filter(p => Providers.status(p) === 'sin_iniciar').length;

  $('provSummaryHome').innerHTML = `
    <div class="prov-summary">
      <div class="prov-summary-item">
        <div class="l">Total contratado</div>
        <div class="v">${formatMoney(totalContratado)}</div>
      </div>
      <div class="prov-summary-item">
        <div class="l">Total abonado</div>
        <div class="v green">${formatMoney(totalAbonado)}</div>
      </div>
      <div class="prov-summary-item">
        <div class="l">Total pendiente</div>
        <div class="v red">${formatMoney(totalPendiente)}</div>
      </div>
      <div class="prov-summary-item">
        <div class="l">Proveedores</div>
        <div class="v">${provs.length}</div>
      </div>
      <div class="prov-summary-progress">
        <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        <div class="legend">
          <span>${pct}% abonado</span>
          <span>${pagados} pagados · ${enCurso} en curso · ${sinIniciar} sin iniciar</span>
        </div>
      </div>
    </div>
  `;
}

function renderProveedoresListHome() {
  if (!currentWedding) return;
  let provs = Providers.forWedding(currentWedding.id);

  const filterCat = $('filterProvCatHome')?.value || 'all';
  const filterStatus = $('filterProvStatusHome')?.value || 'all';

  if (filterCat !== 'all') provs = provs.filter(p => p.categoryId === filterCat);
  if (filterStatus !== 'all') provs = provs.filter(p => Providers.status(p) === filterStatus);

  $('provCount').textContent = `${provs.length} proveedores`;

  const list = $('provListHome');
  if (!provs.length) {
    list.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
        </div>
        <h3>Sin proveedores</h3>
        <p>Agrega el primer proveedor para su boda</p>
        <button class="btn-nuevo" onclick="openNuevoProveedorHome()">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Agregar proveedor
        </button>
      </div>
    `;
    return;
  }

  list.innerHTML = provs.map(p => {
    const cat = getCategories().find(c => c.id === p.categoryId);
    const catName = cat ? cat.name : 'Sin categoría';
    const paid = Providers.amountPaid(p);
    const pending = Providers.amountPending(p);
    const pct = Providers.progress(p);
    const status = Providers.status(p);

    const statusLabels = {
      sin_iniciar: { label: 'Sin iniciar', class: 'badge-danger' },
      en_curso: { label: 'En curso', class: 'badge-warning' },
      pagado: { label: 'Pagado', class: 'badge-success' }
    };
    const st = statusLabels[status] || statusLabels.sin_iniciar;
    const fillClass = pct === 100 ? 'green' : pct >= 50 ? '' : pct > 0 ? 'yellow' : 'red';

    return `
      <div class="prov-card" onclick="openProvDrawerHome('${p.id}')">
        <div class="prov-card-head">
          <div class="prov-card-title">
            <div class="prov-cat-badge">
              <svg viewBox="0 0 24 24"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
            </div>
            <div class="prov-card-title-text">
              <h4>${escapeHtml(p.name)}</h4>
              <div class="cat">${escapeHtml(catName)}</div>
            </div>
          </div>
          <span class="badge ${st.class}">${st.label}</span>
        </div>
        ${p.details ? `<div class="prov-card-details">${escapeHtml(p.details)}</div>` : ''}
        <div class="prov-card-stats">
          <div class="prov-stat">
            <div class="l">Total</div>
            <div class="v">${formatMoney(p.amountTotal)}</div>
          </div>
          <div class="prov-stat">
            <div class="l">Abonado</div>
            <div class="v abonado">${formatMoney(paid)}</div>
          </div>
          <div class="prov-stat">
            <div class="l">Pendiente</div>
            <div class="v pendiente">${formatMoney(pending)}</div>
          </div>
        </div>
        <div class="prov-card-foot">
          <div class="prov-progress-wrap">
            <div class="prov-progress-label">
              <span>Progreso</span>
              <strong>${pct}%</strong>
            </div>
            <div class="progress-bar">
              <div class="fill ${fillClass}" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ==================== DRAWER: PROVEEDOR ==================== */
function openProvDrawerHome(provId) {
  currentProvId = provId;
  currentProvTab = 'datos';
  const p = Providers.get(provId);
  if (!p) return;

  const cat = getCategories().find(c => c.id === p.categoryId);
  $('pvdTitle').textContent = p.name;
  $('pvdCat').textContent = cat ? cat.name : 'Sin categoría';
  const statusLabels = { sin_iniciar: 'Sin iniciar', en_curso: 'En curso', pagado: 'Pagado' };
  $('pvdStatus').textContent = statusLabels[Providers.status(p)];

  $$('#pvdTabs .drawer-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'datos');
  });

  renderProvTabHome();
  $('provDrawerBackdrop').classList.add('open');
  $('provDrawer').classList.add('open');
}

function closeProvDrawer() {
  $('provDrawerBackdrop').classList.remove('open');
  $('provDrawer').classList.remove('open');
  currentProvId = null;
}

function switchProvTab(tab) {
  currentProvTab = tab;
  $$('#pvdTabs .drawer-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderProvTabHome();
}

function renderProvTabHome() {
  const p = Providers.get(currentProvId);
  if (!p) return;
  const body = $('pvdBody');

  if (currentProvTab === 'datos') body.innerHTML = renderProvDatosHome(p);
  else if (currentProvTab === 'abonos') body.innerHTML = renderProvAbonosHome(p);
  else if (currentProvTab === 'adjuntos') body.innerHTML = renderProvAdjuntosHome(p);
  else if (currentProvTab === 'notas') body.innerHTML = renderProvNotasHome(p);
}

function renderProvDatosHome(p) {
  const cats = getCategories();
  const paid = Providers.amountPaid(p);
  const pending = Providers.amountPending(p);
  const pct = Providers.progress(p);

  return `
    <div class="drawer-section">
      <h3>Información general</h3>
      <div class="form-grid cols-2">
        <div class="field full">
          <label>Nombre</label>
          <input type="text" id="pvdNombre" value="${escapeHtml(p.name)}">
        </div>
        <div class="field">
          <label>Categoría</label>
          <select id="pvdCat" class="filter-select" style="width:100%;padding:10px 12px">
            ${cats.map(c => `<option value="${c.id}" ${p.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Monto total</label>
          <input type="number" id="pvdMonto" value="${p.amountTotal}" min="0" step="0.01">
        </div>
        <div class="field full">
          <label>Alcance / Detalles</label>
          <textarea id="pvdDetalles" rows="3" style="resize:vertical">${escapeHtml(p.details || '')}</textarea>
        </div>
        <div class="field">
          <label>Fecha de contratación</label>
          <input type="date" id="pvdFechaCont" value="${p.contractedAt || ''}">
        </div>
        <div class="field">
          <label>Fecha de pago final</label>
          <input type="date" id="pvdFechaFinal" value="${p.finalPaymentDue || ''}">
        </div>
      </div>
    </div>

    <div class="drawer-section">
      <h3>Estado de pagos</h3>
      <div class="info-grid">
        <div class="info-block">
          <div class="label">Abonado</div>
          <div class="value big" style="color:var(--success)">${formatMoney(paid)}</div>
        </div>
        <div class="info-block">
          <div class="label">Pendiente</div>
          <div class="value big" style="color:var(--danger)">${formatMoney(pending)}</div>
        </div>
      </div>
      <div class="prov-progress-label" style="margin-top:12px">
        <span>Progreso del pago</span>
        <strong>${pct}%</strong>
      </div>
      <div class="progress-bar" style="height:8px">
        <div class="fill ${pct === 100 ? 'green' : pct > 0 ? '' : 'red'}" style="width:${pct}%"></div>
      </div>
      <button class="btn btn-primary btn-block mt-16" onclick="switchProvTab('abonos')">
        Registrar nuevo abono
      </button>
    </div>
  `;
}

function renderProvAbonosHome(p) {
  const payments = (p.payments || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `
    <div class="drawer-section">
      <h3>Historial de abonos (${payments.length})</h3>
      <button class="btn btn-primary btn-sm" style="margin-bottom:16px" onclick="openModalAbonoHome()">
        + Registrar nuevo abono
      </button>
      ${payments.length === 0
        ? '<div class="empty" style="padding:30px 10px"><p>Sin abonos registrados</p></div>'
        : payments.map(pay => `
            <div class="payment-item">
              <div class="payment-icon">
                <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              </div>
              <div class="payment-info">
                <div class="amt">${formatMoney(pay.amount)}</div>
                <div class="date">${formatDate(pay.date)}</div>
                ${pay.note ? `<div class="note">${escapeHtml(pay.note)}</div>` : ''}
              </div>
            </div>
          `).join('')
      }
    </div>
  `;
}

function openModalAbonoHome() {
  const today = new Date().toISOString().split('T')[0];
  $('abonoFecha').value = today;
  $('abonoMonto').value = '';
  $('abonoNota').value = '';
  openModal('modalAbono');
}

function submitAbono() {
  const monto = parseFloat($('abonoMonto').value);
  const fecha = $('abonoFecha').value;
  const nota = $('abonoNota').value.trim();
  if (!monto || monto <= 0 || !fecha) {
    toast('Completa los campos');
    return;
  }

  const p = Providers.get(currentProvId);
  if (!p) return;
  if (!p.payments) p.payments = [];
  p.payments.push({ id: uid(), amount: monto, date: fecha, note: nota });
  Providers.update(currentProvId, { payments: p.payments });

  closeModal('modalAbono');
  renderProvTabHome();
  renderProveedoresListHome();
  renderProvSummaryHome();
  renderInicio();
  toast('Abono registrado');
}

function renderProvAdjuntosHome(p) {
  const attachments = p.attachments || [];
  return `
    <div class="drawer-section">
      <h3>Comprobantes adjuntos (${attachments.length})</h3>
      <div class="attachments-list">
        ${attachments.map(a => `
          <div class="attach-item">
            <div class="attach-icon">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            </div>
            <div class="attach-info">
              <div class="n">${escapeHtml(a.name)}</div>
              <div class="s">${(a.size / 1024).toFixed(0)} KB</div>
            </div>
            <div class="attach-actions">
              <button class="btn-icon" onclick="downloadAdjunto('${a.id}')" title="Descargar">⬇</button>
              <button class="btn-icon" onclick="deleteAdjunto('${a.id}')" title="Borrar">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="upload-zone" onclick="triggerFileUpload()">
        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>
        <p><strong>Adjuntar comprobante</strong></p>
        <p class="hint">Imagen o PDF · máximo 2 MB</p>
      </div>
    </div>
  `;
}

function triggerFileUpload() { $('fileInputAdjunto').click(); }

function handleAdjuntoSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    toast('El archivo supera los 2 MB');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const p = Providers.get(currentProvId);
    if (!p) return;
    if (!p.attachments) p.attachments = [];
    p.attachments.push({
      id: uid(),
      name: file.name,
      size: file.size,
      type: file.type,
      data: e.target.result,
      uploadedAt: now()
    });
    Providers.update(currentProvId, { attachments: p.attachments });
    renderProvTabHome();
    toast('Comprobante adjuntado');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function downloadAdjunto(attId) {
  const p = Providers.get(currentProvId);
  const a = (p.attachments || []).find(x => x.id === attId);
  if (!a) return;
  const link = document.createElement('a');
  link.href = a.data;
  link.download = a.name;
  link.click();
}

function deleteAdjunto(attId) {
  if (!confirm('¿Borrar este adjunto?')) return;
  const p = Providers.get(currentProvId);
  p.attachments = (p.attachments || []).filter(x => x.id !== attId);
  Providers.update(currentProvId, { attachments: p.attachments });
  renderProvTabHome();
  toast('Adjunto borrado');
}

function renderProvNotasHome(p) {
  return `
    <div class="drawer-section">
      <h3>Notas</h3>
      <div class="field">
        <textarea id="pvdNotas" rows="6" placeholder="Notas sobre este proveedor..." style="width:100%;padding:12px;border:1px solid var(--border-strong);border-radius:8px;font-family:inherit;font-size:13px;background:var(--bg);resize:vertical">${escapeHtml(p.notes || '')}</textarea>
      </div>
    </div>
  `;
}

function saveProvChanges() {
  if (!currentProvId) return;
  const p = Providers.get(currentProvId);
  if (!p) return;

  const patch = {};
  if ($('pvdNombre')) patch.name = $('pvdNombre').value;
  if ($('pvdCat')) patch.categoryId = $('pvdCat').value;
  if ($('pvdMonto')) patch.amountTotal = parseFloat($('pvdMonto').value) || 0;
  if ($('pvdDetalles')) patch.details = $('pvdDetalles').value;
  if ($('pvdFechaCont')) patch.contractedAt = $('pvdFechaCont').value;
  if ($('pvdFechaFinal')) patch.finalPaymentDue = $('pvdFechaFinal').value;
  if ($('pvdNotas')) patch.notes = $('pvdNotas').value;

  Providers.update(currentProvId, patch);
  toast('Cambios guardados');
  renderProveedoresListHome();
  renderProvSummaryHome();
  renderInicio();
}

/* ==================== MODAL: NUEVO PROVEEDOR ==================== */
function openNuevoProveedorHome() {
  const cats = getCategories();
  $('nprovCat').innerHTML = cats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  $('formNuevoProveedor').reset();
  $('nprovFecha').value = new Date().toISOString().split('T')[0];
  openModal('modalNuevoProveedor');
}

function submitNuevoProveedorHome() {
  const nombre = $('nprovNombre').value.trim();
  const cat = $('nprovCat').value;
  const monto = parseFloat($('nprovMonto').value);
  const detalles = $('nprovDetalles').value.trim();
  const fecha = $('nprovFecha').value;
  const fechaFinal = $('nprovFechaFinal').value;

  if (!nombre || !cat || !monto) {
    toast('Completa los campos obligatorios');
    return;
  }

  Providers.create({
    weddingId: currentWedding.id,
    name: nombre,
    categoryId: cat,
    details: detalles,
    amountTotal: monto,
    contractedAt: fecha,
    finalPaymentDue: fechaFinal
  });

  closeModal('modalNuevoProveedor');
  renderProveedoresListHome();
  renderProvSummaryHome();
  renderInicio();
  toast('Proveedor agregado');
}

/* ==================== MODALES (helpers) ==================== */
function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

$$('.modal-backdrop').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('open');
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('provDrawer').classList.contains('open')) closeProvDrawer();
    $$('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  }
});

/* ==================== EXPORTACIÓN CSV ==================== */
function downloadCSV(filename, rows) {
  const BOM = '\uFEFF';
  const csv = BOM + rows.map(r => r.map(cell => {
    const s = String(cell ?? '');
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(';')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  toast('Archivo descargado');
}

function exportProveedoresCSV() {
  if (!currentWedding) return;
  const provs = Providers.forWedding(currentWedding.id);
  const rows = [
    ['Nombre', 'Categoría', 'Alcance', 'Monto total', 'Abonado', 'Pendiente', 'Estado', 'Fecha contratación', 'Fecha pago final']
  ];
  provs.forEach(p => {
    const cat = getCategories().find(c => c.id === p.categoryId);
    const status = Providers.status(p);
    const statusLabel = { sin_iniciar: 'Sin iniciar', en_curso: 'En curso', pagado: 'Pagado' }[status] || status;
    rows.push([
      p.name,
      cat ? cat.name : 'Sin categoría',
      p.details || '',
      p.amountTotal,
      Providers.amountPaid(p),
      Providers.amountPending(p),
      statusLabel,
      p.contractedAt || '',
      p.finalPaymentDue || ''
    ]);
  });
  const slug = `${currentWedding.partnerA}-${currentWedding.partnerB}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  downloadCSV(`proveedores-${slug}-${new Date().toISOString().split('T')[0]}.csv`, rows);
}

function exportInvitadosCSV() {
  if (!currentWedding) return;
  const guests = Guests.forWedding(currentWedding.id);
  const rows = [['Nombre', 'Correo', 'RSVP']];
  guests.forEach(g => rows.push([g.name, g.email || '', g.rsvp]));
  downloadCSV(`invitados-${new Date().toISOString().split('T')[0]}.csv`, rows);
}

function exportPresupuestoCSV() {
  if (!currentWedding) return;
  const items = Budget.forWedding(currentWedding.id);
  const rows = [['Concepto', 'Monto', 'Estado']];
  items.forEach(b => rows.push([b.concept, b.amount, b.paid ? 'Pagado' : 'Pendiente']));
  downloadCSV(`presupuesto-${new Date().toISOString().split('T')[0]}.csv`, rows);
}

/* ==================== INICIALIZACIÓN ==================== */
(function init() {
  getCategories();
  const u = Auth.current();
  if (u) {
    startApp(u);
  } else {
    showLanding();
  }
})();