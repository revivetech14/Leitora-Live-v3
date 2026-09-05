require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { nanoid } = require('nanoid');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const {
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  PORT = 3001,
  HOST_PASSWORD = 'ganti-dengan-password-host',
} = process.env;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.warn(
    '\n⚠️  LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET belum diset di .env\n' +
    '   Salin server/.env.example ke server/.env lalu isi kredensial LiveKit kamu.\n'
  );
}

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

// Buat room baru. Dipanggil oleh HOST saat mau mulai/jadwalkan siaran.
// Wajib password host, supaya cuma orang yang tau password yang bisa bikin siaran & jadi host.
app.post('/api/rooms', async (req, res) => {
  try {
    const { hostPassword } = req.body;
    if (hostPassword !== HOST_PASSWORD) {
      return res.status(401).json({ error: 'Password host salah' });
    }

    const roomName = nanoid(8); // contoh: "aZ3kLp9Q"
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 60 * 60 * 18, // 18 jam -> aman buat kirim link pagi, dipakai malam
      maxParticipants: 200,
    });
    res.json({ roomName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat room' });
  }
});

// Generate access token. role: "host" (wajib password) atau "audience" (bebas, tanpa password).
app.post('/api/token', async (req, res) => {
  try {
    const { room, name, role, hostPassword } = req.body;
    if (!room || !name) {
      return res.status(400).json({ error: 'room dan name wajib diisi' });
    }

    if (role === 'host' && hostPassword !== HOST_PASSWORD) {
      return res.status(401).json({ error: 'Password host salah atau belum diisi' });
    }

    const identity = `${role || 'audience'}-${nanoid(6)}`;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name, // nama tampilan yang diisi user
      ttl: '10h', // diperpanjang biar aman buat sesi yang mulai jauh dari waktu link dibuat
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,            // semua peserta boleh nyalakan kamera/mic/screen share
      canPublishData: true,        // semua bisa kirim chat/reaction
      canSubscribe: true,          // semua bisa nonton & dengar
      canUpdateOwnMetadata: true,  // dibutuhkan buat fitur peran & co-host
    });

    const token = await at.toJwt();
    res.json({ token, url: LIVEKIT_URL, identity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat token' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server jalan di http://localhost:${PORT}`);
});

// ==================== PENGATURAN HOST ====================

// Simpan pengaturan (auto-mute / auto-camera-off peserta baru) di metadata room LiveKit,
// supaya semua client yang connect bisa baca pengaturan terbaru langsung dari room.metadata
app.post('/api/room/:room/settings', async (req, res) => {
  try {
    const { room } = req.params;
    const { autoMuteNewJoin, autoCameraOffNewJoin } = req.body;
    await roomService.updateRoomMetadata(
      room,
      JSON.stringify({ autoMuteNewJoin: !!autoMuteNewJoin, autoCameraOffNewJoin: !!autoCameraOffNewJoin })
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal update pengaturan room' });
  }
});

// Matikan mic SEMUA peserta yang sedang menyalakan mic (dipanggil host)
app.post('/api/room/:room/mute-all', async (req, res) => {
  try {
    const { room } = req.params;
    const participants = await roomService.listParticipants(room);
    let dimatikan = 0;

    for (const p of participants) {
      for (const track of p.tracks) {
        if (track.type === 0 /* AUDIO */ && !track.muted) { // 0 = TrackType.AUDIO
          await roomService.mutePublishedTrack(room, p.identity, track.sid, true);
          dimatikan++;
        }
      }
    }
    res.json({ ok: true, dimatikan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal matikan mic semua peserta' });
  }
});

// Akhiri siaran sepenuhnya: hapus room di LiveKit, otomatis mendiskoneksi SEMUA peserta yang masih join
app.post('/api/room/:room/end', async (req, res) => {
  try {
    const { room } = req.params;
    await roomService.deleteRoom(room);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    // Room mungkin memang sudah kosong/gak ada -> anggap sukses aja, gak perlu bikin user bingung
    res.json({ ok: true, note: 'Room mungkin sudah tidak aktif' });
  }
});
