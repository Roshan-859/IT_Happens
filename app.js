(() => {
  'use strict';

  const STORAGE_KEY = 'campuscare-v1';
  const people = {
    admin: { name: 'Alex Morgan', role: 'Administrator', initials: 'AM', department: 'Campus Operations' },
    technician: { name: 'Jordan Lee', role: 'Technician', initials: 'JL', department: 'IT Services' },
    reporter: { name: 'Sam Rivera', role: 'Student Reporter', initials: 'SR', department: 'CSE (AI&ML)' },
  };
  const technicians = [
    { name: 'Jordan Lee', initials: 'JL', tint: 'lavender', department: 'IT Services' },
    { name: 'Priya Nair', initials: 'PN', tint: 'mint', department: 'Lab Support' },
    { name: 'Arun Kumar', initials: 'AK', tint: 'peach', department: 'Campus Facilities' },
    { name: 'Meera Shah', initials: 'MS', tint: 'sky', department: 'Network Operations' },
  ];
  const now = Date.now();
  const ago = (hours) => new Date(now - hours * 3600000).toISOString();

  function seedTickets() {
    const samples = [
      ['TKT-204', 'Lab PC not starting', 'Workstation does not power on after the lab opened this morning.', 'Hardware', 'Urgent', 'CSE AI Lab · PC-12', 'CSE (AI&ML)', 'Open', null, 2],
      ['TKT-203', 'Wi-Fi dropping in seminar hall', 'Connection drops every few minutes near the back row.', 'Network', 'High', 'Block B · Seminar Hall 2', 'Network Operations', 'In Progress', 'Meera Shah', 5],
      ['TKT-202', 'Projector shows no signal', 'HDMI input is detected but the display stays blank.', 'Hardware', 'High', 'Main Block · Room 304', 'Electronics', 'Assigned', 'Priya Nair', 8],
      ['TKT-201', 'Air conditioning too warm', 'AC is running but the room is not cooling.', 'Facility', 'Medium', 'Library · Reading Room', 'Campus Facilities', 'In Progress', 'Arun Kumar', 16],
      ['TKT-200', 'IDE licence expired', 'The lab IDE asks for activation on several machines.', 'Software', 'Medium', 'CSE AI Lab · PC-08', 'CSE (AI&ML)', 'Assigned', 'Jordan Lee', 26],
      ['TKT-199', 'Lab printer paper jam', 'Paper is stuck behind the lower tray.', 'Hardware', 'Low', 'Block C · Lab 1', 'Computer Science', 'Resolved', 'Priya Nair', 52],
      ['TKT-198', 'PC not powering on', 'Computer does not start when the power button is pressed.', 'Hardware', 'High', 'CSE AI Lab · PC-12', 'CSE (AI&ML)', 'Open', null, 7],
    ];
    return samples.map(([id, title, description, category, priority, location, department, status, assignee, hours], i) => {
      const createdAt = ago(hours + (status === 'Resolved' ? 19 : 0));
      const updatedAt = ago(hours);
      const history = [{ actor: people.reporter.name, action: 'created this ticket', note: '', at: createdAt }];
      if (assignee) history.push({ actor: 'Alex Morgan', action: `assigned ticket to ${assignee}`, note: '', at: ago(hours + 1) });
      if (status === 'In Progress' || status === 'Resolved') history.push({ actor: assignee || people.admin.name, action: 'started work', note: 'Investigation underway.', at: ago(hours) });
      if (status === 'Resolved') history.push({ actor: assignee || people.admin.name, action: 'resolved this ticket', note: 'Issue repaired and verified with the reporter.', at: updatedAt });
      return { id, title, description, category, priority, location, department, status, assignee, reporter: i === 0 ? people.reporter.name : ['Taylor Reed', 'Nisha Patel', 'Dev Anand', 'Maya Chen', 'Sam Rivera', 'Taylor Reed', 'Sam Rivera'][i], createdAt, updatedAt, photo: null, resolution: status === 'Resolved' ? 'Issue repaired and verified with the reporter.' : '', history };
    });
  }
  function loadTickets() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (_) { /* Start with sample data if local storage is unavailable. */ }
    const initial = seedTickets(); saveTickets(initial); return initial;
  }
  function saveTickets(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (_) { /* The current session still works without persistence. */ }
  }

  let tickets = loadTickets();
  let activeRole = 'admin';
  let currentView = 'dashboard';
  let showAll = false;
  let selectedTicketId = null;
  let duplicateConfirmed = false;
  let toastTimer;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (text) => String(text ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const statusClass = (status) => ({ 'Open': 'status-open', 'Assigned': 'status-assigned', 'In Progress': 'status-progress', 'Resolved': 'status-resolved' })[status] || 'status-open';
  const categoryGlyph = (category) => ({ Hardware: '⌘', Software: '▣', Network: '⌁', Facility: '⌂' })[category] || '▤';
  const fmtDate = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));
  const fmtTime = (date) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
  const agoLabel = (date) => {
    const hours = Math.max(0, Math.floor((now - new Date(date).getTime()) / 3600000));
    if (hours < 1) return 'Just now'; if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24); return `${days}d ago`;
  };
  const visibleTickets = () => activeRole === 'reporter' ? tickets.filter((ticket) => ticket.reporter === people.reporter.name) : activeRole === 'technician' ? tickets.filter((ticket) => ticket.assignee === people.technician.name) : tickets;
  const countOpen = (items) => items.filter((ticket) => ticket.status !== 'Resolved').length;
  const makeId = () => {
    const highest = tickets.reduce((max, ticket) => Math.max(max, Number((ticket.id.match(/\d+/) || [0])[0])), 200);
    return `TKT-${highest + 1}`;
  };
  const currentPerson = () => people[activeRole];
  const getTicket = (id) => tickets.find((ticket) => ticket.id === id);

  function setRole(role) {
    activeRole = role;
    const person = currentPerson();
    $('#profileName').textContent = person.name;
    $('#profileRole').textContent = person.role;
    $('#profileAvatar').textContent = person.initials;
    $('#profileAvatar').className = `avatar ${role === 'admin' ? 'avatar-admin' : role === 'technician' ? 'avatar-tech' : 'avatar-report'}`;
    const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
    $('#welcomeTitle').innerHTML = `${greeting}, ${esc(person.name.split(' ')[0])} <span class="wave">✳</span>`;
    $('#welcomeSub').textContent = role === 'admin' ? 'Here’s what’s happening across campus today.' : role === 'technician' ? 'Here are the campus issues assigned to you.' : 'Here are your reported campus issues.';
    $('#metricGrid').classList.toggle('hidden', role !== 'admin');
    $('#workloadList').closest('.workload-panel').classList.toggle('hidden', role !== 'admin');
    $('#viewAllButton').classList.toggle('hidden', role !== 'admin');
    if (role === 'reporter') currentView = 'my-tickets';
    else if (role === 'technician') currentView = 'tickets';
    else currentView = 'dashboard';
    render();
  }

  function renderMetrics() {
    const open = tickets.filter((t) => t.status !== 'Resolved').length;
    const progress = tickets.filter((t) => t.status === 'In Progress').length;
    const resolved = tickets.filter((t) => t.status === 'Resolved');
    const mins = resolved.map((t) => Math.max(0, (new Date(t.updatedAt) - new Date(t.createdAt)) / 60000));
    const avgMins = mins.length ? mins.reduce((sum, val) => sum + val, 0) / mins.length : 0;
    $('#metricOpen').textContent = open;
    $('#metricProgress').textContent = progress;
    $('#metricResolved').textContent = resolved.length;
    $('#metricAvg').textContent = avgMins < 60 ? `${Math.round(avgMins)}m` : `${(avgMins / 60).toFixed(1)}h`;
    $('#navOpenCount').textContent = open;
  }

  function getFilteredTickets() {
    let items = visibleTickets();
    const query = $('#searchInput').value.trim().toLowerCase();
    const status = $('#statusFilter').value;
    const priority = $('#priorityFilter').value;
    const department = $('#departmentFilter').value;
    if (query) items = items.filter((t) => [t.id, t.title, t.location, t.category, t.description, t.reporter].some((v) => String(v).toLowerCase().includes(query)));
    if (status !== 'all') items = items.filter((t) => t.status === status);
    if (priority !== 'all') items = items.filter((t) => t.priority === priority);
    if (department !== 'all') items = items.filter((t) => t.department === department);
    return [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function renderTickets() {
    const rows = getFilteredTickets();
    const shown = showAll || currentView !== 'dashboard' ? rows : rows.slice(0, 5);
    $('#ticketRows').innerHTML = shown.map((ticket) => {
      const assignee = ticket.assignee ? technicians.find((person) => person.name === ticket.assignee) || { initials: ticket.assignee.split(' ').map((s) => s[0]).join(''), tint: 'lavender' } : null;
      const priority = ticket.priority.toLowerCase();
      return `<tr data-ticket="${esc(ticket.id)}"><td><span class="ticket-code">${esc(ticket.id)}</span></td><td><div class="issue-cell"><span class="category-icon">${categoryGlyph(ticket.category)}</span><span class="issue-copy"><strong>${esc(ticket.title)}</strong><span>${esc(ticket.category)} · ${esc(ticket.location)}</span></span></div></td><td><span class="priority ${priority}"><i></i>${esc(ticket.priority)}</span></td><td><span class="status-pill ${statusClass(ticket.status)}">${esc(ticket.status)}</span></td><td>${assignee ? `<span class="assignee"><span class="mini-avatar">${esc(assignee.initials)}</span>${esc(assignee.name.split(' ')[0])}</span>` : '<span class="assignee unassigned">Unassigned</span>'}</td><td>${agoLabel(ticket.updatedAt)}</td><td><span class="row-more">···</span></td></tr>`;
    }).join('');
    $('#emptyTickets').classList.toggle('hidden', rows.length !== 0);
    $('#ticketRows').closest('.table-scroll').classList.toggle('hidden', rows.length === 0);
    $('#ticketCountLabel').textContent = rows.length ? `Showing ${shown.length} of ${rows.length} tickets` : '0 tickets';
    $('#showMoreButton').classList.toggle('hidden', rows.length <= 5 || currentView !== 'dashboard');
    $('#showMoreButton').innerHTML = showAll ? 'Show recent tickets <span>↑</span>' : 'Show all tickets <span>→</span>';
    $('#viewAllButton').classList.toggle('hidden', currentView !== 'dashboard' || activeRole !== 'admin');
    $$('#ticketRows tr').forEach((row) => row.addEventListener('click', () => openDetail(row.dataset.ticket)));
  }

  function renderWorkload() {
    const activeTickets = tickets.filter((ticket) => ticket.status !== 'Resolved' && ticket.assignee);
    const counts = technicians.map((person) => ({ ...person, count: activeTickets.filter((ticket) => ticket.assignee === person.name).length }));
    const tones = { lavender: ['#f1eafd', '#8f6ec3'], mint: ['#e5f4ec', '#408766'], peach: ['#fbede3', '#b7764b'], sky: ['#e8f2fc', '#5681b7'] };
    $('#workloadList').innerHTML = counts.map((person) => `<div class="workload-row"><span class="person-avatar" style="background:${tones[person.tint][0]};color:${tones[person.tint][1]}">${esc(person.initials)}</span><span class="person-name"><strong>${esc(person.name)}</strong><span>${esc(person.department)}</span></span><span class="work-count">${person.count} ${person.count === 1 ? 'ticket' : 'tickets'}</span></div>`).join('');
    const capacity = Math.min(100, Math.round(activeTickets.length / (technicians.length * 4) * 100));
    $('#capacityLabel').textContent = `${activeTickets.length} / ${technicians.length * 4} active`;
    $('#capacityBar').style.width = `${capacity}%`;
  }

  function renderActivity() {
    const events = tickets.flatMap((ticket) => ticket.history.map((event) => ({ ...event, ticket }))).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5);
    const marks = { 'created this ticket': '＋', 'assigned ticket': '↗', 'started work': '◷', 'resolved this ticket': '✓', 'added a progress note': '✎', 'returned this ticket to Open': '↶' };
    $('#activityList').innerHTML = events.map((event) => `<div class="activity-item"><span class="activity-mark">${marks[event.action] || '•'}</span><span class="activity-copy"><strong>${esc(event.actor.split(' ')[0])}</strong> ${esc(event.action)}<br><strong>${esc(event.ticket.id)}</strong> · ${esc(event.ticket.title)}<span>${agoLabel(event.at)}</span></span></div>`).join('');
  }

  function render() {
    const titles = { dashboard: 'Overview', tickets: 'All tickets', 'my-tickets': 'My tickets' };
    $('#crumbTitle').textContent = titles[currentView];
    $('#ticketHeading').textContent = currentView === 'dashboard' ? 'Recent tickets' : currentView === 'my-tickets' ? 'My tickets' : activeRole === 'technician' ? 'My assigned tickets' : 'All tickets';
    $('#ticketSubheading').textContent = currentView === 'dashboard' ? 'Keep an eye on the latest campus issues.' : currentView === 'my-tickets' ? 'Track the progress of issues you reported.' : activeRole === 'technician' ? 'Your assigned campus issues and next steps.' : 'Review, filter and open any campus issue.';
    $$('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === currentView));
    renderMetrics(); renderTickets(); renderWorkload(); renderActivity();
  }

  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function openModal(id) { $(`#${id}`).classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  function closeModal(id) { $(`#${id}`).classList.add('hidden'); if ($$('.modal-backdrop:not(.hidden)').length === 0) document.body.style.overflow = ''; }
  function openTicketForm() {
    if (activeRole !== 'reporter') { setRole('reporter'); }
    $('#ticketForm').reset(); $('#formError').textContent = ''; $('#fileName').textContent = ''; $('#duplicateWarning').classList.add('hidden'); duplicateConfirmed = false; openModal('ticketModal');
  }

  function similarOpenTickets(title, category, location) {
    const normalize = (value) => value.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
    const loc = normalize(location); const words = normalize(title).split(' ').filter((word) => word.length > 2);
    return tickets.filter((ticket) => {
      if (ticket.status === 'Resolved' || normalize(ticket.location) !== loc) return false;
      const oldWords = normalize(ticket.title).split(' ').filter((word) => word.length > 2);
      const overlap = words.filter((word) => oldWords.includes(word)).length;
      return overlap > 0 || ticket.category.toLowerCase() === category.toLowerCase();
    });
  }

  function addHistory(ticket, actor, action, note = '') {
    ticket.history.push({ actor, action, note, at: new Date().toISOString() });
    ticket.updatedAt = new Date().toISOString();
  }

  function renderDetail(ticket) {
    $('#detailId').textContent = ticket.id;
    const role = activeRole;
    const canManage = role === 'admin';
    const isAssignedTech = role === 'technician' && ticket.assignee === people.technician.name;
    let controls = '';
    if (canManage && ticket.status === 'Open') {
      controls = `<div class="admin-controls"><select id="assignSelect" aria-label="Choose a technician"><option value="">Assign technician…</option>${technicians.map((person) => `<option value="${esc(person.name)}">${esc(person.name)} · ${esc(person.department)}</option>`).join('')}</select><button class="small-action emphasis" id="assignButton">Assign</button></div>`;
    } else if (canManage && ['Assigned', 'In Progress'].includes(ticket.status)) {
      controls = `<div class="admin-controls"><select id="returnReason"><option value="">Return to Open to reassign…</option><option>Technician unavailable</option><option>Wrong team assigned</option><option>Work needs reassignment</option></select><button class="small-action" id="returnButton">Return</button></div>`;
    } else if (isAssignedTech && ticket.status === 'Assigned') {
      controls = '<button class="small-action emphasis" id="startButton">Start work →</button>';
    } else if (isAssignedTech && ticket.status === 'In Progress') {
      controls = `<div class="admin-controls"><input class="note-input" id="resolutionNote" maxlength="500" placeholder="Add resolution details…" /><button class="small-action emphasis" id="resolveButton">Resolve</button></div><button class="small-action" id="progressNoteButton">Add progress note</button>`;
    }
    $('#detailContent').innerHTML = `<div class="detail-title-row"><div><h2 id="detailTitle">${esc(ticket.title)}</h2><span class="detail-sub">Reported by ${esc(ticket.reporter)} · ${fmtDate(ticket.createdAt)}</span></div><span class="status-pill ${statusClass(ticket.status)}">${esc(ticket.status)}</span></div><div class="detail-fields"><div><span>Priority</span><strong class="priority ${ticket.priority.toLowerCase()}"><i></i>${esc(ticket.priority)}</strong></div><div><span>Category</span><strong>${esc(ticket.category)}</strong></div><div><span>Department</span><strong>${esc(ticket.department)}</strong></div><div><span>Assigned to</span><strong>${esc(ticket.assignee || 'Not assigned')}</strong></div><div><span>Created</span><strong>${fmtDate(ticket.createdAt)} · ${fmtTime(ticket.createdAt)}</strong></div><div><span>Last updated</span><strong>${agoLabel(ticket.updatedAt)}</strong></div></div><div class="detail-location">⌖ &nbsp;${esc(ticket.location)}</div><p class="detail-description">${esc(ticket.description)}</p>${ticket.photo ? `<p class="detail-location">▧ &nbsp;Photo attached: ${esc(ticket.photo)}</p>` : ''}${ticket.resolution ? `<div class="duplicate-warning" style="background:#eef8f3;border-color:#d8eee2;color:#3d8464"><span style="background:#dcefe5">✓</span><div><strong>Resolution</strong><p>${esc(ticket.resolution)}</p></div></div>` : ''}<div class="detail-actions">${controls}</div><div class="history-title">Ticket history</div><div class="history-list">${[...ticket.history].reverse().map((event) => `<div class="history-event"><span class="history-dot"></span><div class="history-copy"><strong>${esc(event.actor)}</strong> ${esc(event.action)}${event.note ? ` · ${esc(event.note)}` : ''}<span>${fmtDate(event.at)} at ${fmtTime(event.at)}</span></div></div>`).join('')}</div>`;
    $('#assignButton')?.addEventListener('click', () => {
      const selected = $('#assignSelect').value;
      if (activeRole !== 'admin' || ticket.status !== 'Open') return toast('Only an admin can assign an open ticket.');
      if (!technicians.some((person) => person.name === selected)) return toast('Choose an active technician first.');
      ticket.assignee = selected; ticket.status = 'Assigned'; addHistory(ticket, currentPerson().name, `assigned ticket to ${selected}`); saveTickets(tickets); render(); openDetail(ticket.id); toast(`${ticket.id} assigned to ${selected}.`);
    });
    $('#startButton')?.addEventListener('click', () => {
      if (activeRole !== 'technician' || ticket.assignee !== currentPerson().name || ticket.status !== 'Assigned') return toast('Only the assigned technician can start this ticket.');
      ticket.status = 'In Progress'; addHistory(ticket, currentPerson().name, 'started work'); saveTickets(tickets); render(); openDetail(ticket.id); toast('Ticket moved to In Progress.');
    });
    $('#resolveButton')?.addEventListener('click', () => {
      const note = $('#resolutionNote').value.trim();
      if (activeRole !== 'technician' || ticket.assignee !== currentPerson().name || ticket.status !== 'In Progress') return toast('Only the assigned technician can resolve this ticket.');
      if (note.length < 8) return toast('Add a resolution note with a little more detail.');
      ticket.resolution = note; ticket.status = 'Resolved'; addHistory(ticket, currentPerson().name, 'resolved this ticket', note); saveTickets(tickets); render(); openDetail(ticket.id); toast(`${ticket.id} marked as resolved.`);
    });
    $('#progressNoteButton')?.addEventListener('click', () => {
      const note = $('#resolutionNote').value.trim();
      if (!note) return toast('Write a short progress note first.');
      if (activeRole !== 'technician' || ticket.assignee !== currentPerson().name || ticket.status !== 'In Progress') return toast('Only the assigned technician can update this ticket.');
      addHistory(ticket, currentPerson().name, 'added a progress note', note); saveTickets(tickets); render(); openDetail(ticket.id); toast('Progress note added to ticket history.');
    });
    $('#returnButton')?.addEventListener('click', () => {
      const reason = $('#returnReason').value;
      if (activeRole !== 'admin' || !['Assigned', 'In Progress'].includes(ticket.status)) return toast('Only an admin can return an active ticket.');
      if (!reason) return toast('Choose a reason to keep the ticket history clear.');
      ticket.status = 'Open'; ticket.assignee = null; addHistory(ticket, currentPerson().name, 'returned this ticket to Open', reason); saveTickets(tickets); render(); openDetail(ticket.id); toast(`${ticket.id} is open and ready to reassign.`);
    });
  }
  function openDetail(id) {
    const ticket = getTicket(id); if (!ticket) return;
    selectedTicketId = id; renderDetail(ticket); openModal('detailModal');
  }

  function submitTicket(event) {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    const title = String(data.get('title') || '').trim(); const description = String(data.get('description') || '').trim(); const category = String(data.get('category') || ''); const priority = String(data.get('priority') || ''); const location = String(data.get('location') || '').trim(); const department = String(data.get('department') || ''); const photo = form.elements.photo.files[0];
    const error = $('#formError'); error.textContent = '';
    if (!title || !description || !category || !priority || !location) { error.textContent = 'Please complete the title, description, category, priority and location.'; return; }
    if (!['Hardware', 'Software', 'Network', 'Facility'].includes(category) || !['Low', 'Medium', 'High', 'Urgent'].includes(priority)) { error.textContent = 'Choose a valid category and priority.'; return; }
    if (photo && (!['image/png', 'image/jpeg', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024)) { error.textContent = 'Photo must be a PNG, JPG or WEBP image under 5 MB.'; return; }
    const matches = similarOpenTickets(title, category, location);
    if (matches.length && !duplicateConfirmed) {
      $('#duplicateText').textContent = `Open tickets ${matches.map((t) => t.id).join(', ')} share this location. You can review them, or submit this as a separate issue.`;
      $('#duplicateView').onclick = () => { closeModal('ticketModal'); openDetail(matches[0].id); };
      $('#duplicateWarning').classList.remove('hidden'); duplicateConfirmed = true; return;
    }
    const ticket = { id: makeId(), title, description, category, priority, location, department, status: 'Open', assignee: null, reporter: currentPerson().name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), photo: photo ? photo.name : null, resolution: '', history: [] };
    addHistory(ticket, currentPerson().name, 'created this ticket'); tickets.unshift(ticket); saveTickets(tickets); duplicateConfirmed = false; closeModal('ticketModal'); render(); toast(`${ticket.id} created and added to Open tickets.`);
  }

  function init() {
    const date = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
    $('#dateLabel').textContent = date.toUpperCase();
    $('#roleSelect').addEventListener('change', (event) => setRole(event.target.value));
    $('#newTicketButton').addEventListener('click', openTicketForm); $('#helpReport').addEventListener('click', openTicketForm);
    $('#ticketForm').addEventListener('submit', submitTicket);
    $('#ticketForm').elements.photo.addEventListener('change', (event) => { const file = event.target.files[0]; $('#fileName').textContent = file ? `Selected: ${file.name}` : ''; });
    $('#searchInput').addEventListener('input', renderTickets); $('#statusFilter').addEventListener('change', renderTickets); $('#priorityFilter').addEventListener('change', renderTickets); $('#departmentFilter').addEventListener('change', renderTickets);
    $('#showMoreButton').addEventListener('click', () => { showAll = !showAll; renderTickets(); });
    $('#viewAllButton').addEventListener('click', () => { currentView = 'tickets'; showAll = true; render(); });
    $$('.nav-link').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); currentView = link.dataset.view; showAll = currentView !== 'dashboard'; render(); }));
    $$('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
    $$('.modal-backdrop').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal.id); }));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') $$('.modal-backdrop:not(.hidden)').forEach((modal) => closeModal(modal.id)); });
    render();
  }

  init();
})();
