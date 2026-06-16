
---

## 8. Struktur Data

### Tabel Rooms (D1)

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | TEXT PRIMARY KEY | Kode ruang (6 karakter) |
| host_id | TEXT | ID WebSocket host |
| created_at | INTEGER | Timestamp |
| is_public | INTEGER | 0/1 |
| participant_count | INTEGER | Jumlah peserta |
| chat_mode | TEXT | 'free', 'emoji-only' |

### State Durable Object (in-memory + persistent)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| currentSong | Object | {youtubeId, title, thumbnail, addedBy} |
| queue | Array | Antrean lagu |
| isPlaying | Boolean | Status play/pause |
| currentTime | Number | Posisi lagu (detik) |
| participants | Array | {id, name, role} |
| chats | Array | Riwayat chat (max 200 pesan) |

---

## 9. Event WebSocket

| Event | Arah | Payload | Deskripsi |
|-------|------|---------|-----------|
| JOIN | C→S | {name, role?} | Masuk ruang |
| STATE | S→C | {currentSong, queue, isPlaying, currentTime} | State awal |
| PLAY | C→S | {} | Play lagu |
| PAUSE | C→S | {} | Pause lagu |
| NEXT | C→S | {} | Skip lagu |
| SEEK | C→S | {time} | Lompat ke detik tertentu |
| ADD_SONG | C→S | {youtubeId, title, thumbnail} | Tambah lagu |
| SEND_MESSAGE | C→S | {text, type} | Kirim chat |
| NEW_MESSAGE | S→C | {id, userName, text, timestamp, type} | Broadcast chat |
| VOLUME | C→S | {volume} | Ubah volume global |
| SYNC | S→C | {isPlaying, currentTime} | Sinkronisasi |
| PARTICIPANTS | S→C | {participants} | Update peserta |
| QUEUE_UPDATE | S→C | {queue} | Update antrean |
| SET_ROLE | C→S (host) | {userId, newRole} | Ubah role |
| LEAVE | C→S | {} | Keluar ruang |

---

## 10. Rute API

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/rooms` | Buat ruang baru (generate random ID) |
| GET | `/api/rooms/public` | Daftar ruang publik |
| GET | `/api/rooms/:id/state` | Ambil state ruang (fallback jika WebSocket belum konek) |
| GET | `/api/youtube/search?q=` | Cari lagu YouTube |
| WebSocket | `/api/ws/:roomId` | Koneksi WebSocket ke Durable Object |

---

## 11. Halaman & UI

| Halaman | URL | Komponen |
|---------|-----|----------|
| Beranda | `/` | Hero, tombol buat ruang, input gabung, daftar ruang publik |
| Ruang | `/ruang/[id]` | Player, queue, chat, pencarian YouTube, daftar peserta, share panel |
| Tentang | `/tentang` | Penjelasan fitur & cara pakai |

---

## 12. Metrik Sukses (KPI)

| Metrik | Target |
|--------|--------|
| Waktu buat ruang | < 2 detik |
| Latensi sinkron musik | < 500 ms |
| User retention (1 minggu) | > 20% |
| Rata-rata peserta per ruang | 5 orang |
| Pesan chat per ruang per jam (aktif) | > 10 pesan |

---

## 13. Roadmap

### V1.0 (MVP) - 4 minggu

| Minggu | Fokus |
|--------|-------|
| 1 | Setup project, backend worker, Durable Object, WebSocket dasar |
| 2 | Frontend Svelte: halaman utama, halaman ruang, player sinkron |
| 3 | Fitur chat, role dasar (Host vs Member), YouTube search |
| 4 | QR Code, share, testing, deployment ke Cloudflare |

### V1.1 (Launch + 2 minggu)

- Vote skip
- Emoji reaction ke lagu
- Listener Only role
- Native share API

### V1.2 (Launch + 6 minggu)

- Riwayat lagu (play history)
- Custom kode ruang
- Co-host role
- Hapus pesan orang lain (moderasi)

### V2.0 (Launch + 3 bulan)

- Karaoke mode (lirik)
- Custom room theme
- Private listening mode
- Integrasi Spotify (opsional)

---

## 14. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| YouTube API quota habis | Tidak bisa cari lagu | Cache hasil pencarian, limit per user |
| WebSocket koneksi putus | Sinkronisasi hilang | Auto-reconnect setiap 3 detik |
| Latensi tinggi (>1 detik) | Musik tidak sinkron | Kirim timestamp + offset client |
| Mobile browser tidak support WebSocket | Tidak bisa ikut | Fallback ke polling (kurang ideal) |
| Server overload | Semua ruang lag | Durable Objects scalable horizontal |

---

## 15. Approval

| Role | Nama | Status |
|------|------|--------|
| Product Owner | [Anda] | ✅ Setuju |
| Tech Lead | [Anda] | ✅ Setuju |
| Designer | [Anda] | ✅ Setuju |

---

**Status:** PRD siap untuk dilanjutkan ke fase **Development**.

---