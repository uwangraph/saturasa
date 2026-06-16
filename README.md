# 🎵 SatuRasa

**Satu Rasa, Satu Lagu, Dimana Saja**

Social music player yang memungkinkan kamu dan teman-teman mendengarkan musik YouTube secara sinkron, tanpa perlu akun.

## ✨ Fitur

- 🎵 **Sinkronisasi Musik** — Semua peserta mendengar lagu yang sama pada detik yang sama via WebSocket
- 💬 **Chat Real-time** — Ngobrol dengan peserta lain saat mendengarkan musik
- 👥 **Tanpa Akun** — Cukup masukkan nama, langsung bisa pakai
- 🎛️ **Kontrol Global** — Play, pause, skip, seek, volume dari satu pengontrol untuk semua
- 📋 **Antrean Lagu** — Tambah, hapus, dan reorder lagu di antrean
- 🔒 **Role System** — Host, Member, Listener Only
- 📤 **Share** — QR Code, link, dan native share API
- 📱 **Responsive** — Tampilan optimal di desktop dan mobile

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Svelte 5 + Tailwind CSS + Vite |
| Backend | Cloudflare Workers |
| Realtime | Durable Objects (WebSocket) |
| Database | D1 (SQLite) |
| Player | YouTube IFrame API |

## 📁 Struktur Project

```
saturasa/
├── frontend/             # Svelte 5 frontend
│   ├── src/
│   │   ├── routes/       # Halaman (Home, Room, About)
│   │   ├── lib/
│   │   │   ├── components/  # UI Components
│   │   │   ├── stores/      # Svelte stores
│   │   │   └── utils/       # Helpers & router
│   │   ├── assets/
│   │   ├── App.svelte
│   │   ├── main.js
│   │   └── app.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/              # Cloudflare Workers
│   ├── src/
│   │   ├── index.ts      # Entry point & API routes
│   │   ├── RoomDO.ts     # Durable Object (WebSocket)
│   │   └── types.ts      # Shared types
│   ├── migrations/       # D1 migrations
│   ├── wrangler.toml
│   └── package.json
├── dist/                 # Build output
├── PRD.md                # Product Requirements Document
└── GLOSARIUM.md          # Glosarium istilah
```

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm atau pnpm
- Wrangler CLI (`npm i -g wrangler`)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Berjalan di `http://localhost:5173`

### Backend

```bash
cd backend
npm install

# Setup D1 database
wrangler d1 create saturasa-db
wrangler d1 migrations apply saturasa-db

# Set YouTube API key
wrangler secret put YOUTUBE_API_KEY

# Run locally
npm run dev
```

Berjalan di `http://localhost:8787`

### Build untuk Production

```bash
# Build frontend
cd frontend
npx vite build

# Deploy backend
cd backend
wrangler deploy
```

## 🔑 Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `YOUTUBE_API_KEY` | Google YouTube Data API key |

## 📄 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/rooms` | Buat ruang baru |
| GET | `/api/rooms/public` | Daftar ruang publik |
| GET | `/api/rooms/:id/state` | State ruang (fallback) |
| GET | `/api/youtube/search?q=` | Cari lagu YouTube |
| WS | `/api/ws/:roomId` | Koneksi WebSocket |

## 📝 Roadmap

- **V1.0** — MVP: Room, sync player, chat, role dasar, YouTube search, share
- **V1.1** — Vote skip, emoji reaction, listener only, native share
- **V1.2** — Play history, custom room code, co-host, moderasi
- **V2.0** — Karaoke mode, custom theme, private listening, Spotify

## 📋 License

MIT
