# Meet App (starter)

Meeting app sederhana pakai LiveKit. Host bisa buat room & nyalakan kamera/mic,
audiens tinggal klik link → isi nama → langsung nonton/dengar (tanpa akun).

## Struktur

```
meet-app/
  server/     -> backend Node.js (generate token, buat room)
  public/     -> frontend vanilla HTML/JS
```

## Cara jalanin (development)

### 1. Daftar LiveKit Cloud (gratis)
- Buka https://cloud.livekit.io, daftar, buat project baru
- Di dashboard, catat: **URL**, **API Key**, **API Secret**

### 2. Setup backend
```bash
cd server
npm install
cp .env.example .env
# edit .env, isi LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET
npm start
```
Server jalan di `http://localhost:3001` dan otomatis serve folder `public/` juga.

### 3. Buka di browser
Kunjungi `http://localhost:3001` → isi nama → klik "Mulai Meeting Baru".
Kamu akan dapat:
- **Link audiens** (share ke orang lain, tanpa perlu login)
- **Tombol "Masuk sebagai Host"** buat kamu sendiri

### 4. Coba dari 2 tab/browser berbeda
Buka link audiens di tab/incognito lain → isi nama → langsung connect.

## Cara kerja "join tanpa akun"

1. Host bikin room → server generate `roomName` acak (via LiveKit)
2. Link yang di-share cuma berisi `?room=xxx&role=audience`
3. Saat audiens buka link & isi nama, browser minta **token sementara** ke backend (`/api/token`)
4. Backend generate JWT token pakai `livekit-server-sdk` — token ini yang membuktikan mereka boleh masuk room tsb, tanpa perlu akun/password
5. Token dipakai buat connect ke LiveKit lewat `livekit-client` (WebRTC di balik layar)

Role `audience` diset `canPublish: false` di backend — jadi mereka otomatis
cuma bisa nonton & dengar, gak bisa nyalain kamera/mic (bisa diubah sesuai kebutuhan).

## Ide fitur tambahan yang gampang di-extend dari sini
- Chat teks (LiveKit sudah sediakan data channel, tinggal pakai `room.localParticipant.publishData`)
- Reaction emoji real-time (pakai data channel juga)
- Rekam meeting (LiveKit Cloud punya fitur Egress/recording)
- Raise hand / mute all (host-only controls)
- Waiting room / approval sebelum audiens masuk

## Fitur: Tampilkan Ayat Alkitab (built-in)

Sudah tersedia fitur "presentasi ayat" mirip ProPresenter/EasyWorship:

### 1. Import Alkitab (sekali saja, sebagai admin)
- Buka `http://localhost:3001/admin.html`
- Masukkan password admin (dari `ADMIN_TOKEN` di `.env`)
- Isi kode singkat (misal `TB`), nama lengkap (misal `Terjemahan Baru`), lalu upload file XML
- Bisa ulangi untuk terjemahan lain (misal `BIS`, `AYT`) — semua akan muncul sebagai pilihan
- **Format file harus Zefania XML** (tag `<XMLBIBLE><BIBLEBOOK><CHAPTER><VERS>`) — ini format umum yang dipakai banyak situs Alkitab digital gratis

### 2. Pakai saat meeting (khusus host)
- Klik tombol **"📖 Alkitab"** di toolbar
- Pilih terjemahan → pilih kitab → isi pasal & ayat → klik **"Cari"** buat preview
- Klik **"Tampilkan ke Semua"** → ayat muncul sebagai overlay besar di layar **semua peserta**, termasuk yang join dari HP (fitur ini pakai data broadcast, bukan screen share, jadi jalan di semua device)
- Klik **"Sembunyikan dari Semua"** buat menutup overlay

### Catatan keamanan
`ADMIN_TOKEN` di `.env` itu password sederhana buat halaman import — ganti dari nilai default sebelum deploy ke production, dan jangan share ke sembarang orang.

## Deploy ke production
- Frontend (`public/`) bisa di-host statis di Vercel/Netlify/Cloudflare Pages
- Backend (`server/`) perlu Node.js hosting (Railway, Render, Fly.io, VPS biasa)
- Jangan lupa set environment variable LIVEKIT_* di hosting backend
