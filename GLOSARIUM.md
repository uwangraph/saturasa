# Glosarium SatuRasa

**Versi:** 1.0  
**Tanggal:** 15 Juni 2026

Dokumen ini berisi definisi istilah-istilah yang digunakan dalam pengembangan dan penggunaan SatuRasa.

---

## A

| Istilah | Definisi |
|---------|----------|
| **Antrean (Queue)** | Daftar lagu yang sudah ditambahkan dan akan diputar secara berurutan setelah lagu saat ini selesai. |
| **Auto-reconnect** | Mekanisme otomatis di mana klien yang terputus dari WebSocket akan mencoba menyambung kembali setiap beberapa detik. |

## B

| Istilah | Definisi |
|---------|----------|
| **Beranda (Home)** | Halaman utama SatuRasa yang berisi tombol buat ruang, form gabung ruang, dan daftar ruang publik. |
| **Broadcast** | Proses mengirimkan pesan atau event dari server ke semua klien yang terhubung dalam satu ruang yang sama. |

## C

| Istilah | Definisi |
|---------|----------|
| **Chat** | Fitur pesan teks real-time yang memungkinkan peserta ruang berkomunikasi satu sama lain. |
| **Client** | Perangkat pengguna (browser) yang terhubung ke server SatuRasa. |
| **Co-host** | Role dengan hak moderator, dapat membantu host mengelola ruang (menghapus pesan, mengatur antrean, dll). Belum diimplementasikan di MVP, akan hadir di V1.2. |
| **Copy Link** | Fitur untuk menyalin tautan ruang ke clipboard pengguna. |

## D

| Istilah | Definisi |
|---------|----------|
| **D1** | Database SQLite milik Cloudflare yang digunakan untuk menyimpan data ruang (metadata, ruang publik, dll). |
| **Durable Objects** | Fitur Cloudflare Workers yang menyediakan koordinasi real-time dengan WebSocket. Digunakan untuk menjaga state ruang dan sinkronisasi antar peserta. |

## E

| Istilah | Definisi |
|---------|----------|
| **Emoji Reaction** | Fitur yang memungkinkan peserta memberikan reaksi emoji (seperti ❤️, 🔥, 👍) terhadap lagu yang sedang diputar. |
| **Event** | Aksi atau kejadian yang terjadi (misal: play, pause, join, leave) yang dikirimkan melalui WebSocket. |

## F

| Istilah | Definisi |
|---------|----------|
| **Fallback** | Mekanisme cadangan ketika fitur utama tidak tersedia (misal: jika WebSocket tidak support, fallback ke polling). |

## G

| Istilah | Definisi |
|---------|----------|
| **Global Control** | Kemampuan di mana kontrol seperti play, pause, skip, dan volume dari satu perangkat dapat memengaruhi semua perangkat yang terhubung ke ruang yang sama. |
| **Global Pause** | Fitur pause yang memengaruhi semua peserta, berguna untuk mengumumkan sesuatu dalam rapat atau acara. |

## H

| Istilah | Definisi |
|---------|----------|
| **History (Riwayat Lagu)** | Daftar lagu yang sudah diputar sebelumnya dalam suatu ruang. Fitur ini direncanakan untuk V1.2. |
| **Host** | Role dengan hak penuh atas ruang. Host adalah pembuat ruang dan dapat melakukan semua tindakan termasuk transfer host, ganti mode chat, dan hapus ruang. |

## I

| Istilah | Definisi |
|---------|----------|
| **Invite Message** | Pesan siap pakai yang dapat digunakan pengguna untuk mengajak teman bergabung ke ruang. |

## J

| Istilah | Definisi |
|---------|----------|
| **Join** | Tindakan peserta memasuki ruang yang sudah ada. |

## K

| Istilah | Definisi |
|---------|----------|
| **Karaoke Mode** | Fitur yang menampilkan lirik lagu secara bergulir saat lagu diputar. Direncanakan untuk V2.0. |
| **Kode Ruang (Room Code)** | Pengenal unik untuk setiap ruang, terdiri dari 6 karakter acak (huruf besar + angka). Contoh: `A3F7K9`. |
| **Kontrol Musik** | Tindakan yang memengaruhi pemutaran lagu: play, pause, skip, seek (lompat waktu), dan volume. |

## L

| Istilah | Definisi |
|---------|----------|
| **Latency (Latensi)** | Waktu tunda antara aksi dilakukan oleh satu peserta hingga aksi tersebut diterima oleh peserta lain. Target < 500 ms. |
| **Listener Only** | Role yang hanya dapat mendengarkan musik dan mengirim chat, tetapi tidak dapat melakukan kontrol musik (play/pause/skip/tambah lagu). |
| **LocalStorage** | Penyimpanan lokal di browser yang digunakan untuk menyimpan nama pengguna agar tidak perlu diinput ulang setiap kali. |

## M

| Istilah | Definisi |
|---------|----------|
| **Member** | Role standar yang dapat melakukan kontrol musik (play/pause/skip/tambah lagu) dan mengirim chat. |
| **Moderasi** | Kemampuan host atau co-host untuk menghapus pesan chat yang tidak pantas atau membatasi pengguna. |
| **MVP (Minimum Viable Product)** | Versi pertama produk dengan fitur minimum yang diperlukan untuk dapat diluncurkan dan diuji oleh pengguna awal. |

## N

| Istilah | Definisi |
|---------|----------|
| **Native Share API** | API browser yang memungkinkan aplikasi web menggunakan dialog share bawaan sistem operasi (seperti di HP Android/iOS). |
| **Notifikasi Sistem** | Pesan otomatis yang muncul di chat untuk memberi tahu kejadian seperti peserta join/leave atau lagu ditambahkan. |

## P

| Istilah | Definisi |
|---------|----------|
| **Participant (Peserta)** | Setiap pengguna yang terhubung ke suatu ruang, baik sebagai host, member, maupun listener. |
| **Persistent Storage** | Penyimpanan data Durable Objects yang bertahan meskipun instance Durable Object dimatikan. |
| **Play History** | Lihat **History**. |
| **PRD (Product Requirements Document)** | Dokumen yang mendefinisikan fitur, fungsi, dan spesifikasi teknis suatu produk. |
| **Private Listening Mode** | Mode di mana pengguna dapat sementara keluar dari sinkronisasi untuk mendengarkan lagu lain sendiri tanpa mengganggu ruang. Direncanakan untuk V2.0. |

## Q

| Istilah | Definisi |
|---------|----------|
| **QR Code (Quick Response Code)** | Kode matriks dua dimensi yang dapat di-scan kamera HP untuk langsung membuka tautan ruang tanpa mengetik kode manual. |
| **Queue** | Lihat **Antrean**. |

## R

| Istilah | Definisi |
|---------|----------|
| **Real-time** | Kondisi di mana data atau event dikirim dan diterima hampir tanpa jeda (latensi rendah). |
| **Reorder** | Kemampuan mengubah urutan lagu di dalam antrean. |
| **Role (Peran)** | Tingkat hak akses yang dimiliki peserta dalam suatu ruang. Terdiri dari: Host, Co-host, Member, Listener Only. |
| **Ruang (Room)** | Entitas virtual tempat berkumpulnya peserta untuk mendengarkan musik bersama. Setiap ruang memiliki kode unik, state musik, antrean, dan chat. |
| **Ruang Publik (Public Room)** | Ruang yang muncul di daftar publik dan dapat diikuti oleh siapa saja tanpa perlu diundang khusus. |

## S

| Istilah | Definisi |
|---------|----------|
| **SatuRasa** | Nama produk aplikasi web social music player. Filosofi: "Satu Rasa, Satu Lagu, Dimana Saja". |
| **Seek** | Tindakan melompat ke waktu tertentu dalam suatu lagu. |
| **Share** | Fitur untuk membagikan tautan ruang melalui berbagai aplikasi (WhatsApp, Telegram, dll). |
| **Sinkronisasi (Sync)** | Kondisi di mana semua klien dalam ruang yang sama mendengar lagu pada detik yang sama persis. |
| **Skip** | Tindakan melewati lagu yang sedang diputar dan langsung memutar lagu berikutnya dalam antrean. |
| **State** | Kondisi atau data terkini dari suatu ruang, meliputi lagu sedang diputar, antrean, status play/pause, timestamp, dan peserta. |
| **Svelte 5** | Framework frontend yang digunakan untuk membangun antarmuka SatuRasa. Versi 5 menggunakan fitur "rune" terbaru. |

## T

| Istilah | Definisi |
|---------|----------|
| **Tagline** | Kalimat pendek yang merepresentasikan esensi produk: "Satu Rasa, Satu Lagu, Dimana Saja". |
| **Tailwind CSS** | Framework CSS utility-first yang digunakan untuk styling antarmuka SatuRasa. |
| **Tautan (Link)** | URL yang mengarah langsung ke suatu ruang. Format: `https://satu-rasa.id/ruang/ABC123`. |
| **Timestamp** | Data waktu dalam detik yang menunjukkan posisi lagu saat ini. Digunakan untuk sinkronisasi. |
| **Timer Otomatis** | Fitur yang memungkinkan host mengatur durasi ruang otomatis atau auto-playlist. Direncanakan untuk V2.0. |
| **Titip Lagu** | Fitur di mana peserta mengirim request lagu ke host, dan host yang memutuskan untuk menambahkannya ke antrean atau tidak. Direncanakan untuk V2.0. |
| **Transfer Host** | Tindakan host memberikan peran host kepada member lain, sehingga member tersebut memiliki hak penuh atas ruang. |

## U

| Istilah | Definisi |
|---------|----------|
| **Uptime** | Persentase waktu di mana layanan tersedia dan berfungsi. Target 99.9% untuk SatuRasa. |

## V

| Istilah | Definisi |
|---------|----------|
| **Volume Global** | Fitur di mana perubahan volume dari satu perangkat memengaruhi volume semua perangkat lain dalam ruang yang sama. |
| **Vote Skip** | Mekanisme demokrasi di mana diperlukan sejumlah suara (misal 30% peserta) untuk melakukan skip lagu. Direncanakan untuk V1.1. |

## W

| Istilah | Definisi |
|---------|----------|
| **WebSocket** | Protokol komunikasi real-time dua arah yang digunakan SatuRasa untuk sinkronisasi musik dan chat. |
| **Worker (Cloudflare Workers)** | Platform serverless dari Cloudflare untuk menjalankan kode backend di edge network. |

## Y

| Istilah | Definisi |
|---------|----------|
| **YouTube API** | Antarmuka dari Google untuk mengakses data YouTube, termasuk fitur pencarian video dan mendapatkan informasi lagu. |
| **YouTube IFrame API** | API JavaScript dari YouTube untuk menyematkan dan mengontrol pemutar video YouTube di halaman web. |

## Z

| Istilah | Definisi |
|---------|----------|
| **Zero Account** | Konsep di mana pengguna tidak perlu membuat akun atau login untuk menggunakan layanan. Cukup masukkan nama sekali. |

---

## Singkatan Umum

| Singkatan | Kepanjangan |
|-----------|-------------|
| **API** | Application Programming Interface |
| **CORS** | Cross-Origin Resource Sharing |
| **D1** | Cloudflare D1 Database |
| **D1** | (dibaca "D one") |
| **DO** | Durable Objects |
| **KPI** | Key Performance Indicator |
| **MVP** | Minimum Viable Product |
| **PRD** | Product Requirements Document |
| **QR** | Quick Response |
| **SQL** | Structured Query Language |
| **UI** | User Interface |
| **URL** | Uniform Resource Locator |
| **WS** | WebSocket |
| **WSS** | WebSocket Secure |
| **XSS** | Cross-Site Scripting |

---

**Status:** Glosarium lengkap untuk SatuRasa.
