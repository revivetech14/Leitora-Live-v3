const API_BASE = ''; // sama origin dengan server, kosongkan kalau server & static serve bareng

const createBtn = document.getElementById('createBtn');
const hostNameInput = document.getElementById('hostName');
const resultBox = document.getElementById('result');
const shareLinkInput = document.getElementById('shareLinkInput');
const copyBtn = document.getElementById('copyBtn');
const hostLinkInput = document.getElementById('hostLinkInput');
const copyHostBtn = document.getElementById('copyHostBtn');
const enterBtn = document.getElementById('enterBtn');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const hostPasswordInput = document.getElementById('hostPassword');

togglePasswordBtn.addEventListener('click', () => {
  const showing = hostPasswordInput.type === 'text';
  hostPasswordInput.type = showing ? 'password' : 'text';
  togglePasswordBtn.innerHTML = showing
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
});

createBtn.addEventListener('click', async () => {
  const hostName = hostNameInput.value.trim() || 'Host';
  const hostRole = document.getElementById('hostRole').value.trim();
  const hostPassword = document.getElementById('hostPassword').value;
  createBtn.disabled = true;
  createBtn.textContent = 'Membuat siaran...';

  try {
    const res = await fetch(`${API_BASE}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal membuat siaran');

    const roomName = data.roomName;
    const baseUrl = `${window.location.origin}/room.html?room=${roomName}`;
    const audienceLink = `${baseUrl}&role=audience`;
    const hostLink = `${baseUrl}&role=host&name=${encodeURIComponent(hostName)}&peran=${encodeURIComponent(hostRole || 'Host')}&hostpw=${encodeURIComponent(hostPassword)}`;

    shareLinkInput.value = audienceLink;
    hostLinkInput.value = hostLink;
    enterBtn.href = hostLink;
    resultBox.classList.remove('hidden');
  } catch (err) {
    alert(err.message || 'Gagal membuat siaran. Pastikan server backend jalan.');
    console.error(err);
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Mulai Siaran Baru';
  }
});

copyBtn.addEventListener('click', () => {
  shareLinkInput.select();
  navigator.clipboard.writeText(shareLinkInput.value);
  copyBtn.textContent = 'Tersalin!';
  setTimeout(() => (copyBtn.textContent = 'Salin'), 1500);
});

copyHostBtn.addEventListener('click', () => {
  hostLinkInput.select();
  navigator.clipboard.writeText(hostLinkInput.value);
  copyHostBtn.textContent = 'Tersalin!';
  setTimeout(() => (copyHostBtn.textContent = 'Salin'), 1500);
});
