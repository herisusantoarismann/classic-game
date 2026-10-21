# RetroPocket Arcade - Design System & UI/UX Guidelines

> **Target Aesthetic:** Warm Vintage Tech Hardware & Y2K Web Retro  
> **Key Goal:** Menciptakan nuansa nostalgia hangat, autentik, dan berkarakter (menolak tampilan AI Dark SaaS slop).

---

## 1. Color Palette & Visual Philosophy

Menolak palet *dark-slate AI dashboard* yang dingin. RetroPocket mengadopsi estetika **Warm Vintage Hardware** (ala Game Boy original, casing off-white Nokia, dan situs web game klasik era 2000-an):

### A. Chassis, Surface & Retro Web Palette
* **Page Canvas Background:** `#f0ebe1` (Warm vintage tech parchment dengan micro dot-grid halus)
* **Surface & Cards (MMC Style):** `#fdfbf7` / `#fbf9f4` (Off-white hardware matte)
* **Chassis Bezel & Frames:** `#e2ddd1` / `#ded9cd` (Warna casing konsol klasik)
* **Outline & Borders:** `#1e2229` (Garis tepi tegas 2.5px - 3px bergaya brutalist retro)
* **Brutalist Drop Shadows:** `shadow-[4px_4px_0px_#1e2229]` (Bayangan keras tanpa blur, khas antarmuka retro fisik)

### B. Accent & Vintage Telecom Colors
* **Nokia Telecom Blue:** `#144299` (Warna utama masthead & tab aktif)
* **Arcade Gold / MMC Pins:** `#d4af37` & `#ffd23f` (Pin memori emas MMC & badge high score)
* **Endless Arcade Purple Chip:** `#fae8ff` bg, `#7e22ce` border, `#701a75` text (Badge taktil `∞ ENDLESS` untuk game survival/score-chaser)
* **Keypad Call Green:** `#227a3a` (Tombol panggil & tombol play)
* **Keypad End Red:** `#c0392b` (Tombol akhiri panggilan & reset)

### C. Screen LCD Matrix (Authentic Nokia Monochrome)
* **Screen Background (LCD Light):** `#879571` (Hijau zaitun lumut khas LCD Nokia 3310)
* **Screen Pixels (Active Pixel):** `#142410` (Hitam kehijauan pekat)
* **Dot-Matrix Grid:** Linear gradient 3x3px dengan opacity 9%
* **Glass Lens Reflection:** Gradien pantulan cahaya kaca mika sudut 135 derajat di atas layar LCD

---

## 2. Typography & Retro Micro-details

Sistem tipografi RetroPocket memadukan otentisitas perangkat keras monokrom dengan kenyamanan membaca di layar modern (*Surgical Typography*):

* **Authentic Dot-Matrix Pixel Font (`Silkscreen`, Self-Hosted WOFF2 ~7-8 kB)**:
  - Diterapkan pada elemen bernuansa layar LCD hardware & kontrol taktil:
    - Label tombol keypad (`TactileKey.tsx`: `1-9, *, 0, #`).
    - Nilai skor dan high score (`ScoreDisplay.tsx`: `0000 PTS`).
    - Bilah status operator LCD (`GameStatusBar.tsx`: `RETRO-GSM`, jam, sinyal).
    - Teks laser-etching model monitor (`RetroScreenFrame.tsx`: `MODEL: RETRO-3310`).
    - Marquee Ticker nostalgia di bilah biru atas web.
* **Headings & Keypad Labels**: Monospace tebal / geometric sans-serif (`font-mono`, `font-pixel`, `tracking-wide`)
* **Body Copy & Game Descriptions**: Clean native sans-serif (`system-ui`, `-apple-system`, `font-sans`) demi keterbacaan tinggi tanpa melelahkan mata pemain pada teks narasi panjang.
* **Micro-details Nostalgia:**
  * **Continuous Marquee Ticker**: Teks berjalan di bagian paling atas web berhuruf piksel dot-matrix.
  * **MMC Memory Card Notches**: Detail pin tembaga emas di bagian atas setiap kartu game.
  * **Tribute Badges**: Pengenal era game bergaya stempel tinta jadul.

---

## 3. Mobile-First Responsive Standards (MUTLAK)

RetroPocket Arcade dirancang dengan pendekatan **Mobile First**:
1. **Uncluttered Mobile Header Architecture (< 768px)**:
   - Menghindari penumpukan 5+ tombol pada layar smartphone yang sempit (360px–412px).
   - Di mobile (< 768px), bilah navigasi kanan disederhanakan menjadi **2 tombol sentuh esensial**:
     1. **Instant Mute/Audio Button**: Tombol bujur sangkar taktil 32x32px untuk kontrol suara langsung saat bermain.
     2. **Tombol "OPSI" (`[ ≡ OPSI ]`)**: Tombol taktil bergaya Nokia yang membuka dropdown menu bertingkat (Nokia Series 30 Sheet) berisi akses ke *Pasang Aplikasi PWA*, *Komposer Nada Dering*, *Studio Logo Operator*, dan *Pengaturan Retro*. Dropdown otomatis menutup saat pengguna menyentuh/mengklik area di luar menu (`useRef` + `pointerdown`), mengetuk *global layout backdrop* layar penuh (`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs`), atau menekan tombol `Escape`.
   - Subtitle merek disembunyikan pada viewport mobile (`hidden sm:block`) agar tinggi header tetap ramping (~48px–52px) dan bebas baris bertumpuk.
   - Pada desktop ($\ge$ 768px), seluruh tombol tindakan ditampilkan mendatar secara lengkap dengan teks dan ikon.
2. **Thumb-Zone Friendly**:
   - Tombol softkey, D-Pad, dan Numpad diatur dengan ukuran sentuh ideal (minimal 40px tinggi) dengan jarak rapat yang ergonomis untuk jempol.
   - Menggunakan `touch-action: manipulation` untuk mencegah lag zoom double-tap browser smartphone.

## 4. Tactile Mobile Keypad Specifications

Untuk memastikan sensasi tombol fisik HP jadul terasa nyata di smartphone:

1. **Button Inset States**:
   - `default`: Tombol timbul dengan bayangan ganda `box-shadow: 0 4px 0 #8d8778, 0 5px 0 #1e2229;`
   - `active`: Mengempis ke bawah 3px `transform: translateY(3px); box-shadow: 0 1px 0 #8d8778, 0 2px 0 #1e2229;`
2. **Thumb Ergonomics (Fitts's Law)**:
   - D-Pad diletakkan di tengah area jangkauan jempol.
   - Grid 3x4 tombol angka 1-9, *, 0, # dengan label dwifungsi (angka primer + huruf sekunder).
3. **No Selection & No Tap Delay**:
   ```css
   .tactile-key {
     touch-action: manipulation;
     user-select: none;
     -webkit-user-select: none;
     -webkit-tap-highlight-color: transparent;
   }
   ```

---

## 5. Screen Shaders & CRT/LCD Scanlines

Efek layar LCD jadul diterapkan menggunakan CSS overlay murni di atas Canvas:
* **Monochrome Nokia Mode (Era 1)**:
  - Resolusi 168x112 / 84x48 integer scaled.
  - Lapisan CSS `::after` dengan pattern garis dot-matrix horizontal dan vertikal tipis (opacity 8-12%).
  - Bezel model `NOKIA-3310`, status bar `RETRO-GSM`, dan tema warna LCD (Green / Amber / Gray).
* **Color TFT 65K Mode (Era 2 J2ME & Era 3 Cult 3D)**:
  - Resolusi 176x132 (aspek rasio 4:3 autentik Nokia 6600).
  - Bezel model `MODEL: NOKIA-6600 • COLOR TFT 65K • J2ME`.
  - Status bar operator `TELKOMSEL-GSM`.
  - Grid dot-matrix dimatikan secara otomatis agar grafis warna pixel-art tampil jernih, tajam, dan vibran.
* Lapisan kaca mika transparan dengan pantulan kilau sudut 135 derajat tetap dipertahankan pada kedua mode layar.

---

## 6. Switchable LCD Matrix Themes & Bezel Hardware Controls

Pengguna dapat memilih atmosfer layar favorit baik melalui `SettingsModal` maupun switch langsung di bezel `RetroScreenFrame`:
1. **Nokia Classic Green (`#879571`)**: Panel dot-matrix LCD Nokia 3310 / 1100.
2. **Siemens Amber Orange (`#c87d20`)**: Panel LCD monokrom backlight oranye khas Siemens C45 / M50.
3. **Monochrome Pocket Gray (`#929a9e`)**: Nuansa Game Boy Pocket / PDA awal 2000-an.
* **Quick Bezel LCD Palette Switcher**: Pada bezel atas layar monokrom, terdapat 3 pill button sakelar fisik mikro (`[🟢 NOKIA]`, `[🟠 SIEMENS]`, `[⚪ MONO]`) untuk berganti tema seketika dalam 1 sentuhan disertai efek suara klik sintetis tanpa perlu membuka menu pengaturan. Pengaturan tema otomatis tersinkronisasi dua arah ke `localStorage` dan `SettingsModal`.
* Pada game era berwarna (`color-j2me` / `cult-3d`), switcher otomatis berganti menjadi badge display hardware `[COLOR TFT 65K]`.

---

## 7. Analog LED Power & Status Indicator

Pada sudut kiri atas bezel monitor disematkan lampu indikator LED fisik 4mm dengan ring bezel logam (`border border-[#1e2229]`):
* 🟢 **Phosphor Emerald Green (`#2ecc71`)**: Permainan sedang aktif berjalan normal (60 FPS Ready).
* 🟡 **Warm Amber Pulse (`#ffa502`)**: Mode Jeda / Pause aktif (berkedip lembut).
* 🔴 **Ruby Red Flash (`#ff4757`)**: Game Over / Karakter terkena serangan atau kehilangan nyawa.
* 🔵 **Cyan Blue Pulse (`#00d2d3`)**: Mode demo otomatis (*Attract Mode*).

---

## 8. Nokia Series 30/40 In-Game Pause Menu

Saat game di-pause, layar menampilkan dialog pop-up bertingkat khas ponsel Nokia klasik:
* Header biru Nokia klasik: `★ GAME DIJEDA ★` dengan badge `OPSI`.
* Ticker skor live: Menampilkan `SKOR SAAT INI`.
* 4 Pilihan Menu Taktil:
  1. `[▶ LANJUTKAN]` (Hotkeys: `[1]`, `[ACTION]`, `[OK]`)
  2. `[↺ ULANG PERMAINAN]` (Hotkey: `[2]`)
  3. `[★ PAMERKAN REKOR]` (Hotkey: `[3]`)
  4. `[✕ KELUAR KE KATALOG]` (Hotkey: `[4]`, `[SOFT_RIGHT]`)
* Sentuhan di luar area dialog atau penekanan tombol arah langsung melanjutkan permainan secara responsif.

---

## 9. Nostalgic Collector Card Specifications

Kartu gamifikasi progres nostalgia di halaman katalog mengusung estetika **Kartu Memori MMC Album 64KB**:
* **Border & Chassis**: `#fdfbf7` dengan outline tegas `#1e2229` dan bayangan brutalist `shadow-[4px_4px_0px_#1e2229]`.
* **MMC Gold Connector Pins**: 6 pin tembaga emas berderet (`#d4af37`) dengan serial `MMC-ALBUM • 64KB MEMORY`.
* **Tiered Gelar Kejuaraan Nostalgia**:
  * 0 Game: `🏷️ Calon Pembeli Perdana`
  * 1–4 Game: `📟 Pengguna Wartel Pemula`
  * 5–9 Game: `🔋 Pelanggan Setia SMS & Snake`
  * 10–14 Game: `🕹️ Penguasa Java J2ME 2004`
  * 15 Game (100%): `👑 Legenda Master RetroPocket`
* **Metrik & LCD Progress Bar**:
  * Menggunakan bar persentase hijau Nokia dot-matrix (`#227a3a`) di atas recessed well `#d5cfc2`.

---

## 10. Mobile Focus / Handheld Console Mode (`⛶`)

Dirancang untuk smartphone berlayar kompak (360px–412px) guna mengatasi keterbatasan ruang vertikal browser mobile:
* **Viewport Lockdown**: `fixed inset-0 z-50 bg-[#e7e1d5] flex flex-col justify-between items-center p-2 touch-none overflow-hidden`.
* **Zero-Scroll Ergonomics**:
  * Layar LCD (`RetroScreenFrame`) dibatasi pada `max-h-[44dvh]` dan dipusatkan di panggung tengah.
  * Keypad taktil (`VirtualKeypad`) menempel di dasar viewport, tepat berada di area sentuh kedua jempol.
  * Navigasi atas diminimalisasi menjadi 1 baris ramping dengan tombol `[✕ KELUAR FOKUS]`, judul game, dan tombol jeda/pamer cepat.
* **Integrasi Native Fullscreen**:
  * Mengaktifkan `requestFullscreen()` otomatis saat didukung peramban.
  * Mengembalikan tata letak standar secara mulus tanpa mengganggu siklus hidup canvas rendering loop.

---

## 11. 10-Stage Progression & Difficulty Scaling Spec

Seluruh 15 game mengintegrasikan sistem kenaikan tingkat kesulitan bertingkat 10 Stage (`STAGE 1/10` hingga `STAGE 10/10`):
* **HUD Dot-Matrix Indicator**:
  * Format teks retro monospaced: `STG X/10` atau `S X/10` terpasang rapi pada status bar canvas masing-masing game.
  * Penempatan presisi tanpa tumpang tindih dengan HP, Skor, atau indikator waktu.
* **Audio Feedback Fanfare**:
  * Nada sintetis Web Audio API `playPowerup()` dibunyikan seketika saat pemain berhasil menyelesaikan stage dan berpindah ke stage berikutnya.
* **Gradual Difficulty Curve**:
  * **Stage 1–2**: Ramah pemula, kecepatan rendah, sedikit rintangan, durasi waktu longgar.
  * **Stage 3–5**: Menengah, rintangan mulai bervariasi (kobra, bata lapis baja, platform bergerak, AI lawan lebih agresif).
  * **Stage 6–8**: Sulit, kombinasi rintangan aktif, waktu/gerakan lebih ketat, kecepatan meningkat secara terukur.
  * **Stage 9–10**: Puncak / Boss / Final Stage, tantangan maksimal yang tetap adil (*fair play*), menampilkan status Victory / Tamat saat Stage 10 selesai.
* **Anti-Tunneling Physics Clamping**:
  * Batas atas kecepatan pada stage tinggi selalu dibatasi (*clamped*) untuk memastikan tidak ada objek yang menembus pembatas (zero physics tunneling) saat terjadi frame lag spike.
* **Reset Cleanliness**:
  * `game.reset()` selalu mengembalikan `currentStage` dan seluruh variabel kesulitan kembali ke Stage 1 secara bersih.

---

## 12. Master Brand Logo & App Icon Architecture (Anti-AI Slop)

Emblem utama **RetroPocket Arcade** dirancang dengan filosofi keahlian tangan (*humanized craftsmanship*), menolak template AI slop (gradien ungu neon generik atau ikon stik konsol modern yang tidak relevan):

### A. Konsep Simbol: "The Pocket Matrix & Snake Loop Monogram"
1. **Siluet Konsol Saku 2.5D**:
   - Memadukan bentuk *squircle* cangkang Nokia 3310 / Siemens C45 yang kokoh dengan bevel berarsir logam (`#144299` Cobalt Blue, `#f0ebe1` Putty Faceplate, dan garis tinta tebal `#1e2229`).
2. **Hero Pixel Emblem "R" Monogram**:
   - Tersemat di dalam jendela layar LCD hijau zaitun Nokia 3310 (`#879571`).
   - Tersusun dari grid dot-matrix piksel murni (`#142410`).
   - Berupa *double-entendre visual*: Pada pandangan awal tampak sebagai huruf **"R"** kapital tebal (*RetroPocket*), dan pada pandangan mendalam tampak sebagai **Ular Snake Xenzia** yang sedang berputar meliuk mengejar titik apel bonus legendaris!
3. **Detail Hardware Asli**:
   - *Top Earpiece Grill*: 3 celah speaker oval horizontal khas HP monokrom.
   - *Status LED*: Dioda daya mikro phosphor green (`#2ecc71`) 4mm di sudut atas.
   - *Keypad Architecture*: Sepasang softkey taktil mendatar (`#ded9cd`) dan tombol D-pad *Navi-Key* dengan titik tengah timbul warna emas amber (`#ffd23f`).
   - *MMC Connector Pins*: 5 pin konektor kartu memori berlapis emas (`#d4af37`) di bibir bawah casing.

### B. Matriks Ukuran & Resolusi Distribusi Aset
* **Vector Master (Scalable)**: [`public/icon.svg`](file:///c:/Project/classic_game/public/icon.svg) (512x512 Master Emblem).
* **Micro Favicon (16px–48px)**: [`public/favicon.svg`](file:///c:/Project/classic_game/public/favicon.svg) (Versi optik high-contrast, tajam pada tab browser).
* **PWA Launcher Icons**: [`public/icon-512.png`](file:///c:/Project/classic_game/public/icon-512.png) (512x512 maskable) & [`public/icon-192.png`](file:///c:/Project/classic_game/public/icon-192.png) (192x192 homescreen).
* **React Native Atom**: [`src/components/atoms/RetroPocketLogo.tsx`](file:///c:/Project/classic_game/src/components/atoms/RetroPocketLogo.tsx) (Tersedia dalam ukuran `xs`, `sm`, `md`, `lg`, `xl` dengan drop shadow brutalist).

