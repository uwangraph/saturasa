<script>
  import { onMount } from 'svelte';
  import { getRoomUrl, inviteMessage, copyToClipboard } from '../utils/helpers.js';
  import { toast } from '../stores/toast.js';

  export let roomCode = '';

  let qrDataUrl = '';
  let roomUrl = '';
  $: isRandomCode = /^[A-Z0-9]{6}$/.test(roomCode);

  onMount(async () => {
    roomUrl = getRoomUrl(roomCode);
    // Generate QR code
    try {
      const QRCode = await import('qrcode');
      qrDataUrl = await QRCode.toDataURL(roomUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#d946ef', light: '#020617' }
      });
    } catch (e) {
      // QR generation failed
    }
  });

  async function copyLink() {
    const ok = await copyToClipboard(roomUrl);
    if (ok) toast.success('Link berhasil disalin!');
  }

  async function copyInvite() {
    const ok = await copyToClipboard(inviteMessage(roomCode));
    if (ok) toast.success('Pesan undangan berhasil disalin!');
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SatuRasa — Ayo dengerin musik bareng!',
          text: inviteMessage(roomCode),
          url: roomUrl
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      copyInvite();
    }
  }
</script>

<div class="space-y-4">
  <!-- QR Code -->
  {#if qrDataUrl}
    <div class="text-center">
      <p class="text-sm text-dark-300 mb-3">Scan untuk gabung</p>
      <img src={qrDataUrl} alt="QR Code" class="mx-auto rounded-xl" />
    </div>
  {/if}

  <!-- Room code/name -->
  <div class="text-center">
    <p class="text-xs text-dark-400 mb-1">{isRandomCode ? 'Kode Ruang' : 'Nama Ruang'}</p>
    <p class="font-mono text-2xl font-bold text-white" class:tracking-[0.3em]={isRandomCode}>{roomCode}</p>
  </div>

  <!-- Link -->
  <div class="flex gap-2">
    <input
      type="text"
      value={roomUrl}
      readonly
      class="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-dark-300 truncate"
    />
    <button onclick={copyLink} class="btn-secondary text-sm px-3">
      Salin
    </button>
  </div>

  <!-- Share buttons -->
  <div class="grid grid-cols-2 gap-2">
    <button onclick={copyInvite} class="btn-secondary text-sm py-2">
      📋 Salin Undangan
    </button>
    <button onclick={nativeShare} class="btn-primary text-sm py-2">
      📱 Share
    </button>
  </div>
</div>
