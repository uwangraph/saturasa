<script>
  import { currentPage } from '../lib/utils/router.js';

  const features = [
    { icon: '🎵', title: 'Sinkronisasi Musik', desc: 'Semua orang di ruang yang sama mendengar musik pada detik yang persis sama.' },
    { icon: '💬', title: 'Chat Real-time', desc: 'Ngobrol dengan peserta lain saat mendengarkan musik bersama.' },
    { icon: '👥', title: 'Multiplayer', desc: 'Buat ruang dan ajak teman — tidak perlu akun, cukup nama.' },
    { icon: '🎛️', title: 'Kontrol Musik', desc: 'Play, pause, skip, seek, dan volume dari satu pengontrol untuk semua.' },
    { icon: '📱', title: 'QR Code & Share', desc: 'Bagikan ruangan via QR code, link, atau native share.' },
    { icon: '🔒', title: 'Role System', desc: 'Host, Member, dan Listener — hak akses yang berbeda per role.' }
  ];

  const steps = [
    { step: '1', title: 'Masukkan Nama', desc: 'Tulis nama panggilanmu. Tidak perlu daftar atau login.' },
    { step: '2', title: 'Buat atau Gabung Ruang', desc: 'Buat ruang baru atau masukkan kode ruang.' },
    { step: '3', title: 'Tambah Musik', desc: 'Cari lagu via YouTube dan tambahkan ke antrean.' },
    { step: '4', title: 'Dengarkan Bareng!', desc: 'Semua di ruang yang sama mendengar musik secara sinkron.' }
  ];
</script>

<div class="min-h-screen pt-20 pb-12 px-4">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-16">
      <h1 class="font-display text-4xl md:text-5xl font-bold text-white mb-4">
        Tentang <span class="text-primary-400">SatuRasa</span>
      </h1>
      <p class="text-xl text-dark-300 max-w-2xl mx-auto">
        SatuRasa adalah social music player yang memungkinkan kamu dan teman-teman mendengarkan musik YouTube secara sinkron, tanpa perlu akun.
      </p>
    </div>

    <!-- Features -->
    <section class="mb-16">
      <h2 class="font-display text-2xl font-bold text-white mb-8 text-center">Fitur Utama</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each features as f}
          <div class="card p-6 hover:border-primary-500/30 transition-all">
            <div class="text-3xl mb-3">{f.icon}</div>
            <h3 class="font-semibold text-white mb-2">{f.title}</h3>
            <p class="text-sm text-dark-400">{f.desc}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- How it works -->
    <section class="mb-16">
      <h2 class="font-display text-2xl font-bold text-white mb-8 text-center">Cara Pakai</h2>
      <div class="space-y-4">
        {#each steps as s}
          <div class="card p-5 flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center font-display font-bold text-lg shrink-0">
              {s.step}
            </div>
            <div>
              <h3 class="font-semibold text-white">{s.title}</h3>
              <p class="text-sm text-dark-400">{s.desc}</p>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Tech stack -->
    <section class="mb-16">
      <h2 class="font-display text-2xl font-bold text-white mb-8 text-center">Tech Stack</h2>
      <div class="card p-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div class="text-2xl mb-2">⚡</div>
            <div class="font-semibold text-white text-sm">Svelte 5</div>
            <div class="text-xs text-dark-500">Frontend</div>
          </div>
          <div>
            <div class="text-2xl mb-2">☁️</div>
            <div class="font-semibold text-white text-sm">Cloudflare Workers</div>
            <div class="text-xs text-dark-500">Backend</div>
          </div>
          <div>
            <div class="text-2xl mb-2">🗄️</div>
            <div class="font-semibold text-white text-sm">D1 + Durable Objects</div>
            <div class="text-xs text-dark-500">Database & WS</div>
          </div>
          <div>
            <div class="text-2xl mb-2">🎨</div>
            <div class="font-semibold text-white text-sm">Tailwind CSS</div>
            <div class="text-xs text-dark-500">Styling</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="text-center">
      <div class="card p-8 bg-gradient-to-br from-primary-500/10 to-primary-700/10 border-primary-500/20">
        <h2 class="font-display text-2xl font-bold text-white mb-3">
          Siap Mendengarkan Bersama?
        </h2>
        <p class="text-dark-300 mb-6">
          Buat ruang sekarang dan ajak teman-temanmu!
        </p>
        <button
          onclick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          class="btn-primary text-lg"
        >
          🚀 Mulai Sekarang
        </button>
      </div>
    </section>
  </div>
</div>
