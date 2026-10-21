export interface GameInstruction {
  objective: string;
  controls: Array<{ key: string; label: string }>;
  proTip: string;
}

export const GAME_INSTRUCTIONS: Record<string, GameInstruction> = {
  'snake-xenzia': {
    objective: 'Makan apel dan tangkap serangga bonus yang berkedip sebelum waktu habis.',
    controls: [
      { key: 'DPad / 2,4,6,8', label: 'Belok Ular 90°' },
      { key: '5 / OK', label: 'Jeda Permainan' },
    ],
    proTip: 'Ular dapat menembus dinding batas dan muncul kembali di sisi seberang layar!',
  },
  'cosmic-impact': {
    objective: 'Terbangkan kapal tempur luar angkasa, basmi gelombang alien, dan kalahkan kapal induk.',
    controls: [
      { key: 'DPad / 2,4,6,8', label: 'Kemudi Pesawat' },
      { key: '5 / OK', label: 'Tembak Laser Plasma' },
      { key: '0 / Space', label: 'Tembak Roket Sekunder' },
    ],
    proTip: 'Simpan roket sekunder untuk menghancurkan formasi alien tebal dan bos kapal induk.',
  },
  'bantumi': {
    objective: 'Kumpulkan biji congklak terbanyak di lumbungmu. Mendukung mode VS AI dan 2 Pemain (Pass & Play)!',
    controls: [
      { key: '1 - 6', label: 'Pilih Lubang Langsung' },
      { key: 'DPad Kiri/Kanan', label: 'Geser Pilihan Lubang' },
      { key: '5 / OK', label: 'Ambil & Bagikan Biji' },
      { key: '* / Tombol Mode', label: 'Ganti Mode (VS AI / 2 Pemain)' },
    ],
    proTip: 'Jika biji terakhir jatuh di lumbungmu, dapat bonus giliran! Di mode 2 Pemain, main bergantian di HP yang sama.',
  },
  'memory-pairs': {
    objective: 'Buka dan cocokkan seluruh pasangan kartu simbol retro sebelum batas waktu habis.',
    controls: [
      { key: 'DPad / 2,4,6,8', label: 'Geser Kursor Kartu' },
      { key: '5 / OK', label: 'Buka Kartu Tertutup' },
    ],
    proTip: 'Ingat posisi kartu yang baru dibuka untuk membuat kombo waktu berturut-turut.',
  },
  'rapid-fall': {
    objective: 'Pertahankan bola di layar, hindari duri atas & bawah, dan raih permata hati.',
    controls: [
      { key: 'DPad Kiri / 4', label: 'Geser Bola Kiri' },
      { key: 'DPad Kanan / 6', label: 'Geser Bola Kanan' },
    ],
    proTip: 'Injak platform pegas (per) untuk melenting tinggi saat duri lantai atas mendekat.',
  },
  'stack-attack': {
    objective: 'Tata peti kargo dermaga yang berjatuhan hingga membentuk satu baris horizontal penuh.',
    controls: [
      { key: 'DPad / 4,6', label: 'Jalan Kiri / Kanan' },
      { key: '2 / Atas', label: 'Panjat Peti Satu Tingkat' },
      { key: '5 / OK', label: 'Dorong Peti Horizontal' },
    ],
    proTip: 'Waspadai bayangan peti di atas—jangan sampai tertimpa peti yang sedang melayang jatuh!',
  },
  'red-bounce': {
    objective: 'Pantulkan bola karet merah melewati seluruh cincin emas untuk membuka pintu portal.',
    controls: [
      { key: 'DPad / 4,6', label: 'Gulingkan Bola Kiri/Kanan' },
      { key: '2 / Atas / OK', label: 'Melompat Tinggi' },
    ],
    proTip: 'Gunakan pelampung air untuk menyeberangi kolam dan hindari jarum duri tajam.',
  },
  'diamond-relic': {
    objective: 'Jelajahi reruntuhan kuil kuno: dorong batu, hindari ular, dan kumpulkan permata kristal.',
    controls: [
      { key: 'DPad / 2,4,6,8', label: 'Jalan & Gali Tanah' },
      { key: '5 / OK', label: 'Aksi Dorong Batu' },
    ],
    proTip: 'Batu besar akan menggelinding jatuh jika tanah di bawahnya digali. Jangan sampai tertindih!',
  },
  'tower-bloxx': {
    objective: 'Lepaskan balok apartemen dari derek berayun dengan presisi untuk membangun menara pencakar langit.',
    controls: [
      { key: '5 / OK / DPad Bawah', label: 'Lepas Tali Derek' },
    ],
    proTip: 'Kombinasi jatuhan "PERFECT!" berturut-turut akan melipatgandakan penghuni apartemen.',
  },
  'neon-breaker': {
    objective: 'Hancurkan seluruh susunan bata neon dengan pantulan bola berkecepatan tinggi.',
    controls: [
      { key: 'DPad Kiri / 4', label: 'Geser Paddle Kiri' },
      { key: 'DPad Kanan / 6', label: 'Geser Paddle Kanan' },
      { key: '5 / OK', label: 'Luncurkan Bola / Tembak Laser' },
    ],
    proTip: 'Tangkap kapsul power-up multi-ball dan laser untuk menghabisi bata tebal seketika.',
  },
  'midnight-8ball': {
    objective: 'Masukkan seluruh bola biliar target ke dalam lubang kantong meja biliar.',
    controls: [
      { key: 'DPad Kiri / Kanan', label: 'Atur Sudut Bidikan' },
      { key: '5 / OK (Tahan & Lepas)', label: 'Isi Tenaga & Pukul Bola' },
    ],
    proTip: 'Perhatikan garis trajektori putus-putus untuk memprediksi arah pantulan bola sasaran.',
  },
  'retro-football-2d': {
    objective: 'Cetak gol kemenangan sebanyak-banyaknya ke gawang lawan dalam duel sepak bola 5v5.',
    controls: [
      { key: 'DPad / 2,4,6,8', label: 'Gerak Menggiring Bola' },
      { key: '5 / OK', label: 'Passing Oper / Tekel Pertahanan' },
      { key: '1 / 7', label: 'Ganti Pemain Terdekat' },
      { key: '0 / Space', label: 'Tendang Shooting Keras' },
      { key: '3', label: 'Sprint Turbo Berlari' },
    ],
    proTip: 'Lakukan passing segitiga cepat untuk mengecoh kiper dan bek lawan.',
  },
  'retro-asphalt-gt': {
    objective: 'Salip semua mobil lalu lintas dan capai garis finis di posisi nomor 1.',
    controls: [
      { key: 'DPad Kiri / Kanan', label: 'Kemudi Belok Mobil' },
      { key: '2 / Atas', label: 'Gas Akselerasi Maju' },
      { key: '0 / OK', label: 'Nyalakan Nitro Booster' },
      { key: '8 / Bawah', label: 'Rem Perlahan' },
    ],
    proTip: 'Aktifkan nitro booster di jalur lurus untuk memacu kecepatan mobil hingga maksimal.',
  },
  'persian-sands': {
    objective: 'Taklukkan rintangan istana kuno, kalahkan prajurit pengawal, dan buka gerbang kerajaan.',
    controls: [
      { key: 'DPad Kiri / Kanan', label: 'Berlari Menjelajah' },
      { key: '2 / Atas', label: 'Lompat & Gelantungan Pilar' },
      { key: '5 / OK', label: 'Tebasan Pedang Pendekar' },
    ],
    proTip: 'Bergelantunglah di tepi tebing untuk menghindari jebakan duri lantai yang mematikan.',
  },
  'galaxy-void': {
    objective: 'Kunci pesawat bajak laut luar angkasa, hancurkan asteroid, dan lakukan lompatan warp.',
    controls: [
      { key: 'DPad / 2,4,6,8', label: 'Navigasi Kokpit 3D' },
      { key: '5 / OK', label: 'Tembak Laser Plasma Ganda' },
      { key: '0', label: 'Luncurkan EMP Homing Missile' },
      { key: '#', label: 'Lompatan Warp Hyperdrive' },
    ],
    proTip: 'Tahan arah bidikan hingga target terkunci merah sebelum menembakkan peluru kendali EMP.',
  },
};

