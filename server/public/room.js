const API_BASE = '';

const params = new URLSearchParams(window.location.search);
const roomName = params.get('room');
const nameFromUrl = params.get('name');
const roleFromUrl = params.get('role') || 'audience';
const peranFromUrl = params.get('peran');
const hostpwFromUrl = params.get('hostpw');

// ---- Icon SVG (dipakai buat toggle mic/kamera) ----
const ICON_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
const ICON_MIC_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
const ICON_CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
const ICON_CAM_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

// ---- Elemen DOM ----
const joinScreen = document.getElementById('joinScreen');
const roomLabel = document.getElementById('roomLabel');
const joinName = document.getElementById('joinName');
const joinRole = document.getElementById('joinRole');
const joinBtn = document.getElementById('joinBtn');

const callScreen = document.getElementById('callScreen');
const participantBadge = document.getElementById('participantBadge');
const participantCountBadge = document.getElementById('participantCountBadge');
const timerEl = document.getElementById('timerEl');
const grid = document.getElementById('grid');
const spotlight = document.getElementById('spotlight');

const micBtn = document.getElementById('micBtn');
const camBtn = document.getElementById('camBtn');
const screenBtn = document.getElementById('screenBtn');
const bibleToolBtn = document.getElementById('bibleToolBtn');
const chatToolBtn = document.getElementById('chatToolBtn');
const pesertaToolBtn = document.getElementById('pesertaToolBtn');
const moreToolBtn = document.getElementById('moreToolBtn');
const leaveBtn = document.getElementById('leaveBtn');
const participantsTopBtn = document.getElementById('participantsTopBtn');
const chatTopBtn = document.getElementById('chatTopBtn');

const moreMenu = document.getElementById('moreMenu');
const moreMenuHostOnly = document.getElementById('moreMenuHostOnly');
const moreMenuNotHost = document.getElementById('moreMenuNotHost');
const autoMuteToggle = document.getElementById('autoMuteToggle');
const autoCamOffToggle = document.getElementById('autoCamOffToggle');
const muteAllBtn = document.getElementById('muteAllBtn');

const sidePanel = document.getElementById('sidePanel');
const panelCloseBtn = document.getElementById('panelCloseBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const chatTab = document.getElementById('chatTab');
const alkitabTab = document.getElementById('alkitabTab');
const pesertaTab = document.getElementById('pesertaTab');

const shareTopBtn = document.getElementById('shareTopBtn');
const sharePopup = document.getElementById('sharePopup');
const shareCodeText = document.getElementById('shareCodeText');
const shareLinkInputRoom = document.getElementById('shareLinkInputRoom');
const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const pinnedArea = document.getElementById('pinnedArea');

const participantsList = document.getElementById('participantsList');

const translationSelect = document.getElementById('translationSelect');
const bookSelect = document.getElementById('bookSelect');
const chapterSelect = document.getElementById('chapterSelect');
const ayatListContainer = document.getElementById('ayatListContainer');
const showToAllBtn = document.getElementById('showToAllBtn');
const hideVerseBtn = document.getElementById('hideVerseBtn');

const verseOverlay = document.getElementById('verseOverlay');
const verseOverlayText = document.getElementById('verseOverlayText');
const verseOverlayRef = document.getElementById('verseOverlayRef');

let room;
let myPeran = '';
let myRole = 'audience';
let isHost = false;
let isCoHost = false;
let intentionalLeave = false;
let openParticipantMenuFor = null;
const MAKS_COHOST = 3;
let pinnedMessages = [];
let roomSettings = { autoMuteNewJoin: false, autoCameraOffNewJoin: false };

if (!roomName) {
  document.body.innerHTML = '<div class="landing"><h1>Link tidak valid</h1><p class="subtitle">Parameter room tidak ditemukan di URL.</p></div>';
  throw new Error('Missing room param');
}

roomLabel.textContent = `Siaran: ${roomName}`;

if (roleFromUrl === 'host' && nameFromUrl) {
  joinAndConnect(nameFromUrl, peranFromUrl || 'Host', 'host', hostpwFromUrl);
} else {
  joinBtn.addEventListener('click', () => {
    const name = joinName.value.trim();
    if (!name) return alert('Isi nama dulu ya');
    joinAndConnect(name, joinRole.value.trim(), roleFromUrl, hostpwFromUrl);
  });
}

// ==================== KONEKSI LIVEKIT ====================

async function joinAndConnect(name, peran, role, hostPasswordInput) {
  joinScreen.classList.add('hidden');
  callScreen.classList.remove('hidden');
  myPeran = peran || '';
  myRole = role;
  isHost = role === 'host';

  try {
    const res = await fetch(`${API_BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, name, role, hostPassword: hostPasswordInput }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal ambil token');

    room = new LivekitClient.Room({ adaptiveStream: true, dynacast: true });

    room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
      attachTrack(track, participant);
    });
    room.on(LivekitClient.RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((el) => el.remove());
      if (track.source === LivekitClient.Track.Source.ScreenShare) {
        spotlight.innerHTML = '';
        spotlight.classList.add('hidden');
        grid.classList.remove('compact');
      }
    });
    room.on(LivekitClient.RoomEvent.ParticipantConnected, () => updateParticipantUI());
    room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
      const tile = document.getElementById(`tile-${participant.identity}`);
      if (tile) tile.remove();
      updateParticipantUI();
    });
    room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, (speakers) => {
      document.querySelectorAll('.tile').forEach((t) => t.classList.remove('speaking'));
      speakers.forEach((p) => {
        const tile = document.getElementById(`tile-${p.identity}`);
        if (tile) tile.classList.add('speaking');
      });
    });
    room.on(LivekitClient.RoomEvent.TrackMuted, (pub, participant) => updateMicIndicator(participant));
    room.on(LivekitClient.RoomEvent.TrackUnmuted, (pub, participant) => updateMicIndicator(participant));
    room.on(LivekitClient.RoomEvent.ParticipantMetadataChanged, () => renderParticipantsList());
    room.on(LivekitClient.RoomEvent.Disconnected, () => {
      if (intentionalLeave) return; // kita sendiri yang klik Keluar, sudah dihandle di tombolnya
      alert('Siaran telah diakhiri oleh host, atau koneksi kamu terputus.');
      window.location.href = 'index.html';
    });

    const decoder = new TextDecoder();
    room.on(LivekitClient.RoomEvent.DataReceived, (payload) => {
      try {
        handleDataMessage(JSON.parse(decoder.decode(payload)));
      } catch (e) {
        console.warn('Data message tidak valid', e);
      }
    });

    await room.connect(data.url, data.token);
    room.localParticipant.setMetadata(JSON.stringify({ peran: myPeran }));

    // Baca pengaturan room (auto-mute / auto-camera-off) yang mungkin sudah diset host
    try { roomSettings = JSON.parse(room.metadata || '{}'); } catch (e) { roomSettings = {}; }

    const skipMic = !isHost && roomSettings.autoMuteNewJoin;
    const skipCam = !isHost && roomSettings.autoCameraOffNewJoin;

    if (!skipCam) await room.localParticipant.setCameraEnabled(true);
    if (!skipMic) await room.localParticipant.setMicrophoneEnabled(true);

    room.localParticipant.videoTrackPublications.forEach((pub) => {
      if (pub.track) attachTrack(pub.track, room.localParticipant);
    });
    if (!document.getElementById(`tile-${room.localParticipant.identity}`)) {
      buildTile(room.localParticipant);
    }
    updateMicIndicator(room.localParticipant);
    if (skipMic) {
      micBtn.classList.add('off');
      micBtn.querySelector('.tool-icon').innerHTML = ICON_MIC_OFF;
    }
    if (skipCam) {
      camBtn.classList.add('off');
      camBtn.querySelector('.tool-icon').innerHTML = ICON_CAM_OFF;
    }

    setupControls();
    setupTabs();
    setupMoreMenu();
    setupSharePopup();
    initBiblePanel();
    startTimer();
    updateParticipantUI();
    updateToolbarVisibility();
  } catch (err) {
    console.error(err);
    alert('Gagal join siaran: ' + err.message);
  }
}

function setupControls() {
  micBtn.addEventListener('click', async () => {
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    micBtn.classList.toggle('off', enabled);
    micBtn.querySelector('.tool-icon').innerHTML = enabled ? ICON_MIC_OFF : ICON_MIC;
    updateMicIndicator(room.localParticipant);
  });

  camBtn.addEventListener('click', async () => {
    const wasEnabled = room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(!wasEnabled);
    camBtn.classList.toggle('off', wasEnabled);
    camBtn.querySelector('.tool-icon').innerHTML = wasEnabled ? ICON_CAM_OFF : ICON_CAM;

    const tile = document.getElementById(`tile-${room.localParticipant.identity}`) || buildTile(room.localParticipant);
    if (wasEnabled) {
      // kamera baru dimatikan -> hapus video lokal dari layar sendiri
      tile.querySelector('video')?.remove();
    } else {
      // kamera baru dinyalain lagi -> tempelin ulang video track yang baru ke layar sendiri
      // (kalau gak gini, video CUMA muncul di layar orang lain, layar sendiri tetap kosong)
      room.localParticipant.videoTrackPublications.forEach((pub) => {
        if (pub.track && pub.source === LivekitClient.Track.Source.Camera && !tile.querySelector('video')) {
          const el = pub.track.attach();
          tile.insertBefore(el, tile.firstChild);
        }
      });
    }
  });

  screenBtn.addEventListener('click', async () => {
    const enabled = room.localParticipant.isScreenShareEnabled;
    try {
      await room.localParticipant.setScreenShareEnabled(!enabled, { audio: true });
      screenBtn.classList.toggle('active', !enabled);
    } catch (err) {
      console.warn('Screen share dibatalkan:', err.message);
    }
  });

  room.localParticipant.on(LivekitClient.ParticipantEvent.LocalTrackUnpublished, (pub) => {
    if (pub.source === LivekitClient.Track.Source.ScreenShare) {
      screenBtn.classList.remove('active');
    }
  });

  bibleToolBtn.addEventListener('click', () => openPanel('alkitab'));
  chatToolBtn.addEventListener('click', () => openPanel('chat'));
  pesertaToolBtn.addEventListener('click', () => openPanel('peserta'));
  chatTopBtn.addEventListener('click', () => openPanel('chat'));
  participantsTopBtn.addEventListener('click', () => openPanel('peserta'));
  panelCloseBtn.addEventListener('click', () => sidePanel.classList.add('hidden'));

  leaveBtn.addEventListener('click', async () => {
    if (isHost) {
      const yakin = confirm(
        'Kamu adalah HOST. Keluar sekarang akan MENGAKHIRI siaran ini untuk SEMUA peserta yang masih bergabung.\n\nKlik OK untuk mengakhiri siaran, atau Cancel untuk batal.'
      );
      if (!yakin) return;

      intentionalLeave = true;
      try {
        await fetch(`${API_BASE}/api/room/${roomName}/end`, { method: 'POST' });
      } catch (err) {
        console.warn('Gagal mengakhiri room di server:', err);
      }
      room.disconnect();
      window.location.href = 'index.html';
    } else {
      intentionalLeave = true;
      room.disconnect();
      window.location.href = 'index.html';
    }
  });
  window.addEventListener('beforeunload', () => room && room.disconnect());
}

function attachTrack(track, participant) {
  if (track.source === LivekitClient.Track.Source.ScreenShare) {
    spotlight.innerHTML = '';
    const el = track.attach();
    spotlight.appendChild(el);
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = `${participant.name || participant.identity} membagikan layar`;
    spotlight.appendChild(label);
    spotlight.classList.remove('hidden');
    grid.classList.add('compact');
    return;
  }

  let tile = document.getElementById(`tile-${participant.identity}`);
  if (!tile) tile = buildTile(participant);
  const el = track.attach();
  tile.insertBefore(el, tile.firstChild);
}

function buildTile(participant) {
  const existing = document.getElementById(`tile-${participant.identity}`);
  if (existing) return existing;

  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.id = `tile-${participant.identity}`;

  let peran = '';
  try { peran = JSON.parse(participant.metadata || '{}').peran || ''; } catch (e) {}

  const nameTag = document.createElement('div');
  nameTag.className = 'name-tag';
  nameTag.innerHTML = `${participant.name || participant.identity}${peran ? `<span class="role">${peran}</span>` : ''}`;
  tile.appendChild(nameTag);

  const micIndicator = document.createElement('div');
  micIndicator.className = 'mic-indicator';
  micIndicator.id = `mic-${participant.identity}`;
  micIndicator.innerHTML = ICON_MIC;
  tile.appendChild(micIndicator);

  grid.appendChild(tile);
  return tile;
}

function updateMicIndicator(participant) {
  const el = document.getElementById(`mic-${participant.identity}`);
  if (!el) return;
  const muted = !participant.isMicrophoneEnabled;
  el.classList.toggle('muted', muted);
  el.innerHTML = muted ? ICON_MIC_OFF : ICON_MIC;
}

// ==================== TOP BAR: JUMLAH PESERTA & TIMER ====================

function updateParticipantUI() {
  const total = room.remoteParticipants.size + 1;
  participantBadge.textContent = `👥 ${total} peserta`;
  participantCountBadge.textContent = total;
  participantCountBadge.classList.toggle('hidden', total <= 1);
  renderParticipantsList();
}

function renderParticipantsList() {
  const all = [room.localParticipant, ...room.remoteParticipants.values()];
  participantsList.innerHTML = all.map((p) => {
    let peran = '';
    let coHost = false;
    try {
      const meta = JSON.parse(p.metadata || '{}');
      peran = meta.peran || '';
      coHost = !!meta.coHost;
    } catch (e) {}
    const initial = (p.name || p.identity).slice(0, 1).toUpperCase();
    const isMe = p === room.localParticipant;
    const showMenuBtn = isHost && !isMe; // cuma host yang bisa atur co-host, gak buat diri sendiri
    const menuOpen = openParticipantMenuFor === p.identity;

    let dropdownHtml = '';
    if (menuOpen) {
      const cohostCount = countCoHosts();
      const limitReached = cohostCount >= MAKS_COHOST;
      if (coHost) {
        dropdownHtml = `
          <div class="participant-dropdown">
            <button class="danger-text" onclick="window.__revokeCoHost('${p.identity}')">Cabut Co-Host</button>
          </div>`;
      } else if (limitReached) {
        dropdownHtml = `
          <div class="participant-dropdown">
            <button disabled style="opacity:0.5;cursor:not-allowed">Maks ${MAKS_COHOST} Co-Host tercapai</button>
          </div>`;
      } else {
        dropdownHtml = `
          <div class="participant-dropdown">
            <button onclick="window.__assignCoHost('${p.identity}')">Jadikan Co-Host</button>
          </div>`;
      }
    }

    return `
      <div class="participant-row">
        <div class="participant-avatar">${initial}</div>
        <div class="participant-name">${p.name || p.identity}${isMe ? ' (kamu)' : ''}${coHost ? '<span class="cohost-badge">Co-Host</span>' : ''}</div>
        <div class="participant-role">${peran}</div>
        ${showMenuBtn ? `
          <button class="participant-menu-btn" onclick="window.__toggleParticipantMenu('${p.identity}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          ${dropdownHtml}
        ` : ''}
      </div>`;
  }).join('');
}

function countCoHosts() {
  let count = 0;
  room.remoteParticipants.forEach((p) => {
    try { if (JSON.parse(p.metadata || '{}').coHost) count++; } catch (e) {}
  });
  return count;
}

function toggleParticipantMenu(identity) {
  openParticipantMenuFor = openParticipantMenuFor === identity ? null : identity;
  renderParticipantsList();
}
window.__toggleParticipantMenu = toggleParticipantMenu;

function assignCoHost(identity) {
  if (countCoHosts() >= MAKS_COHOST) return alert(`Maksimal ${MAKS_COHOST} Co-Host.`);
  sendData({ type: 'assign-cohost', target: identity });
  openParticipantMenuFor = null;
  renderParticipantsList();
}
window.__assignCoHost = assignCoHost;

function revokeCoHost(identity) {
  sendData({ type: 'revoke-cohost', target: identity });
  openParticipantMenuFor = null;
  renderParticipantsList();
}
window.__revokeCoHost = revokeCoHost;

// ==================== VISIBILITAS TOOLBAR (host & co-host vs peserta biasa) ====================

function updateToolbarVisibility() {
  const privileged = isHost || isCoHost;
  screenBtn.classList.toggle('hidden', !privileged);
  bibleToolBtn.classList.toggle('hidden', !privileged);
  pesertaToolBtn.classList.toggle('hidden', !privileged);
  moreToolBtn.classList.toggle('hidden', !privileged);
  participantsTopBtn.classList.toggle('hidden', !privileged);
  document.querySelector('.tab-btn[data-tab="alkitab"]').classList.toggle('hidden', !privileged);
  document.querySelector('.tab-btn[data-tab="peserta"]').classList.toggle('hidden', !privileged);

  // Kalau tab yang lagi aktif jadi gak boleh diakses lagi, balikin ke tab Chat
  if (!privileged) {
    const active = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (active === 'alkitab' || active === 'peserta') switchTab('chat');
  }
}

// ==================== SHARE POPUP (kode & link, buat SEMUA peserta) ====================

function setupSharePopup() {
  shareCodeText.textContent = roomName;
  shareLinkInputRoom.value = `${window.location.origin}/room.html?room=${roomName}&role=audience`;

  shareTopBtn.addEventListener('click', () => sharePopup.classList.toggle('hidden'));
  copyShareLinkBtn.addEventListener('click', () => {
    shareLinkInputRoom.select();
    navigator.clipboard.writeText(shareLinkInputRoom.value);
    copyShareLinkBtn.textContent = 'Tersalin!';
    setTimeout(() => (copyShareLinkBtn.textContent = 'Salin'), 1500);
  });
  document.addEventListener('click', (e) => {
    if (!sharePopup.contains(e.target) && e.target !== shareTopBtn && !shareTopBtn.contains(e.target)) {
      sharePopup.classList.add('hidden');
    }
  });
}

let startTime = null;
function startTimer() {
  startTime = Date.now();
  setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const pad = (n) => String(n).padStart(2, '0');
    timerEl.textContent = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }, 1000);
}

// ==================== PANEL TAB ====================

function setupTabs() {
  tabButtons.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  chatSendBtn.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
}

function openPanel(tabName) {
  const currentlyActive = document.querySelector('.tab-btn.active')?.dataset.tab;
  const isOpen = !sidePanel.classList.contains('hidden');
  if (isOpen && currentlyActive === tabName) {
    sidePanel.classList.add('hidden');
    return;
  }
  sidePanel.classList.remove('hidden');
  switchTab(tabName);
}

function switchTab(tabName) {
  tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));
  chatTab.classList.toggle('hidden', tabName !== 'chat');
  alkitabTab.classList.toggle('hidden', tabName !== 'alkitab');
  pesertaTab.classList.toggle('hidden', tabName !== 'peserta');
  if (tabName === 'peserta') renderParticipantsList();
}

// ==================== MENU "MORE" (pengaturan host) ====================

function setupMoreMenu() {
  moreMenuHostOnly.classList.toggle('hidden', !isHost);
  moreMenuNotHost.classList.toggle('hidden', isHost);

  moreToolBtn.addEventListener('click', () => moreMenu.classList.toggle('hidden'));
  document.addEventListener('click', (e) => {
    if (!moreMenu.contains(e.target) && e.target !== moreToolBtn && !moreToolBtn.contains(e.target)) {
      moreMenu.classList.add('hidden');
    }
  });

  if (!isHost) return;

  autoMuteToggle.checked = !!roomSettings.autoMuteNewJoin;
  autoCamOffToggle.checked = !!roomSettings.autoCameraOffNewJoin;

  autoMuteToggle.addEventListener('change', simpanPengaturanRoom);
  autoCamOffToggle.addEventListener('change', simpanPengaturanRoom);

  muteAllBtn.addEventListener('click', async () => {
    muteAllBtn.disabled = true;
    muteAllBtn.textContent = 'Memproses...';
    try {
      const res = await fetch(`${API_BASE}/api/room/${roomName}/mute-all`, { method: 'POST' });
      const data = await res.json();
      muteAllBtn.textContent = res.ok ? `✅ ${data.dimatikan} mic dimatikan` : '🔇 Matikan Semua Mic Peserta';
    } catch (err) {
      alert('Gagal matikan mic semua peserta: ' + err.message);
      muteAllBtn.textContent = '🔇 Matikan Semua Mic Peserta';
    } finally {
      muteAllBtn.disabled = false;
      setTimeout(() => { muteAllBtn.textContent = '🔇 Matikan Semua Mic Peserta'; }, 2500);
    }
  });
}

async function simpanPengaturanRoom() {
  roomSettings = {
    autoMuteNewJoin: autoMuteToggle.checked,
    autoCameraOffNewJoin: autoCamOffToggle.checked,
  };
  try {
    await fetch(`${API_BASE}/api/room/${roomName}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomSettings),
    });
  } catch (err) {
    console.warn('Gagal simpan pengaturan room', err);
  }
}

// ==================== CHAT ====================

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  const msg = {
    type: 'chat',
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dari: room.localParticipant.name || room.localParticipant.identity,
    identity: room.localParticipant.identity,
    isi: text,
    waktu: new Date().toISOString(),
  };
  renderChatMessage(msg, true);
  sendData(msg);
  chatInput.value = '';
}

function renderChatMessage(msg, mine) {
  const div = document.createElement('div');
  div.className = 'chat-msg' + (mine ? ' mine' : '');
  const jam = new Date(msg.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `
    <div class="who">${msg.dari}<span class="when">${jam}</span></div>
    <div class="bubble">${escapeHtml(msg.isi)}</div>
  `;
  if (!mine) {
    div.style.cursor = 'pointer';
    div.title = 'Klik buat sematkan pesan ini';
    div.addEventListener('click', () => pinMessage(msg));
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function pinMessage(msg) {
  if (pinnedMessages.find((p) => p.id === msg.id)) return;
  pinnedMessages.unshift(msg);
  if (pinnedMessages.length > 4) pinnedMessages.pop();
  renderPinned();
  sendData({ type: 'pin-add', msg });
}

function unpinMessage(id) {
  pinnedMessages = pinnedMessages.filter((p) => p.id !== id);
  renderPinned();
  sendData({ type: 'pin-remove', id });
}

function renderPinned() {
  if (!pinnedMessages.length) {
    pinnedArea.classList.add('hidden');
    pinnedArea.innerHTML = '';
    return;
  }
  pinnedArea.classList.remove('hidden');
  pinnedArea.innerHTML = `<div class="hint">Pesan disematkan ${pinnedMessages.length}</div>` +
    pinnedMessages.map((p) => `
      <div class="pinned-msg">
        <button class="pin-close" onclick="window.__unpin('${p.id}')">×</button>
        <div class="pin-title">${p.dari}</div>
        <div>${escapeHtml(p.isi)}</div>
      </div>
    `).join('');
}
window.__unpin = unpinMessage;

// ==================== DATA CHANNEL ====================

function sendData(obj) {
  if (!room) return;
  room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(obj)), { reliable: true });
}

function handleDataMessage(msg) {
  if (msg.type === 'chat') {
    renderChatMessage(msg, false);
  } else if (msg.type === 'pin-add') {
    if (!pinnedMessages.find((p) => p.id === msg.msg.id)) {
      pinnedMessages.unshift(msg.msg);
      if (pinnedMessages.length > 4) pinnedMessages.pop();
      renderPinned();
    }
  } else if (msg.type === 'pin-remove') {
    pinnedMessages = pinnedMessages.filter((p) => p.id !== msg.id);
    renderPinned();
  } else if (msg.type === 'verse-show') {
    verseOverlayText.textContent = msg.teks;
    verseOverlayRef.textContent = msg.referensi;
    verseOverlay.classList.remove('hidden');
  } else if (msg.type === 'verse-hide') {
    verseOverlay.classList.add('hidden');
  } else if (msg.type === 'assign-cohost') {
    if (msg.target === room.localParticipant.identity) {
      isCoHost = true;
      room.localParticipant.setMetadata(JSON.stringify({ peran: myPeran, coHost: true }));
      updateToolbarVisibility();
    }
    renderParticipantsList();
  } else if (msg.type === 'revoke-cohost') {
    if (msg.target === room.localParticipant.identity) {
      isCoHost = false;
      room.localParticipant.setMetadata(JSON.stringify({ peran: myPeran, coHost: false }));
      updateToolbarVisibility();
    }
    renderParticipantsList();
  }
}

// ==================== FITUR ALKITAB ====================

let daftarKitabAktif = [];
let kitabAktif = null;
let bnumberAktif = null;
let pasalAktif = 1;
let daftarAyatPasalAktif = [];
let rentangAwal = 1;
let rentangAkhir = 1;
let anchorAyat = 1;
const MAKS_AYAT_SEKALIGUS = 3;
let biblePanelInitialized = false;

async function initBiblePanel() {
  if (biblePanelInitialized) return;
  biblePanelInitialized = true;

  translationSelect.innerHTML = '<option value="">Memuat...</option>';
  const snap = await bibleDb.collection('alkitab_versi').get();

  if (snap.empty) {
    translationSelect.innerHTML = '<option value="">Belum ada Alkitab di Leitora</option>';
    return;
  }

  translationSelect.innerHTML = snap.docs
    .map((doc) => {
      const d = doc.data();
      return `<option value="${doc.id}">${d.nama} (${d.kode})</option>`;
    })
    .join('');

  await loadBooks(translationSelect.value);
  translationSelect.addEventListener('change', () => loadBooks(translationSelect.value));
  bookSelect.addEventListener('change', () => {
    const kitab = daftarKitabAktif.find((k) => String(k.bnumber) === bookSelect.value);
    bnumberAktif = kitab ? kitab.bnumber : null;
    kitabAktif = kitab ? kitab.bname : '';
    perbaruiDropdownPasal();
    muatDaftarAyat();
  });
  chapterSelect.addEventListener('change', () => {
    pasalAktif = parseInt(chapterSelect.value, 10);
    muatDaftarAyat();
  });

  showToAllBtn.addEventListener('click', broadcastVerse);
  hideVerseBtn.addEventListener('click', () => {
    verseOverlay.classList.add('hidden');
    sendData({ type: 'verse-hide' });
  });
}

async function loadBooks(versiId) {
  if (!versiId) return;
  const snap = await bibleDb.collection('alkitab_versi').doc(versiId).collection('kitab').orderBy('bnumber').get();
  daftarKitabAktif = snap.docs.map((d) => d.data());
  bookSelect.innerHTML = daftarKitabAktif.map((k) => `<option value="${k.bnumber}">${k.bname}</option>`).join('');

  if (daftarKitabAktif.length) {
    bnumberAktif = daftarKitabAktif[0].bnumber;
    kitabAktif = daftarKitabAktif[0].bname;
    perbaruiDropdownPasal();
    await muatDaftarAyat();
  }
}

function perbaruiDropdownPasal() {
  const kitab = daftarKitabAktif.find((k) => k.bnumber === bnumberAktif);
  const jumlahPasal = kitab ? kitab.jumlahPasal : 1;
  let opts = '';
  for (let i = 1; i <= jumlahPasal; i++) opts += `<option value="${i}">${i}</option>`;
  chapterSelect.innerHTML = opts;
  pasalAktif = 1;
  chapterSelect.value = 1;
}

async function muatDaftarAyat() {
  if (!bnumberAktif) return;
  const versiId = translationSelect.value;
  const idPasal = `${bnumberAktif}_${pasalAktif}`;
  ayatListContainer.innerHTML = '<div class="hint">Memuat...</div>';

  const doc = await bibleDb.collection('alkitab_versi').doc(versiId).collection('pasal').doc(idPasal).get();
  const ayatMap = doc.exists && doc.data().ayat ? doc.data().ayat : {};
  daftarAyatPasalAktif = Object.keys(ayatMap)
    .map((k) => ({ vnumber: parseInt(k, 10), teks: ayatMap[k] }))
    .sort((a, b) => a.vnumber - b.vnumber);

  rentangAwal = daftarAyatPasalAktif.length ? daftarAyatPasalAktif[0].vnumber : 1;
  rentangAkhir = rentangAwal;
  anchorAyat = rentangAwal;
  renderDaftarAyat();
}

function renderDaftarAyat() {
  ayatListContainer.innerHTML = '';
  if (!daftarAyatPasalAktif.length) {
    ayatListContainer.innerHTML = '<div class="hint">Tidak ada ayat.</div>';
    return;
  }
  daftarAyatPasalAktif.forEach((a) => {
    const div = document.createElement('div');
    const masukRentang = a.vnumber >= rentangAwal && a.vnumber <= rentangAkhir;
    div.className = 'ayat-row' + (masukRentang ? ' aktif' : '');
    div.innerHTML = `<span class="ayat-num">${a.vnumber}</span>${a.teks}`;
    div.onclick = (e) => {
      if (e.ctrlKey || e.metaKey) {
        let mulai = Math.min(anchorAyat, a.vnumber);
        let akhir = Math.max(anchorAyat, a.vnumber);
        if (akhir - mulai + 1 > MAKS_AYAT_SEKALIGUS) {
          if (a.vnumber >= anchorAyat) { mulai = anchorAyat; akhir = anchorAyat + (MAKS_AYAT_SEKALIGUS - 1); }
          else { akhir = anchorAyat; mulai = anchorAyat - (MAKS_AYAT_SEKALIGUS - 1); }
        }
        rentangAwal = mulai;
        rentangAkhir = akhir;
      } else {
        anchorAyat = a.vnumber;
        rentangAwal = a.vnumber;
        rentangAkhir = a.vnumber;
      }
      renderDaftarAyat();
    };
    ayatListContainer.appendChild(div);
  });
}

function broadcastVerse() {
  const dipilih = daftarAyatPasalAktif.filter((a) => a.vnumber >= rentangAwal && a.vnumber <= rentangAkhir);
  if (!dipilih.length) return alert('Pilih ayat dulu.');

  const versiLabel = translationSelect.selectedOptions[0]?.textContent || '';
  const referensi = dipilih.length > 1
    ? `${kitabAktif} ${pasalAktif}:${rentangAwal}-${rentangAkhir} (${versiLabel})`
    : `${kitabAktif} ${pasalAktif}:${dipilih[0].vnumber} (${versiLabel})`;
  const teks = dipilih.map((a) => a.teks).join(' ');

  verseOverlayText.textContent = teks;
  verseOverlayRef.textContent = referensi;
  verseOverlay.classList.remove('hidden');

  sendData({ type: 'verse-show', teks, referensi });
}
