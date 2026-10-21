# RetroPocket Arcade - AI Context & Engineering Standards

> **Document Type:** Project Context, Atomic Architecture & Engineering Standards  
> **Last Updated:** October 2026  
> **Repository:** `c:\Project\classic_game`

---

## 1. Project Vision & Anti-AI Slop Manifesto

**RetroPocket Arcade** adalah platform web modern berstandar tinggi untuk merekreasi game-game HP klasik era monokrom dan awal polifonik (Nokia 3310/1100, Siemens C45, Sony Ericsson, Nokia 6600 "Sabun", N-Gage, Java J2ME).

### 🛡️ Standar "Anti-AI Slop" & Humanized Craftsmanship (MUTLAK):
1. **No AI Slop in Code**:
   - Dilarang membuat kode *bloated*, fungsi serba generic yang tidak berguna, atau abstraksi prematur berlapis-lapis.
   - Setiap fungsi, variabel, dan struktur state harus memiliki tujuan spesifik, ringkas, terbaca oleh manusia (*clean, intentional, human-crafted*).
   - Setiap selesai menulis/mengedit kode: **wajib recheck secara kritis**, bersihkan kode sisa/mati, dan pastikan tidak ada komentar basa-basi AI.
2. **No AI Slop in Design**:
   - Dilarang membuat UI bergaya template AI murahan (dark SaaS dashboard generik, gradien ungu neon, spacing kaku).
   - Estetika: **Warm Vintage Tech Hardware & Y2K Web Retro**. Menolak tampilan AI dark SaaS. Menggunakan warna casing hardware klasik hangat (`#f0ebe1`, `#e2ddd1`), aksen biru Nokia klasik (`#144299`), kartu game bergaya MMC Memory Card bertatahkan pin emas, grid LCD dot-matrix hijau zaitun presisi, dan animasi sentuhan keypad yang memuaskan (*tactile micro-interactions*).
3. **No Clunky Skeuomorphism**:
   - Tidak menggunakan gambar casing foto HP Nokia 3310 yang gepeng/distorsi.
   - Layar game dan keypad dibuat menggunakan komponen web native modern yang nyaman disentuh jempol di HP dan responsif di desktop.
4. **Mobile-First Priority (MUTLAK)**:
   - Seluruh antarmuka dirancang dan diuji pada resolusi smartphone terlebih dahulu (< 768px). Tombol memiliki target sentuh yang nyaman, tidak ada teks tombol yang bertumpuk/terpotong di viewport kecil, dan tidak menampilkan elemen artifisial yang tidak penting (seperti visitor counter statis atau teks FPS teknis).

---

## 2. Definisi Hukum & Status Copyright Game

Semua 15 game legendaris yang disebutkan oleh pengguna **BISA DAN DISETUJUI UNTUK DIBUATKAN REMAKE**, dengan ketentuan hukum hak cipta yang ketat:

| Judul Asli & Pemilik | Status Hak Cipta | Nama Aman di RetroPocket | Strategi Clean-Room Remake |
| :--- | :--- | :--- | :--- |
| **Snake Xenzia / II** (Nokia) | Mekanik aman. Nama "Snake Xenzia" trademark. | **Retro Snake** *(Tribute to Snake Xenzia)* | Grid 2D murni, ular bertambah panjang, serangga bonus berkedip. |
| **Space Impact** (Nokia) | Mekanik aman. Nama trademark. | **Cosmic Impact** *(Tribute to Space Impact)* | Horizontal scrolling shooter, roket sekunder, boss alien. |
| **Bantumi** (Nokia) | **100% Public Domain** (Congklak / Mancala kuno). | **Bantumi (Mancala)** | Logika biji congklak tradisional, AI lawan sederhana. |
| **Pairs / Memory** (Nokia) | **100% Public Domain** (Pola buka tutup kartu). | **Memory Pairs** | Grid kartu simbol retro, timer, skor percobaan. |
| **Rapid Roll** (Nokia) | Mekanik aman. Nama umum. | **Rapid Fall** *(Tribute to Rapid Roll)* | Platform scrolling ke atas, bola jatuh gravitasi, duri. |
| **Stack Attack** (Siemens) | Mekanik aman. Nama trademark. | **Stack Attack** *(Warehouse Crate Puzzle)* | Karakter kuli geser peti jatuh, tumpuk horizontal. |
| **Bounce / Bounce Tales** (Rovio/Nokia) | Mekanik aman. Nama trademark. | **Red Bounce** *(Tribute to Bounce)* | Fisika bola membal, lewati cincin, hindari duri. |
| **Diamond Rush** (Gameloft) | Mekanik puzzle aman. Aset & cerita IP Gameloft. | **Diamond Relic** *(Archaeology Puzzle)* | Dorong batu, ular pelindung, kumpulkan permata. |
| **Tower Bloxx** (Digital Chocolate) | Mekanik ayunan derek aman. Nama trademark. | **Tower Bloxx** *(Skyscraper Stacker)* | Tali derek berayun, jatuhkan lantai gedung, kombo presisi. |
| **Block Breaker Deluxe** (Gameloft) | Mekanik Breakout umum sejak 1976. | **Neon Breaker** *(Deluxe Arkanoid)* | Dayung bola, hancurkan bata neon, kumpulkan power-up. |
| **Midnight Pool** (Gameloft) | Aturan 8-Ball biliar adalah public domain. | **Midnight 8-Ball** *(Retro Billiards)* | Sudut bidik garis putus-putus, power bar cue stick. |
| **Real Football / PES J2ME** | Nama lisensi pemain & klub milik FIFA/Konami. | **Retro Football 2D** *(Java J2ME Cup)* | Tim fiktif retro, passing `5`, shooting `0`, sprint `3`. |
| **Asphalt: Urban GT** (Gameloft) | Merek mobil asli berlisensi. Nama Asphalt IP. | **Retro Asphalt GT** *(Pseudo-3D Racer)* | Balapan jalan raya retro, jalur melengkung, nitro booster. |
| **Prince of Persia** (Ubisoft/Mechner) | IP cerita & karakter milik Ubisoft. | **Persian Sands** *(Acrobatic Platformer)* | Lompat celah, gelantungan di tepi jurang, pedang. |
| **Galaxy on Fire** (Fishlabs) | Cerita & aset 3D milik Fishlabs. | **Galaxy Void** *(3D Space Combat)* | Dogfight kokpit luar angkasa, bidikan laser, warp drive. |

*Aturan Legalitas: Semua kode, sprite pixel, dan efek suara dibuat 100% clean-room (Web Audio API synth + canvas rendering) tanpa me-rip file biner atau ROM asli.*

---

## 3. Atomic Design Folder Structure

Seluruh komponen UI disusun mengikuti metodologi **Atomic Design** yang ketat:

```
c:\Project\classic_game\
├── AGENTS.md                          # Dokumen context AI ini
├── docs\
│   ├── ARCHITECTURE.md                # Arsitektur sistem & Engine Contract
│   ├── DESIGN_SYSTEM.md               # Design tokens, LCD Matrix, Keypad spec
│   └── ROADMAP.md                     # Roadmap implementasi 15 game
├── src\
│   ├── assets\                        # Font retro & vector favicon
│   ├── components\
│   │   ├── atoms\                     # Komponen UI paling dasar (independen)
│   │   │   ├── Button.tsx             # Button dasar bergaya retro
│   │   │   ├── TactileKey.tsx         # Tombol keypad dengan efek timbul/cekung + haptic
│   │   │   ├── LcdScreenGlow.tsx      # Overlay scanline & dot-matrix LCD
│   │   │   ├── RetroBadge.tsx         # Tag era ("Monochrome 1999", "J2ME 2004")
│   │   │   ├── SignalIndicator.tsx    # Sinyal 4-baris Nokia
│   │   │   └── BatteryIndicator.tsx   # Baterai 3-kotak Nokia
│   │   ├── molecules\                 # Gabungan atom yang memiliki fungsi spesifik
│   │   │   ├── DPad.tsx               # Pad navigasi arah (Atas, Bawah, Kiri, Kanan, OK)
│   │   │   ├── NumpadGrid.tsx         # Grid 3x4 tombol angka 1-9, *, 0, #
│   │   │   ├── GameStatusBar.tsx      # Baris atas layar (Waktu, Sinyal, Baterai)
│   │   │   ├── ScoreDisplay.tsx       # Tampilan skor retro dengan font monospace
│   │   │   └── GameCard.tsx           # Kartu katalog game dengan thumbnail pixel
│   │   ├── organisms\                 # Komponen kompleks gabungan molekul
│   │   │   ├── VirtualKeypad.tsx      # Keypad mobile utuh (Softkeys + DPad + Numpad)
│   │   │   ├── RetroScreenFrame.tsx   # Frame LCD monitor dengan Canvas 2D + filter
│   │   │   ├── CatalogGrid.tsx        # Grid kartu game + filter tabs
│   │   │   ├── DesktopControlsBox.tsx # Panduan keyboard fisik untuk pengguna desktop
│   │   │   └── SettingsModal.tsx      # Pengaturan sound, haptics, dan tema LCD
│   │   ├── templates\                 # Kerangka layout responsif tanpa data game spesifik
│   │   │   ├── MainLayout.tsx         # Shell umum dengan retro header & footer
│   │   │   ├── CatalogTemplate.tsx    # Layout khusus halaman katalog
│   │   │   └── GameRoomTemplate.tsx   # Layout khusus arena bermain (Screen + Keypad)
│   │   └── pages\                     # Halaman view konkret yang dikonsumsi router
│   │       ├── CatalogPage.tsx        # Halaman Beranda (Daftar Game)
│   │       └── GamePlayPage.tsx       # Halaman Game aktif
│   ├── core\
│   │   ├── engine\                    # Game loop, base contracts, math/physics helpers
│   │   │   ├── BaseGame.ts            # Interface standar BaseGame
│   │   │   ├── GameEngine.ts          # requestAnimationFrame wrapper yang presisi
│   │   │   └── types.ts               # Global action & input types
│   │   ├── audio\
│   │   │   └── RetroAudioSynth.ts     # Synthesizer 8-bit (Web Audio API)
│   │   ├── input\
│   │   │   └── UnifiedInputManager.ts # Penggabung keyboard fisik + tombol virtual
│   │   └── storage\
│   │       └── HighScoreManager.ts    # Penyimpan skor lokal & riwayat per game
│   ├── games\                         # Modul logika permainan individual
│   │   ├── snake\                     # Retro Snake (Xenzia)
│   │   ├── space-impact\              # Cosmic Impact
│   │   ├── rapid-roll\                # Rapid Fall
│   │   ├── bantumi\                   # Bantumi Congklak
│   │   ├── bounce\                    # Red Bounce
│   │   └── ...                        # Game era berikutnya
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
```

---

## 4. Game Engine Contract (`BaseGame`)

Semua game **wajib** mengikuti interface ini agar dapat dimasukkan ke dalam `RetroScreenFrame`:

```typescript
export type InputAction = 
  | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' 
  | 'ACTION' 
  | 'SOFT_LEFT' | 'SOFT_RIGHT' 
  | 'NUM_1' | 'NUM_2' | 'NUM_3' 
  | 'NUM_4' | 'NUM_5' | 'NUM_6' 
  | 'NUM_7' | 'NUM_8' | 'NUM_9' 
  | 'NUM_STAR' | 'NUM_0' | 'NUM_HASH';

export interface GameCallbacks {
  onScoreChange?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

export interface BaseGame {
  readonly id: string;
  readonly title: string;
  readonly tributeTo: string;
  readonly era: 'monochrome' | 'color-j2me' | 'cult-3d';
  readonly canvasSize: { width: number; height: number };

  init(
    canvas: HTMLCanvasElement,
    audio: RetroAudioSynth,
    callbacks?: GameCallbacks
  ): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  handleInput(action: InputAction): void;
  reset(): void;
  destroy(): void;
}
```

---

## 5. Prosedur Recheck Mandiri Setiap Menulis Kode
Setiap agent atau developer yang mengedit kode di repositori ini harus:
1. Menghindari library bloated pihak ketiga jika bisa diselesaikan dengan 20 baris vanilla TypeScript.
2. Memastikan `tsc -b` lulus tanpa error atau warning `any`.
3. Memeriksa responsivitas di resolusi mobile (< 768px) dan desktop (> 1024px).
4. Memastikan audio sintetis tidak mengalami *clipping / popping* menggunakan gain envelope yang halus.
5. **Wajib sinkronkan dokumen di `docs/` (`ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`) setiap kali ada penambahan fitur, perubahan interface, atau progress game baru.**

