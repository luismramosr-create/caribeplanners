/* ============================================================
   CARIBEPLANNERS — PANEL DEL EQUIPO
   Datos, autenticación, navegación
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
  categories: 'cp_cat',
  notes:      'cp_notes'
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
  } catch { return iso; }
}
function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
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

/* ==================== SEED DEL EQUIPO Y DEMO ==================== */
(function seed() {
  const users = read(K.users);

  // Admin del equipo
  if (!users.find(u => u.email === 'admin@caribeplanners.com')) {
    users.push({
      id: 'team-admin',
      name: 'Equipo CaribePlanners',
      email: 'admin@caribeplanners.com',
      password: hash('admin123'),
      role: 'admin',
      type: 'team',
      active: true,
      createdAt: now()
    });
  }

  // Planner — Regina Lazzarin
  if (!users.find(u => u.email === 'regina@caribeplanners.com')) {
    users.push({
      id: 'team-regina',
      name: 'Regina Lazzarin',
      email: 'regina@caribeplanners.com',
      password: hash('equipo123'),
      role: 'planner',
      type: 'team',
      active: true,
      createdAt: now()
    });
  }

  // Coordinador — Luis Ramos
  if (!users.find(u => u.email === 'luis@caribeplanners.com')) {
    users.push({
      id: 'team-luis',
      name: 'Luis Ramos',
      email: 'luis@caribeplanners.com',
      password: hash('equipo123'),
      role: 'coordinador',
      type: 'team',
      active: true,
      createdAt: now()
    });
  }

  // Pareja demo 1 — Ana y Carlos
  let couple1 = users.find(u => u.email === 'pareja@caribeplanners.com');
  if (!couple1) {
    couple1 = {
      id: 'couple-ana',
      name: 'Ana y Carlos',
      email: 'pareja@caribeplanners.com',
      password: hash('pareja123'),
      role: 'couple',
      type: 'couple',
      active: true,
      createdAt: now()
    };
    users.push(couple1);
  }

  // Pareja demo 2 — Sofía y Diego
  let couple2 = users.find(u => u.email === 'sofia@caribeplanners.com');
  if (!couple2) {
    couple2 = {
      id: 'couple-sofia',
      name: 'Sofía y Diego',
      email: 'sofia@caribeplanners.com',
      password: hash('pareja123'),
      role: 'couple',
      type: 'couple',
      active: true,
      createdAt: now()
    };
    users.push(couple2);
  }

  // Pareja demo 3 — Lucía y Mateo
  let couple3 = users.find(u => u.email === 'lucia@caribeplanners.com');
  if (!couple3) {
    couple3 = {
      id: 'couple-lucia',
      name: 'Lucía y Mateo',
      email: 'lucia@caribeplanners.com',
      password: hash('pareja123'),
      role: 'couple',
      type: 'couple',
      active: true,
      createdAt: now()
    };
    users.push(couple3);
  }

  write(K.users, users);

  // Bodas demo
  const weds = read(K.wed);

  if (!weds.find(w => w.ownerId === couple1.id)) {
    weds.push({
      id: 'wed-ana-carlos',
      ownerId: couple1.id,
      partnerA: 'Ana',
      partnerB: 'Carlos',
      date: '2026-12-12',
      location: 'Cartagena, Colombia',
      status: 'en_planificacion',
      priority: 'alta',
      plannerId: 'team-regina',
      createdAt: now()
    });
  }

  if (!weds.find(w => w.ownerId === couple2.id)) {
    weds.push({
      id: 'wed-sofia-diego',
      ownerId: couple2.id,
      partnerA: 'Sofía',
      partnerB: 'Diego',
      date: '2027-03-20',
      location: 'Santa Marta, Colombia',
      status: 'nuevas',
      priority: 'media',
      plannerId: 'team-regina',
      createdAt: now()
    });
  }

  if (!weds.find(w => w.ownerId === couple3.id)) {
    weds.push({
      id: 'wed-lucia-mateo',
      ownerId: couple3.id,
      partnerA: 'Lucía',
      partnerB: 'Mateo',
      date: '2026-11-15',
      location: 'Barranquilla, Colombia',
      status: 'a_punto',
      priority: 'alta',
      plannerId: 'team-admin',
      createdAt: now()
    });
  }

  write(K.wed, weds);

  // Proveedores demo para Ana y Carlos
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

/* ==================== AUTH DEL EQUIPO ==================== */
const Auth = {
  login(email, password) {
    const users = read(K.users);
    const u = users.find(x =>
      x.email.toLowerCase() === email.toLowerCase() &&
      x.password === hash(password)
    );
    if (!u) throw new Error('Correo o contraseña incorrectos');
    if (u.type !== 'team') throw new Error('Esta cuenta no tiene acceso al panel del equipo');
    if (!u.active) throw new Error('Tu cuenta está desactivada');
    write(K.sess, { userId: u.id, at: now() });
    return u;
  },
  current() {
    const s = read(K.sess, null);
    if (!s) return null;
    const u = read(K.users).find(x => x.id === s.userId) || null;
    if (!u || u.type !== 'team') return null;
    return u;
  },
  logout() { localStorage.removeItem(K.sess); }
};

/* ==================== ENTIDADES ==================== */
const Weddings = {
  all: () => read(K.wed),
  get: id => read(K.wed).find(w => w.id === id),
  forUser: uid => read(K.wed).find(w => w.ownerId === uid) || null,
  update: (id, patch) => {
    const a = read(K.wed);
    const w = a.find(x => x.id === id);
    if (w) Object.assign(w, patch);
    write(K.wed, a);
    return w;
  },
  create: (ownerId, data = {}) => {
    const a = read(K.wed);
    const w = {
      id: uid(),
      ownerId,
      partnerA: data.partnerA || '',
      partnerB: data.partnerB || '',
      date: data.date || '',
      location: data.location || '',
      status: data.status || 'nuevas',
      priority: data.priority || 'media',
      plannerId: data.plannerId || '',
      createdAt: now()
    };
    a.push(w);
    write(K.wed, a);
    return w;
  },
  remove: id => {
    write(K.wed, read(K.wed).filter(w => w.id !== id));
  }
};

const Users = {
  all: () => read(K.users),
  team: () => read(K.users).filter(u => u.type === 'team' && u.active !== false),
  couples: () => read(K.users).filter(u => u.type === 'couple'),
  get: id => read(K.users).find(u => u.id === id),
  update: (id, patch) => {
    const a = read(K.users);
    const u = a.find(x => x.id === id);
    if (u) Object.assign(u, patch);
    write(K.users, a);
    return u;
  },
  create: (data) => {
    const a = read(K.users);
    const u = {
      id: uid(),
      name: data.name,
      email: data.email.toLowerCase(),
      password: hash(data.password),
      role: data.role,
      type: data.type || 'team',
      active: true,
      createdAt: now()
    };
    a.push(u);
    write(K.users, a);
    return u;
  },
  remove: id => {
    write(K.users, read(K.users).filter(u => u.id !== id));
  }
};

const Tasks = {
  forWedding: id => read(K.tasks).filter(t => t.weddingId === id)
};

const Guests = {
  forWedding: id => read(K.guests).filter(g => g.weddingId === id)
};

const Notes = {
  forWedding: id => read(K.notes).filter(n => n.weddingId === id),
  add: (weddingId, text) => {
    const a = read(K.notes);
    a.push({
      id: uid(),
      weddingId,
      text,
      userId: currentUser?.id,
      userName: currentUser?.name || 'Equipo',
      createdAt: now()
    });
    write(K.notes, a);
  }
};

const Providers = {
  all: () => read(K.providers),
  forWedding: id => read(K.providers).filter(p => p.weddingId === id),
  get: id => read(K.providers).find(p => p.id === id),
  update: (id, patch) => {
    const a = read(K.providers);
    const p = a.find(x => x.id === id);
    if (p) Object.assign(p, patch);
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

/* ==================== ESTADO GLOBAL ==================== */
let currentUser = null;
let currentView = 'tablero';
let kanbanFilter = 'all';
let selectedWeddingForProviders = null;
let currentParejaId = null;
let currentParejaTab = 'resumen';
let currentProvId = null;
let currentProvTab = 'datos';
/* ==================== LOGIN DEL EQUIPO ==================== */
$('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const err = $('loginError');
  err.classList.remove('show');
  try {
    const u = Auth.login($('loginEmail').value, $('loginPassword').value);
    startApp(u);
  } catch (error) {
    err.textContent = error.message;
    err.classList.add('show');
  }
});

window.quickLogin = function (email, password) {
  const err = $('loginError');
  err.classList.remove('show');
  try {
    const u = Auth.login(email, password);
    startApp(u);
  } catch (error) {
    err.textContent = error.message;
    err.classList.add('show');
  }
};

/* ==================== LOGOUT ==================== */
function logout() {
  if (!confirm('¿Cerrar sesión?')) return;
  Auth.logout();
  currentUser = null;
  $('appView').classList.add('hidden');
  $('loginView').classList.remove('hidden');
  $('loginForm').reset();
}

/* ==================== APP START ==================== */
function startApp(user) {
  currentUser = user;
  $('loginView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  $('sideUserName').textContent = user.name;
  $('sideUserEmail').textContent = user.email;
  $('sideUserRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  $('topbarUser').textContent = user.name;

  showView('tablero');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ==================== NAVEGACIÓN ==================== */
const VIEW_TITLES = {
  tablero: 'Tablero',
  parejas: 'Parejas',
  agenda: 'Agenda',
  proveedores: 'Proveedores',
  equipo: 'Equipo',
  estadisticas: 'Estadísticas'
};

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
    case 'tablero':      renderTablero(); break;
    case 'parejas':      renderParejasList(); break;
    case 'agenda':       renderAgenda(); break;
    case 'proveedores':  renderProveedoresViewAdmin(); break;
    case 'equipo':       renderEquipo(); break;
    case 'estadisticas': renderEstadisticas(); break;
  }
}

/* ==================== FILTRO KANBAN ==================== */
function setKanbanFilter(filter, btn) {
  kanbanFilter = filter;
  $$('#kanbanFilters button').forEach(b => {
    b.style.background = '';
    b.style.color = '';
    b.style.borderColor = '';
  });
  btn.style.background = 'var(--text)';
  btn.style.color = 'var(--white)';
  btn.style.borderColor = 'var(--text)';
  renderTablero();
}

/* ==================== TABLERO (KANBAN) ==================== */
function renderTablero() {
  const weds = Weddings.all();
  const activeWeds = weds.filter(w => w.status !== 'casadas');
  const thisMonth = weds.filter(w => {
    if (!w.date) return false;
    const d = new Date(w.date);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const totalBudget = weds.reduce((sum, w) => {
    return sum + Providers.forWedding(w.id).reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);
  }, 0);

  $('tableroStats').innerHTML = `
    <div class="metric-card">
      <div class="l">Parejas activas</div>
      <div class="v accent">${activeWeds.length}</div>
    </div>
    <div class="metric-card">
      <div class="l">Total parejas</div>
      <div class="v">${weds.length}</div>
    </div>
    <div class="metric-card">
      <div class="l">Bodas este mes</div>
      <div class="v">${thisMonth.length}</div>
    </div>
    <div class="metric-card">
      <div class="l">Volumen total</div>
      <div class="v">${formatMoney(totalBudget)}</div>
    </div>
  `;

  const columns = [
    { key: 'nuevas', label: 'Nuevas' },
    { key: 'en_planificacion', label: 'En planificación' },
    { key: 'a_punto', label: 'A punto' },
    { key: 'casadas', label: 'Casadas' }
  ];

  const kanban = $('kanban');
  kanban.innerHTML = '';

  columns.forEach(col => {
    let wedsInCol = weds.filter(w => (w.status || 'nuevas') === col.key);

    if (kanbanFilter === 'alta') {
      wedsInCol = wedsInCol.filter(w => w.priority === 'alta');
    } else if (kanbanFilter === 'este-mes') {
      wedsInCol = wedsInCol.filter(w => {
        if (!w.date) return false;
        const d = new Date(w.date);
        const today = new Date();
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
    }

    const colEl = document.createElement('div');
    colEl.className = 'kanban-col';
    colEl.dataset.status = col.key;
    colEl.innerHTML = `
      <div class="kanban-col-head">
        <h3>${col.label}</h3>
        <span class="count">${wedsInCol.length}</span>
      </div>
      <div class="kanban-cards"></div>
    `;

    colEl.addEventListener('dragover', e => {
      e.preventDefault();
      colEl.classList.add('drag-over');
    });
    colEl.addEventListener('dragleave', () => {
      colEl.classList.remove('drag-over');
    });
    colEl.addEventListener('drop', e => {
      e.preventDefault();
      colEl.classList.remove('drag-over');
      const weddingId = e.dataTransfer.getData('text/wedding-id');
      if (weddingId) {
        Weddings.update(weddingId, { status: col.key });
        renderTablero();
        toast('Estado actualizado');
      }
    });

    const cardsWrap = colEl.querySelector('.kanban-cards');
    if (wedsInCol.length === 0) {
      cardsWrap.innerHTML = '<div style="text-align:center;padding:20px 10px;font-size:12px;color:var(--text-ter)">Sin parejas aquí</div>';
    } else {
      wedsInCol.forEach(w => {
        cardsWrap.appendChild(renderParejaCard(w));
      });
    }

    kanban.appendChild(colEl);
  });
}

function renderParejaCard(w) {
  const tasks = Tasks.forWedding(w.id);
  const tasksDone = tasks.filter(t => t.done).length;
  const tasksPct = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0;

  const guests = Guests.forWedding(w.id);
  const guestsConfirmed = guests.filter(g => g.rsvp === 'confirmado').length;

  const provs = Providers.forWedding(w.id);
  const totalBudget = provs.reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);
  const totalPaid = provs.reduce((s, p) => s + Providers.amountPaid(p), 0);

  const days = daysUntil(w.date);
  const daysLabel = days !== null
    ? (days > 0 ? `${days} días` : days === 0 ? '¡Hoy!' : 'Pasada')
    : '—';
  const daysClass = days !== null && days <= 15 && days > 0 ? 'urgent' : '';

  const planner = Users.get(w.plannerId);
  const plannerName = planner ? planner.name : 'Sin asignar';
  const plannerInitials = initials(plannerName);

  const card = document.createElement('div');
  card.className = 'p-card';
  card.draggable = true;
  card.dataset.weddingId = w.id;

  card.innerHTML = `
    <div class="p-card-head">
      <div class="p-card-title">${escapeHtml(w.partnerA)} &amp; ${escapeHtml(w.partnerB)}</div>
      <span class="priority-dot ${w.priority || 'media'}" title="Prioridad ${w.priority || 'media'}"></span>
    </div>
    <div class="p-card-date">
      <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
      ${formatDate(w.date)}
      <span class="days-left ${daysClass}">${daysLabel}</span>
    </div>
    <div class="p-card-row">
      <span class="label">
        <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        Tareas
      </span>
      <strong>${tasksDone}/${tasks.length}</strong>
    </div>
    <div class="progress-bar"><div class="fill" style="width:${tasksPct}%"></div></div>
    <div class="p-card-row" style="margin-top:12px">
      <span class="label">
        <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/></svg>
        Invitados
      </span>
      <strong>${guestsConfirmed}/${guests.length}</strong>
    </div>
    <div class="p-card-row">
      <span class="label">
        <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>
        Presupuesto
      </span>
      <strong>${formatMoney(totalPaid)} / ${formatMoney(totalBudget)}</strong>
    </div>
    <div class="p-card-planner">
      <div class="avatar">${plannerInitials}</div>
      <span>${escapeHtml(plannerName)}</span>
    </div>
  `;

  card.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/wedding-id', w.id);
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });
  card.addEventListener('click', () => {
    openParejaDrawer(w.id);
  });

  return card;
}

/* ==================== VISTA: PAREJAS (LISTA) ==================== */
function renderParejasList() {
  const weds = Weddings.all();
  const filterEstado = $('filterParejaEstado')?.value || 'all';
  const filterPrioridad = $('filterParejaPrioridad')?.value || 'all';

  let list = weds.slice();
  if (filterEstado !== 'all') list = list.filter(w => w.status === filterEstado);
  if (filterPrioridad !== 'all') list = list.filter(w => w.priority === filterPrioridad);

  $('parejasCount').textContent = `${list.length} parejas`;

  const tbody = $('parejasTable').querySelector('tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">Sin parejas</td></tr>';
    return;
  }

  const priorityBadge = { alta: 'badge-danger', media: 'badge-warning', baja: 'badge-success' };

  tbody.innerHTML = list.map(w => {
    const user = Users.get(w.ownerId);
    const planner = Users.get(w.plannerId);
    const tasks = Tasks.forWedding(w.id);
    const guests = Guests.forWedding(w.id);
    const provs = Providers.forWedding(w.id);
    const total = provs.reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);
    const paid = provs.reduce((s, p) => s + Providers.amountPaid(p), 0);

    return `
      <tr class="pareja-row" onclick="openParejaDrawer('${w.id}')">
        <td><strong>${escapeHtml(w.partnerA)} &amp; ${escapeHtml(w.partnerB)}</strong><br><span class="text-xs text-ter">${user ? escapeHtml(user.email) : '—'}</span></td>
        <td class="text-sm">${formatDate(w.date)}<br><span class="text-xs text-ter">${escapeHtml(w.location || '')}</span></td>
        <td class="text-sm">${planner ? escapeHtml(planner.name) : '<span class="text-ter">Sin asignar</span>'}</td>
        <td class="text-sm">${tasks.filter(t => t.done).length}/${tasks.length}</td>
        <td class="text-sm">${guests.filter(g => g.rsvp === 'confirmado').length}/${guests.length}</td>
        <td class="text-sm">${formatMoney(paid)} / ${formatMoney(total)}</td>
        <td><span class="badge ${priorityBadge[w.priority] || 'badge-neutral'}">${w.priority || 'media'}</span></td>
        <td class="actions"><button class="btn-icon" onclick="event.stopPropagation();openParejaDrawer('${w.id}')">→</button></td>
      </tr>
    `;
  }).join('');
}

/* ==================== VISTA: AGENDA ==================== */
function renderAgenda() {
  const weds = Weddings.all()
    .filter(w => w.date && w.status !== 'casadas')
    .sort((a, b) => a.date.localeCompare(b.date));

  const soon = [];
  const later = [];

  weds.forEach(w => {
    const days = daysUntil(w.date);
    if (days === null || days < 0) return;
    if (days <= 90) soon.push({ w, days });
    else later.push({ w, days });
  });

  $('agendaCount').textContent = `${soon.length} bodas`;

  $('agendaList').innerHTML = soon.length === 0
    ? '<div class="empty"><p>Sin bodas en los próximos 90 días</p></div>'
    : soon.map(({ w, days }) => renderAgendaItem(w, days)).join('');

  $('agendaLater').innerHTML = later.length === 0
    ? '<div class="empty"><p>Sin bodas agendadas más adelante</p></div>'
    : later.map(({ w, days }) => renderAgendaItem(w, days)).join('');
}

function renderAgendaItem(w, days) {
  const d = new Date(w.date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase().replace('.', '');
  const planner = Users.get(w.plannerId);
  const daysLabel = days === 0 ? '¡HOY!' : days === 1 ? 'Mañana' : `En ${days} días`;

  return `
    <div class="agenda-item" onclick="openParejaDrawer('${w.id}')">
      <div class="agenda-date">
        <div class="day">${day}</div>
        <div class="month">${month}</div>
      </div>
      <div class="agenda-info">
        <div class="name">${escapeHtml(w.partnerA)} &amp; ${escapeHtml(w.partnerB)}</div>
        <div class="place">${escapeHtml(w.location || '—')} · ${planner ? escapeHtml(planner.name) : 'Sin asignar'}</div>
      </div>
      <span class="badge ${days <= 30 ? 'badge-danger' : 'badge-primary'}" style="font-size:12px;padding:5px 12px">${daysLabel}</span>
    </div>
  `;
}
/* ==================== DRAWER: FICHA DE PAREJA ==================== */
function openParejaDrawer(weddingId) {
  currentParejaId = weddingId;
  currentParejaTab = 'resumen';
  const w = Weddings.get(weddingId);
  if (!w) return;

  const user = Users.get(w.ownerId);
  $('pdTitle').textContent = `${w.partnerA} & ${w.partnerB}`;
  $('pdDate').textContent = formatDate(w.date);
  $('pdLocation').textContent = w.location || '—';

  $$('#pdTabs .drawer-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'resumen');
  });

  renderParejaTab();
  $('parejaDrawerBackdrop').classList.add('open');
  $('parejaDrawer').classList.add('open');
}

function closeParejaDrawer() {
  $('parejaDrawerBackdrop').classList.remove('open');
  $('parejaDrawer').classList.remove('open');
  currentParejaId = null;
}

function switchParejaTab(tab) {
  currentParejaTab = tab;
  $$('#pdTabs .drawer-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderParejaTab();
}

function renderParejaTab() {
  const w = Weddings.get(currentParejaId);
  if (!w) return;
  const body = $('pdBody');

  if (currentParejaTab === 'resumen') body.innerHTML = renderParejaResumen(w);
  else if (currentParejaTab === 'tareas') body.innerHTML = renderParejaTareas(w);
  else if (currentParejaTab === 'invitados') body.innerHTML = renderParejaInvitados(w);
  else if (currentParejaTab === 'proveedores') body.innerHTML = renderParejaProveedores(w);
  else if (currentParejaTab === 'notas') body.innerHTML = renderParejaNotas(w);
}

function renderParejaResumen(w) {
  const planners = Users.team();
  const tasks = Tasks.forWedding(w.id);
  const guests = Guests.forWedding(w.id);
  const provs = Providers.forWedding(w.id);
  const totalBudget = provs.reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);
  const totalPaid = provs.reduce((s, p) => s + Providers.amountPaid(p), 0);

  return `
    <div class="drawer-section">
      <h3>Información de la boda</h3>
      <div class="form-grid cols-2">
        <div class="field">
          <label>Novio/a 1</label>
          <input type="text" id="pdA" value="${escapeHtml(w.partnerA || '')}">
        </div>
        <div class="field">
          <label>Novio/a 2</label>
          <input type="text" id="pdB" value="${escapeHtml(w.partnerB || '')}">
        </div>
        <div class="field">
          <label>Fecha</label>
          <input type="date" id="pdFechaInput" value="${w.date || ''}">
        </div>
        <div class="field">
          <label>Lugar</label>
          <input type="text" id="pdLugar" value="${escapeHtml(w.location || '')}">
        </div>
        <div class="field">
          <label>Estado</label>
          <select id="pdEstadoInput">
            <option value="nuevas" ${w.status === 'nuevas' ? 'selected' : ''}>Nuevas</option>
            <option value="en_planificacion" ${w.status === 'en_planificacion' ? 'selected' : ''}>En planificación</option>
            <option value="a_punto" ${w.status === 'a_punto' ? 'selected' : ''}>A punto</option>
            <option value="casadas" ${w.status === 'casadas' ? 'selected' : ''}>Casadas</option>
          </select>
        </div>
        <div class="field">
          <label>Prioridad</label>
          <select id="pdPrioridadInput">
            <option value="baja" ${w.priority === 'baja' ? 'selected' : ''}>Baja</option>
            <option value="media" ${w.priority === 'media' ? 'selected' : ''}>Media</option>
            <option value="alta" ${w.priority === 'alta' ? 'selected' : ''}>Alta</option>
          </select>
        </div>
        <div class="field full">
          <label>Planner asignado</label>
          <select id="pdPlannerInput">
            <option value="">— Sin asignar —</option>
            ${planners.map(p => `<option value="${p.id}" ${w.plannerId === p.id ? 'selected' : ''}>${escapeHtml(p.name)} (${p.role})</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="drawer-section">
      <h3>Métricas</h3>
      <div class="info-grid">
        <div class="info-block">
          <div class="label">Tareas completadas</div>
          <div class="value big">${tasks.filter(t => t.done).length}/${tasks.length}</div>
        </div>
        <div class="info-block">
          <div class="label">Invitados confirmados</div>
          <div class="value big">${guests.filter(g => g.rsvp === 'confirmado').length}/${guests.length}</div>
        </div>
        <div class="info-block">
          <div class="label">Total contratado</div>
          <div class="value big">${formatMoney(totalBudget)}</div>
        </div>
        <div class="info-block">
          <div class="label">Total abonado</div>
          <div class="value big" style="color:var(--success)">${formatMoney(totalPaid)}</div>
        </div>
      </div>
    </div>
  `;
}

function renderParejaTareas(w) {
  const tasks = Tasks.forWedding(w.id);
  if (!tasks.length) {
    return '<div class="empty"><h3>Sin tareas</h3><p>Esta pareja aún no tiene tareas registradas</p></div>';
  }
  return `
    <div class="drawer-section">
      <h3>${tasks.length} tareas · ${tasks.filter(t => t.done).length} completadas</h3>
      ${tasks.map(t => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
          <input type="checkbox" ${t.done ? 'checked' : ''} disabled style="width:18px;height:18px;accent-color:var(--primary-dark)">
          <span style="flex:1;font-size:14px;${t.done ? 'text-decoration:line-through;color:var(--text-ter)' : ''}">${escapeHtml(t.text)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderParejaInvitados(w) {
  const guests = Guests.forWedding(w.id);
  if (!guests.length) {
    return '<div class="empty"><h3>Sin invitados</h3><p>Aún no hay invitados registrados</p></div>';
  }
  return `
    <div class="drawer-section">
      <h3>${guests.length} invitados · ${guests.filter(g => g.rsvp === 'confirmado').length} confirmados</h3>
      <table class="tbl">
        <thead><tr><th>Nombre</th><th>Correo</th><th>RSVP</th></tr></thead>
        <tbody>
          ${guests.map(g => {
            const rsvpClass = g.rsvp === 'confirmado' ? 'badge-success' : g.rsvp === 'rechazado' ? 'badge-danger' : 'badge-warning';
            return `
              <tr>
                <td>${escapeHtml(g.name)}</td>
                <td class="text-sm text-sec">${escapeHtml(g.email || '—')}</td>
                <td><span class="badge ${rsvpClass}">${g.rsvp}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderParejaProveedores(w) {
  const provs = Providers.forWedding(w.id);
  if (!provs.length) {
    return '<div class="empty"><h3>Sin proveedores</h3><p>Aún no hay proveedores asignados</p></div>';
  }
  return `
    <div class="drawer-section">
      <h3>${provs.length} proveedores</h3>
      ${provs.map(p => {
        const cat = getCategories().find(c => c.id === p.categoryId);
        const paid = Providers.amountPaid(p);
        const pct = Providers.progress(p);
        return `
          <div style="padding:14px 0;border-bottom:1px solid var(--border)">
            <div class="flex-between" style="margin-bottom:6px">
              <strong style="font-size:14px">${escapeHtml(p.name)}</strong>
              <span class="text-sm text-ter">${cat ? escapeHtml(cat.name) : ''}</span>
            </div>
            <div class="flex-between text-sm text-sec" style="margin-bottom:6px">
              <span>${formatMoney(paid)} de ${formatMoney(p.amountTotal)}</span>
              <strong style="color:var(--text)">${pct}%</strong>
            </div>
            <div class="progress-bar">
              <div class="fill ${pct === 100 ? 'green' : pct > 0 ? '' : 'red'}" style="width:${pct}%"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderParejaNotas(w) {
  const notes = Notes.forWedding(w.id);
  return `
    <div class="drawer-section">
      <h3>Notas del equipo (${notes.length})</h3>
      <button class="btn btn-primary btn-sm" style="margin-bottom:16px" onclick="openModal('modalNuevaNota')">+ Nueva nota</button>
      ${notes.length === 0
        ? '<div class="empty" style="padding:30px 10px"><p>Sin notas todavía</p></div>'
        : notes.map(n => `
            <div class="info-block mt-16" style="text-align:left">
              <div class="text-xs text-ter">${formatDate(n.createdAt)} · ${escapeHtml(n.userName || 'Equipo')}</div>
              <div style="font-size:13px;margin-top:6px">${escapeHtml(n.text)}</div>
            </div>
          `).join('')
      }
    </div>
  `;
}

function saveParejaChanges() {
  if (!currentParejaId) return;
  const w = Weddings.get(currentParejaId);
  if (!w) return;

  const patch = {};
  if ($('pdA')) patch.partnerA = $('pdA').value;
  if ($('pdB')) patch.partnerB = $('pdB').value;
  if ($('pdFechaInput')) patch.date = $('pdFechaInput').value;
  if ($('pdLugar')) patch.location = $('pdLugar').value;
  if ($('pdEstadoInput')) patch.status = $('pdEstadoInput').value;
  if ($('pdPrioridadInput')) patch.priority = $('pdPrioridadInput').value;
  if ($('pdPlannerInput')) patch.plannerId = $('pdPlannerInput').value;

  Weddings.update(currentParejaId, patch);
  toast('Cambios guardados');
  renderTablero();
  if (currentView === 'parejas') renderParejasList();
  if (currentView === 'agenda') renderAgenda();
}

function deleteParejaFromDrawer() {
  if (!currentParejaId) return;
  const w = Weddings.get(currentParejaId);
  if (!w) return;
  if (!confirm(`¿Borrar la boda de ${w.partnerA} y ${w.partnerB}? Esta acción no se puede deshacer.`)) return;

  // Borrar boda
  Weddings.remove(currentParejaId);

  // Borrar usuario pareja si existe
  if (w.ownerId) Users.remove(w.ownerId);

  // Borrar datos relacionados
  write(K.tasks, read(K.tasks).filter(t => t.weddingId !== currentParejaId));
  write(K.guests, read(K.guests).filter(g => g.weddingId !== currentParejaId));
  write(K.providers, read(K.providers).filter(p => p.weddingId !== currentParejaId));
  write(K.notes, read(K.notes).filter(n => n.weddingId !== currentParejaId));

  closeParejaDrawer();
  renderTablero();
  renderParejasList();
  toast('Pareja borrada');
}

/* ==================== MODAL: NUEVA PAREJA ==================== */
function openNuevaPareja() {
  const planners = Users.team();
  $('npPlanner').innerHTML = '<option value="">— Sin asignar —</option>' +
    planners.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.role})</option>`).join('');
  $('formNuevaPareja').reset();
  $('npPassword').value = 'pareja123';
  openModal('modalNuevaPareja');
}

function submitNuevaPareja() {
  const nombre = $('npNombre').value.trim();
  const email = $('npEmail').value.trim().toLowerCase();
  const password = $('npPassword').value;
  const a = $('npA').value.trim();
  const b = $('npB').value.trim();
  const fecha = $('npFecha').value;
  const lugar = $('npLugar').value.trim();
  const plannerId = $('npPlanner').value;
  const prioridad = $('npPrioridad').value;
  const estado = $('npEstado').value;

  if (!nombre || !email || !password) {
    toast('Completa los campos obligatorios');
    return;
  }

  const users = read(K.users);
  if (users.find(u => u.email.toLowerCase() === email)) {
    toast('Ese correo ya está registrado');
    return;
  }

  // Crear usuario pareja
  const userId = uid();
  users.push({
    id: userId,
    name: nombre,
    email,
    password: hash(password),
    role: 'couple',
    type: 'couple',
    active: true,
    createdAt: now()
  });
  write(K.users, users);

  // Crear boda
  Weddings.create(userId, {
    partnerA: a || nombre.split(' ')[0] || nombre,
    partnerB: b,
    date: fecha,
    location: lugar,
    plannerId,
    priority: prioridad,
    status: estado
  });

  closeModal('modalNuevaPareja');
  renderTablero();
  if (currentView === 'parejas') renderParejasList();
  toast('Pareja creada');
}

/* ==================== MODAL: NUEVO MIEMBRO ==================== */
function openNuevoMiembro() {
  $('formNuevoMiembro').reset();
  $('nmPassword').value = 'equipo123';
  openModal('modalNuevoMiembro');
}

function submitNuevoMiembro() {
  const nombre = $('nmNombre').value.trim();
  const email = $('nmEmail').value.trim().toLowerCase();
  const password = $('nmPassword').value;
  const rol = $('nmRol').value;

  if (!nombre || !email || !password) {
    toast('Completa los campos');
    return;
  }

  const users = read(K.users);
  if (users.find(u => u.email.toLowerCase() === email)) {
    toast('Ese correo ya está registrado');
    return;
  }

  Users.create({ name: nombre, email, password, role: rol, type: 'team' });

  closeModal('modalNuevoMiembro');
  renderEquipo();
  toast('Miembro agregado');
}

/* ==================== MODAL: NUEVA NOTA ==================== */
function submitNuevaNota() {
  const text = $('nnTexto').value.trim();
  if (!text) {
    toast('Escribe algo antes de guardar');
    return;
  }
  Notes.add(currentParejaId, text);
  closeModal('modalNuevaNota');
  $('nnTexto').value = '';
  renderParejaTab();
  toast('Nota guardada');
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
    if ($('parejaDrawer').classList.contains('open')) closeParejaDrawer();
    if ($('provDrawerAdmin').classList.contains('open')) closeProvDrawerAdmin();
    $$('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  }
});

/* ==================== VISTA: PROVEEDORES (ADMIN) ==================== */
function renderProveedoresViewAdmin() {
  const weds = Weddings.all();

  const sel = $('proveedorWeddingSelect');
  if (!weds.length) {
    sel.innerHTML = '<option value="">No hay bodas registradas</option>';
    $('provSummaryAdmin').innerHTML = '';
    $('provListAdmin').innerHTML = '<div class="empty"><h3>Sin bodas</h3><p>Crea una pareja primero</p></div>';
    return;
  }

  sel.innerHTML = weds.map(w => {
    const label = `${w.partnerA} & ${w.partnerB} — ${formatDate(w.date)}`;
    return `<option value="${w.id}" ${selectedWeddingForProviders === w.id ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');

  if (!selectedWeddingForProviders || !weds.find(w => w.id === selectedWeddingForProviders)) {
    selectedWeddingForProviders = weds[0].id;
    sel.value = selectedWeddingForProviders;
  }

  renderProvSummaryAdmin();
  renderProvListAdmin();
}

function selectWeddingForProviders(weddingId) {
  selectedWeddingForProviders = weddingId;
  renderProvSummaryAdmin();
  renderProvListAdmin();
}

function renderProvSummaryAdmin() {
  if (!selectedWeddingForProviders) return;
  const provs = Providers.forWedding(selectedWeddingForProviders);
  const totalContratado = provs.reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);
  const totalAbonado = provs.reduce((s, p) => s + Providers.amountPaid(p), 0);
  const totalPendiente = Math.max(0, totalContratado - totalAbonado);
  const pct = totalContratado > 0 ? Math.round((totalAbonado / totalContratado) * 100) : 0;

  const pagados = provs.filter(p => Providers.status(p) === 'pagado').length;
  const enCurso = provs.filter(p => Providers.status(p) === 'en_curso').length;
  const sinIniciar = provs.filter(p => Providers.status(p) === 'sin_iniciar').length;

  $('provSummaryAdmin').innerHTML = `
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

function renderProvListAdmin() {
  if (!selectedWeddingForProviders) return;
  const provs = Providers.forWedding(selectedWeddingForProviders);

  $('provCountAdmin').textContent = `${provs.length} proveedores`;

  const list = $('provListAdmin');
  if (!provs.length) {
    list.innerHTML = '<div class="empty"><h3>Sin proveedores</h3><p>Esta boda aún no tiene proveedores asignados</p></div>';
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
      <div class="prov-card" onclick="openProvDrawerAdmin('${p.id}')">
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

/* ==================== DRAWER: PROVEEDOR (ADMIN) ==================== */
function openProvDrawerAdmin(provId) {
  currentProvId = provId;
  currentProvTab = 'datos';
  const p = Providers.get(provId);
  if (!p) return;

  const cat = getCategories().find(c => c.id === p.categoryId);
  $('pvdTitleAdmin').textContent = p.name;
  $('pvdCatAdmin').textContent = cat ? cat.name : 'Sin categoría';
  const statusLabels = { sin_iniciar: 'Sin iniciar', en_curso: 'En curso', pagado: 'Pagado' };
  $('pvdStatusAdmin').textContent = statusLabels[Providers.status(p)];

  $$('#pvdTabsAdmin .drawer-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'datos');
  });

  renderProvTabAdmin();
  $('provDrawerBackdrop').classList.add('open');
  $('provDrawerAdmin').classList.add('open');
}

function closeProvDrawerAdmin() {
  $('provDrawerBackdrop').classList.remove('open');
  $('provDrawerAdmin').classList.remove('open');
  currentProvId = null;
}

function switchProvTabAdmin(tab) {
  currentProvTab = tab;
  $$('#pvdTabsAdmin .drawer-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderProvTabAdmin();
}

function renderProvTabAdmin() {
  const p = Providers.get(currentProvId);
  if (!p) return;
  const body = $('pvdBodyAdmin');

  if (currentProvTab === 'datos') {
    const paid = Providers.amountPaid(p);
    const pending = Providers.amountPending(p);
    const pct = Providers.progress(p);
    body.innerHTML = `
      <div class="drawer-section">
        <h3>Información general</h3>
        <div class="info-grid">
          <div class="info-block">
            <div class="label">Monto total</div>
            <div class="value big">${formatMoney(p.amountTotal)}</div>
          </div>
          <div class="info-block">
            <div class="label">Abonado</div>
            <div class="value big" style="color:var(--success)">${formatMoney(paid)}</div>
          </div>
          <div class="info-block">
            <div class="label">Pendiente</div>
            <div class="value big" style="color:var(--danger)">${formatMoney(pending)}</div>
          </div>
          <div class="info-block">
            <div class="label">Progreso</div>
            <div class="value big">${pct}%</div>
          </div>
        </div>
        ${p.details ? `<div class="info-block full" style="margin-top:16px"><div class="label">Alcance</div><div style="font-size:13px;margin-top:6px">${escapeHtml(p.details)}</div></div>` : ''}
      </div>
    `;
  } else if (currentProvTab === 'abonos') {
    const payments = (p.payments || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    body.innerHTML = `
      <div class="drawer-section">
        <h3>Historial de abonos (${payments.length})</h3>
        ${payments.length === 0
          ? '<div class="empty" style="padding:30px 10px"><p>Sin abonos registrados</p></div>'
          : payments.map(pay => `
              <div class="payment-item">
                <div class="payment-icon"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></div>
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
  } else if (currentProvTab === 'adjuntos') {
    const attachments = p.attachments || [];
    body.innerHTML = `
      <div class="drawer-section">
        <h3>Comprobantes adjuntos (${attachments.length})</h3>
        ${attachments.length === 0
          ? '<div class="empty" style="padding:30px 10px"><p>Sin comprobantes</p></div>'
          : attachments.map(a => `
              <div class="attach-item">
                <div class="attach-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div>
                <div class="attach-info">
                  <div class="n">${escapeHtml(a.name)}</div>
                  <div class="s">${(a.size / 1024).toFixed(0)} KB</div>
                </div>
              </div>
            `).join('')
        }
      </div>
    `;
  }
}

/* ==================== VISTA: EQUIPO ==================== */
function renderEquipo() {
  const team = read(K.users).filter(u => u.type === 'team');
  $('equipoCount').textContent = `${team.length} miembros`;

  const list = $('equipoList');
  if (!team.length) {
    list.innerHTML = '<div class="empty"><p>Sin miembros</p></div>';
    return;
  }

  const roleLabels = { admin: 'Admin', planner: 'Planner', coordinador: 'Coordinador' };

  list.innerHTML = team.map(u => {
    const assigned = Weddings.all().filter(w => w.plannerId === u.id).length;
    const roleClass = u.role || 'planner';
    return `
      <div class="team-member">
        <div class="team-avatar">${initials(u.name)}</div>
        <div class="team-info">
          <div class="n">${escapeHtml(u.name)}</div>
          <div class="e">${escapeHtml(u.email)}</div>
          <span class="team-role ${roleClass}">${roleLabels[u.role] || u.role}</span>
        </div>
        <div class="text-sm text-sec" style="margin-right:16px">${assigned} boda${assigned === 1 ? '' : 's'}</div>
        <div class="team-actions">
          ${u.id !== currentUser.id ? `<button class="btn-icon" onclick="toggleTeamMember('${u.id}')" title="${u.active !== false ? 'Desactivar' : 'Activar'}">${u.active !== false ? '⏸' : '▶'}</button>` : '<span class="text-xs text-ter">Yo</span>'}
        </div>
      </div>
    `;
  }).join('');
}

function toggleTeamMember(userId) {
  const u = Users.get(userId);
  if (!u) return;
  if (!confirm(`¿${u.active !== false ? 'Desactivar' : 'Activar'} a ${u.name}?`)) return;
  Users.update(userId, { active: u.active === false });
  renderEquipo();
  toast('Estado actualizado');
}

/* ==================== VISTA: ESTADÍSTICAS ==================== */
function renderEstadisticas() {
  const weds = Weddings.all();
  const couples = Users.couples();
  const provs = Providers.all();

  const totalVolume = provs.reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);
  const totalPaid = provs.reduce((s, p) => s + Providers.amountPaid(p), 0);
  const pending = totalVolume - totalPaid;

  $('statsGlobales').innerHTML = `
    <div class="metric-card">
      <div class="l">Parejas totales</div>
      <div class="v">${couples.length}</div>
    </div>
    <div class="metric-card">
      <div class="l">Bodas activas</div>
      <div class="v accent">${weds.filter(w => w.status !== 'casadas').length}</div>
    </div>
    <div class="metric-card">
      <div class="l">Volumen total</div>
      <div class="v">${formatMoney(totalVolume)}</div>
    </div>
    <div class="metric-card">
      <div class="l">Cobrado</div>
      <div class="v" style="color:var(--success)">${formatMoney(totalPaid)}</div>
    </div>
    <div class="metric-card">
      <div class="l">Por cobrar</div>
      <div class="v" style="color:var(--danger)">${formatMoney(pending)}</div>
    </div>
  `;

  // Bodas por mes
  const months = {};
  weds.forEach(w => {
    if (!w.date) return;
    const m = w.date.slice(0, 7);
    months[m] = (months[m] || 0) + 1;
  });

  const sortedMonths = Object.entries(months).sort().slice(-6);
  const maxCount = Math.max(...sortedMonths.map(([, c]) => c), 1);

  $('chartBodasMes').innerHTML = sortedMonths.length === 0
    ? '<div class="empty"><p>Sin datos</p></div>'
    : sortedMonths.map(([m, c]) => {
        const pct = (c / maxCount) * 100;
        const label = new Date(m + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        return `
          <div class="stat-bar">
            <div class="stat-bar-label">${label}</div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%"></div></div>
            <div class="stat-bar-value">${c}</div>
          </div>
        `;
      }).join('');

  // Distribución de estados
  const statusLabels = { nuevas: 'Nuevas', en_planificacion: 'En planificación', a_punto: 'A punto', casadas: 'Casadas' };
  const statusCounts = {};
  weds.forEach(w => {
    const s = w.status || 'nuevas';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  $('chartEstados').innerHTML = Object.entries(statusCounts).length === 0
    ? '<div class="empty"><p>Sin datos</p></div>'
    : Object.entries(statusCounts).map(([s, c]) => {
        const pct = weds.length > 0 ? (c / weds.length) * 100 : 0;
        return `
          <div class="stat-bar">
            <div class="stat-bar-label">${statusLabels[s] || s}</div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%"></div></div>
            <div class="stat-bar-value">${c}</div>
          </div>
        `;
      }).join('');
}

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

function exportParejasCSV() {
  const weds = Weddings.all();
  const rows = [
    ['Pareja', 'Correo', 'Fecha boda', 'Lugar', 'Estado', 'Prioridad', 'Planner', 'Tareas', 'Invitados', 'Presupuesto total']
  ];

  weds.forEach(w => {
    const user = Users.get(w.ownerId);
    const planner = Users.get(w.plannerId);
    const tasks = Tasks.forWedding(w.id);
    const guests = Guests.forWedding(w.id);
    const provs = Providers.forWedding(w.id);
    const totalBudget = provs.reduce((s, p) => s + (Number(p.amountTotal) || 0), 0);

    const statusLabels = { nuevas: 'Nuevas', en_planificacion: 'En planificación', a_punto: 'A punto', casadas: 'Casadas' };

    rows.push([
      `${w.partnerA} & ${w.partnerB}`,
      user ? user.email : '',
      w.date || '',
      w.location || '',
      statusLabels[w.status] || w.status,
      w.priority || 'media',
      planner ? planner.name : '',
      `${tasks.filter(t => t.done).length}/${tasks.length}`,
      `${guests.filter(g => g.rsvp === 'confirmado').length}/${guests.length}`,
      totalBudget
    ]);
  });

  downloadCSV(`parejas-caribeplanners-${new Date().toISOString().split('T')[0]}.csv`, rows);
}

function exportProveedoresCSVAdmin() {
  if (!selectedWeddingForProviders) return;
  const w = Weddings.get(selectedWeddingForProviders);
  const provs = Providers.forWedding(selectedWeddingForProviders);

  const rows = [
    ['Nombre', 'Categoría', 'Alcance', 'Monto total', 'Abonado', 'Pendiente', 'Estado']
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
      statusLabel
    ]);
  });

  const slug = `${w.partnerA}-${w.partnerB}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadCSV(`proveedores-${slug}-${new Date().toISOString().split('T')[0]}.csv`, rows);
}

/* ==================== INICIALIZACIÓN ==================== */
(function init() {
  getCategories();
  const u = Auth.current();
  if (u) {
    startApp(u);
  } else {
    $('loginView').classList.remove('hidden');
    $('appView').classList.add('hidden');
  }
})();