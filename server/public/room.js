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
const switchCamBtn = document.getElementById('switchCamBtn');
const connQualityBadge = document.getElementById('connQualityBadge');
const qualityBanner = document.getElementById('qualityBanner');
const turnOffCamFromBanner = document.getElementById('turnOffCamFromBanner');
const dismissQualityBanner = document.getElementById('dismissQualityBanner');
const screenBtn = document.getElementById('screenBtn');
const bibleToolBtn = document.getElementById('bibleToolBtn');
const lyricToolBtn = document.getElementById('lyricToolBtn');
const chatToolBtn = document.getElementById('chatToolBtn');
const pesertaToolBtn = document.getElementById('pesertaToolBtn');
const moreToolBtn = document.getElementById('moreToolBtn');
const leaveBtn = document.getElementById('leaveBtn');
const participantsTopBtn = document.getElementById('participantsTopBtn');
const chatTopBtn = document.getElementById('chatTopBtn');

const moreMenu = document.getElementById('moreMenu');
const moreMenuHostOnly = document.getElementById('moreMenuHostOnly');
const moreMenuModerator = document.getElementById('moreMenuModerator');
const proAudioModeToggle = document.getElementById('proAudioModeToggle');
const moreMenuNotHost = document.getElementById('moreMenuNotHost');
const autoMuteToggle = document.getElementById('autoMuteToggle');
const autoCamOffToggle = document.getElementById('autoCamOffToggle');
const muteAllBtn = document.getElementById('muteAllBtn');

const sidePanel = document.getElementById('sidePanel');
const panelCloseBtn = document.getElementById('panelCloseBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const chatTab = document.getElementById('chatTab');
const alkitabTab = document.getElementById('alkitabTab');
const lirikTab = document.getElementById('lirikTab');
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
let roomSettings = { autoMuteNewJoin: false, autoCameraOffNewJoin: false, micLocked: false };
let micLockedForMe = false; // true = peserta biasa TIDAK bisa buka mic sendiri sampai diizinkan host/co-host
let currentFacingMode = 'user'; // 'user' = depan, 'environment' = belakang
let poorQualityDismissed = false;
let professionalAudioMode = false; // true = input dari mixer/soundcard, matiin echo cancellation dkk

// Setting mic disesuaikan tergantung mode: HP biasa vs mixer/soundcard profesional
function getMicCaptureOptions() {
  return professionalAudioMode
    ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 2 }
    : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
}
function getMicPublishOptions() {
  return professionalAudioMode
    ? { audioPreset: LivekitClient.AudioPresets.musicHighQualityStereo, red: true, dtx: false }
    : { audioPreset: LivekitClient.AudioPresets.music, red: true, dtx: true };
}

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

    room = new LivekitClient.Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: LivekitClient.VideoPresets.h180.resolution, // video dikecilin, prioritas ke audio
      },
      publishDefaults: {
        audioPreset: LivekitClient.AudioPresets.music, // audio lebih jernih (cocok utk gitar+vokal)
        red: true,   // redundansi paket audio -> anti putus2 pas sinyal jelek
        dtx: true,   // hemat bandwidth pas hening
      },
    });

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
    room.on(LivekitClient.RoomEvent.RoomMetadataChanged, (metadata) => handleRoomMetadataChanged(metadata));
    room.on(LivekitClient.RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (participant === room.localParticipant) updateConnQualityUI(quality);
    });
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

    // Baca pengaturan room (auto-mute / auto-camera-off / kunci-mic-semua) yang mungkin sudah diset host
    try { roomSettings = JSON.parse(room.metadata || '{}'); } catch (e) { roomSettings = {}; }

    const skipMic = !isHost && (roomSettings.autoMuteNewJoin || roomSettings.micLocked);
    const skipCam = !isHost && roomSettings.autoCameraOffNewJoin;
    micLockedForMe = !isHost && !!roomSettings.micLocked;

    if (!skipCam) await room.localParticipant.setCameraEnabled(true);
    if (!skipMic) {
      await room.localParticipant.setMicrophoneEnabled(true, getMicCaptureOptions(), getMicPublishOptions());
    }

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
    setupLyricPanel();
    startTimer();
    updateParticipantUI();
    updateToolbarVisibility();
  } catch (err) {
    console.error(err);
    alert('Gagal join siaran: ' + err.message);
  }
}

// Nyalakan/matikan mic LOKAL + update UI tombol mic. Dipakai baik saat user klik tombol mic sendiri,
// MAUPUN saat menerima perintah force-mic dari host/co-host lewat data channel.
async function setMicEnabled(enabled) {
  await room.localParticipant.setMicrophoneEnabled(enabled, getMicCaptureOptions(), getMicPublishOptions());
  micBtn.classList.toggle('off', !enabled);
  micBtn.querySelector('.tool-icon').innerHTML = enabled ? ICON_MIC : ICON_MIC_OFF;
  updateMicIndicator(room.localParticipant);
}

// Nyalakan/matikan kamera LOKAL + update UI tombol kamera & tile video sendiri. Dipakai baik saat user
// klik tombol kamera sendiri, MAUPUN saat menerima perintah force-cam dari host/co-host.
async function setCamEnabled(enabled) {
  await room.localParticipant.setCameraEnabled(enabled);
  camBtn.classList.toggle('off', !enabled);
  camBtn.querySelector('.tool-icon').innerHTML = enabled ? ICON_CAM : ICON_CAM_OFF;

  const tile = document.getElementById(`tile-${room.localParticipant.identity}`) || buildTile(room.localParticipant);
  if (!enabled) {
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
}

// Toast kecil buat kasih tau peserta kalau mic/kameranya baru saja diubah oleh host/co-host
function showToast(text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:10px 18px;border-radius:8px;font-size:14px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.3);max-width:90%;text-align:center;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function setupControls() {
  micBtn.addEventListener('click', async () => {
    const enabled = room.localParticipant.isMicrophoneEnabled;
    const privileged = isHost || isCoHost;
    if (!enabled && micLockedForMe && !privileged) {
      showToast('🔒 Mic kamu dikunci oleh host. Minta host/co-host untuk membukanya lewat menu Peserta.');
      return;
    }
    await setMicEnabled(!enabled);
  });

  camBtn.addEventListener('click', async () => {
    const wasEnabled = room.localParticipant.isCameraEnabled;
    await setCamEnabled(!wasEnabled);
  });

  switchCamBtn.addEventListener('click', async () => {
    try {
      const cameraPub = [...room.localParticipant.videoTrackPublications.values()]
        .find((pub) => pub.source === LivekitClient.Track.Source.Camera);
      if (!cameraPub || !cameraPub.track) {
        alert('Nyalakan kamera dulu ya sebelum bisa diganti.');
        return;
      }
      currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      await cameraPub.track.restartTrack({ facingMode: currentFacingMode });
    } catch (err) {
      console.warn('Gagal ganti kamera:', err);
      alert('Gagal ganti kamera. Kemungkinan HP/browser kamu cuma punya 1 kamera.');
    }
  });

  turnOffCamFromBanner.addEventListener('click', async () => {
    if (room.localParticipant.isCameraEnabled) {
      await room.localParticipant.setCameraEnabled(false);
      camBtn.classList.add('off');
      camBtn.querySelector('.tool-icon').innerHTML = ICON_CAM_OFF;
      document.getElementById(`tile-${room.localParticipant.identity}`)?.querySelector('video')?.remove();
    }
    qualityBanner.classList.add('hidden');
  });

  dismissQualityBanner.addEventListener('click', () => {
    poorQualityDismissed = true;
    qualityBanner.classList.add('hidden');
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
  lyricToolBtn.addEventListener('click', () => openPanel('lirik'));
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

// ==================== INDIKATOR KUALITAS SINYAL ====================
// LiveKit cuma kasih 3 tingkat (Excellent/Good/Poor), bukan angka ms mentah -> lebih gampang dipahami peserta awam.

function updateConnQualityUI(quality) {
  const Q = LivekitClient.ConnectionQuality;
  connQualityBadge.classList.remove('badge-quality-excellent', 'badge-quality-good', 'badge-quality-poor');

  if (quality === Q.Excellent) {
    connQualityBadge.textContent = '🟢 Sinyal baik';
    connQualityBadge.classList.add('badge-quality-excellent');
    qualityBanner.classList.add('hidden');
  } else if (quality === Q.Good) {
    connQualityBadge.textContent = '🟡 Sinyal sedang';
    connQualityBadge.classList.add('badge-quality-good');
    qualityBanner.classList.add('hidden');
  } else if (quality === Q.Poor) {
    connQualityBadge.textContent = '🔴 Sinyal lemah';
    connQualityBadge.classList.add('badge-quality-poor');
    if (room.localParticipant.isCameraEnabled && !poorQualityDismissed) {
      qualityBanner.classList.remove('hidden');
    }
  }
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
    const targetIsHost = p.identity.startsWith('host-'); // host gak boleh dimoderasi siapapun, termasuk co-host lain
    const showMenuBtn = (isHost || isCoHost) && !isMe && !targetIsHost;
    const menuOpen = openParticipantMenuFor === p.identity;

    let dropdownHtml = '';
    if (menuOpen) {
      const micOn = p.isMicrophoneEnabled;
      const camOn = p.isCameraEnabled;

      // Mute/unmute & kamera: boleh dipakai host MAUPUN co-host
      let moderasiHtml = `
        <button onclick="window.__forceMic('${p.identity}', ${!micOn})">${micOn ? '🔇 Matikan Mic' : '🎤 Nyalakan Mic'}</button>
        <button onclick="window.__forceCam('${p.identity}', ${!camOn})">${camOn ? '📷 Matikan Kamera' : '📷 Nyalakan Kamera'}</button>
      `;

      // Jadikan/cabut co-host: khusus host
      let cohostHtml = '';
      if (isHost) {
        const cohostCount = countCoHosts();
        const limitReached = cohostCount >= MAKS_COHOST;
        if (coHost) {
          cohostHtml = `<button class="danger-text" onclick="window.__revokeCoHost('${p.identity}')">Cabut Co-Host</button>`;
        } else if (limitReached) {
          cohostHtml = `<button disabled style="opacity:0.5;cursor:not-allowed">Maks ${MAKS_COHOST} Co-Host tercapai</button>`;
        } else {
          cohostHtml = `<button onclick="window.__assignCoHost('${p.identity}')">Jadikan Co-Host</button>`;
        }
      }

      dropdownHtml = `<div class="participant-dropdown">${moderasiHtml}${cohostHtml}</div>`;
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

// Host/co-host minta mic peserta tertentu dimatikan/dinyalakan.
// Yang benar-benar mengeksekusi adalah browser milik peserta itu sendiri (lihat handleDataMessage).
function forceMic(identity, enabled) {
  sendData({ type: 'force-mic', target: identity, enabled });
  openParticipantMenuFor = null;
  renderParticipantsList();
}
window.__forceMic = forceMic;

// Host/co-host minta kamera peserta tertentu dimatikan/dinyalakan.
function forceCam(identity, enabled) {
  sendData({ type: 'force-cam', target: identity, enabled });
  openParticipantMenuFor = null;
  renderParticipantsList();
}
window.__forceCam = forceCam;

// ==================== VISIBILITAS TOOLBAR (host & co-host vs peserta biasa) ====================

function updateToolbarVisibility() {
  const privileged = isHost || isCoHost;
  screenBtn.classList.toggle('hidden', !privileged);
  bibleToolBtn.classList.toggle('hidden', !privileged);
  lyricToolBtn.classList.toggle('hidden', !privileged);
  moreToolBtn.classList.toggle('hidden', !privileged);
  document.querySelector('.tab-btn[data-tab="alkitab"]').classList.toggle('hidden', !privileged);
  document.querySelector('.tab-btn[data-tab="lirik"]').classList.toggle('hidden', !privileged);
  // Peserta (siapa aja yang join) sengaja TIDAK di-hide -> semua peran boleh lihat daftar peserta.
  // Tombol "jadikan co-host" di dalam daftar itu sendiri tetap cuma dikasih ke host (lihat renderParticipantsList).

  // Kalau tab yang lagi aktif jadi gak boleh diakses lagi, balikin ke tab Chat
  if (!privileged) {
    const active = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (active === 'alkitab' || active === 'lirik') switchTab('chat');
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
  lirikTab.classList.toggle('hidden', tabName !== 'lirik');
  pesertaTab.classList.toggle('hidden', tabName !== 'peserta');
  if (tabName === 'peserta') renderParticipantsList();
}

// ==================== MENU "MORE" (pengaturan host) ====================

function setupMoreMenu() {
  const privileged = isHost || isCoHost;
  moreMenuHostOnly.classList.toggle('hidden', !isHost);
  moreMenuModerator.classList.toggle('hidden', !privileged);
  moreMenuNotHost.classList.toggle('hidden', privileged);

  moreToolBtn.addEventListener('click', () => moreMenu.classList.toggle('hidden'));
  document.addEventListener('click', (e) => {
    if (!moreMenu.contains(e.target) && e.target !== moreToolBtn && !moreToolBtn.contains(e.target)) {
      moreMenu.classList.add('hidden');
    }
  });

  // Pengaturan audio device sendiri (bukan room-wide) -> boleh diatur host MAUPUN co-host
  proAudioModeToggle.checked = professionalAudioMode;
  proAudioModeToggle.addEventListener('change', async () => {
    professionalAudioMode = proAudioModeToggle.checked;
    if (room.localParticipant.isMicrophoneEnabled) {
      // Matiin dulu lalu nyalain lagi biar track ke-republish pakai constraint & bitrate yang baru
      await room.localParticipant.setMicrophoneEnabled(false);
      await room.localParticipant.setMicrophoneEnabled(true, getMicCaptureOptions(), getMicPublishOptions());
    }
  });

  if (!privileged) return;

  // Tombol kunci mic semua: dipakai host & co-host
  updateMuteAllBtnLabel();
  muteAllBtn.addEventListener('click', toggleMicLockAll);

  if (!isHost) return;

  autoMuteToggle.checked = !!roomSettings.autoMuteNewJoin;
  autoCamOffToggle.checked = !!roomSettings.autoCameraOffNewJoin;

  autoMuteToggle.addEventListener('change', simpanPengaturanRoom);
  autoCamOffToggle.addEventListener('change', simpanPengaturanRoom);
}

// ==================== KUNCI MIC SEMUA (dipicu host/co-host lewat tombol di menu More) ====================

async function handleRoomMetadataChanged(metadata) {
  let newSettings = {};
  try { newSettings = JSON.parse(metadata || '{}'); } catch (e) {}

  const wasLocked = !!roomSettings.micLocked;
  roomSettings = newSettings;
  const nowLocked = !!roomSettings.micLocked;
  const privileged = isHost || isCoHost;

  if (nowLocked && !wasLocked) {
    // Kunci baru diaktifkan -> matikan mic SEMUA ORANG yang sedang nyala, termasuk host/co-host.
    // Host/co-host tetap boleh nyalain lagi sendiri kapan saja (gak kena micLockedForMe).
    if (room.localParticipant.isMicrophoneEnabled) await setMicEnabled(false);
    if (!privileged) {
      micLockedForMe = true;
      showToast('🔒 Mic kamu dikunci oleh host. Kamu gak bisa membukanya sendiri sampai diizinkan.');
    }
  } else if (!nowLocked && wasLocked) {
    if (!privileged) {
      micLockedForMe = false;
      showToast('🔓 Mic kamu sudah bisa dibuka sendiri lagi.');
    }
  }

  updateMuteAllBtnLabel();
}

function updateMuteAllBtnLabel() {
  if (!muteAllBtn) return;
  muteAllBtn.textContent = roomSettings.micLocked
    ? '🔓 Buka Kunci Mic Semua Peserta'
    : '🔒 Kunci & Matikan Semua Mic Peserta';
}

async function toggleMicLockAll() {
  const newLocked = !roomSettings.micLocked;
  muteAllBtn.disabled = true;
  muteAllBtn.textContent = 'Memproses...';
  try {
    const res = await fetch(`${API_BASE}/api/room/${roomName}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ micLocked: newLocked }),
    });
    if (!res.ok) throw new Error('Gagal update pengaturan');
    // Perubahan UI/mic sebenarnya dijalankan oleh handleRoomMetadataChanged saat event masuk,
    // biar host sendiri juga konsisten dengan peserta lain.
  } catch (err) {
    alert('Gagal mengubah kunci mic: ' + err.message);
  } finally {
    muteAllBtn.disabled = false;
    updateMuteAllBtnLabel();
  }
}

async function simpanPengaturanRoom() {
  roomSettings = {
    ...roomSettings,
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

async function handleDataMessage(msg) {
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
  } else if (msg.type === 'verse-show' || msg.type === 'lyric-show') {
    verseOverlayText.innerHTML = escapeHtml(msg.teks).replace(/\n/g, '<br>');
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
  } else if (msg.type === 'force-mic') {
    if (msg.target === room.localParticipant.identity) {
      await setMicEnabled(msg.enabled);
      if (!isHost && !isCoHost) {
        if (msg.enabled) {
          micLockedForMe = false; // dibuka manual oleh host/co-host -> kamu bebas atur sendiri setelah ini
        } else if (roomSettings.micLocked) {
          micLockedForMe = true; // lagi mode kunci semua -> balik terkunci
        }
      }
      showToast(msg.enabled ? '🎤 Mic kamu dibuka oleh host/co-host' : '🔇 Mic kamu dimatikan oleh host/co-host');
    }
  } else if (msg.type === 'force-cam') {
    if (msg.target === room.localParticipant.identity) {
      await setCamEnabled(msg.enabled);
      showToast(msg.enabled ? '📷 Kamera kamu dinyalakan oleh host/co-host' : '📷 Kamera kamu dimatikan oleh host/co-host');
    }
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

  verseOverlayText.innerHTML = escapeHtml(teks).replace(/\n/g, '<br>');
  verseOverlayRef.textContent = referensi;
  verseOverlay.classList.remove('hidden');

  sendData({ type: 'verse-show', teks, referensi });
}

// ==================== FITUR LIRIK LAGU (paste manual, gak disimpan) ====================

const lirikInput = document.getElementById('lirikInput');
const prosesLirikBtn = document.getElementById('prosesLirikBtn');
const lirikListContainer = document.getElementById('lirikListContainer');
const showLirikBtn = document.getElementById('showLirikBtn');
const hideLirikBtn = document.getElementById('hideLirikBtn');

let daftarBaitLirik = [];
let baitTerpilih = 0;
let lyricPanelInitialized = false;

function setupLyricPanel() {
  if (lyricPanelInitialized) return;
  lyricPanelInitialized = true;

  prosesLirikBtn.addEventListener('click', () => {
    const teks = lirikInput.value.trim();
    if (!teks) return alert('Paste dulu lirik lagunya ya.');

    // Pisahkan jadi bait berdasarkan baris kosong; kalau gak ada baris kosong, per-baris jadi 1 bait
    let bait = teks.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
    if (bait.length <= 1) bait = teks.split('\n').map((b) => b.trim()).filter(Boolean);

    daftarBaitLirik = bait;
    baitTerpilih = 0;
    renderDaftarBaitLirik();
  });

  showLirikBtn.addEventListener('click', broadcastLirik);
  hideLirikBtn.addEventListener('click', () => {
    verseOverlay.classList.add('hidden');
    sendData({ type: 'verse-hide' });
  });
}

function renderDaftarBaitLirik() {
  lirikListContainer.innerHTML = '';
  if (!daftarBaitLirik.length) {
    lirikListContainer.innerHTML = '<div class="hint">Belum ada lirik diproses.</div>';
    return;
  }
  daftarBaitLirik.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = 'ayat-row' + (i === baitTerpilih ? ' aktif' : '');
    div.innerHTML = `<span class="ayat-num">${i + 1}</span>${b.replace(/\n/g, '<br>')}`;
    div.onclick = () => {
      baitTerpilih = i;
      renderDaftarBaitLirik();
    };
    lirikListContainer.appendChild(div);
  });
}

function broadcastLirik() {
  if (!daftarBaitLirik.length) return alert('Proses lirik dulu sebelum ditampilkan.');
  const teks = daftarBaitLirik[baitTerpilih];
  const referensi = `Bait ${baitTerpilih + 1} dari ${daftarBaitLirik.length}`;

  verseOverlayText.innerHTML = escapeHtml(teks).replace(/\n/g, '<br>');
  verseOverlayRef.textContent = referensi;
  verseOverlay.classList.remove('hidden');

  sendData({ type: 'lyric-show', teks, referensi });
}
