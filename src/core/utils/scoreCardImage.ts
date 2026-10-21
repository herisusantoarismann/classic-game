/**
 * scoreCardImage.ts
 * Generates high-definition retro score ticket/cartridge images (600x600 px)
 * using HTML5 Canvas 2D for social media sharing (Instagram Story, WhatsApp Status, X).
 */

export interface ScoreCardOptions {
  gameId: string;
  gameTitle: string;
  tributeTo: string;
  era: string;
  score: number;
  challengeUrl: string;
}

export function getGameRankTitle(gameId: string, score: number): string {
  switch (gameId) {
    case 'snake-xenzia':
      if (score >= 400) return '👑 Master Pawang Ular';
      if (score >= 200) return '🐍 Penjinak Piton Senior';
      if (score >= 100) return '⚡ Ular Belok Lincah';
      return '🍎 Pawang Pemula';

    case 'rapid-fall':
      if (score >= 300) return '⚡ Dewa Gravitasi';
      if (score >= 150) return '🤹 Akrobat Anti-Duri';
      if (score >= 80) return '🪂 Peloncat Lincah';
      return '🎈 Penerjun Pemula';

    case 'tower-bloxx':
      if (score >= 400) return '🏙️ Arsitek Megapolitan';
      if (score >= 200) return '🏗️ Mandor Derek Presisi';
      if (score >= 100) return '📐 Arsitek Pemula';
      return '🧱 Tukang Batu Magang';

    case 'retro-asphalt-gt':
      if (score >= 5000) return '🏁 Raja Aspal Urban GT';
      if (score >= 2000) return '🏎️ Pembalap Liar Malam';
      if (score >= 1000) return '💨 Pengendara Nitro';
      return '🚗 Supir Pemula';

    case 'stack-attack':
      if (score >= 400) return '📦 Manajer Gudang Legendaris';
      if (score >= 200) return '🏗️ Penata Peti Gesit';
      return '👷 Kuli Dermaga Tangguh';

    case 'cosmic-impact':
      if (score >= 300) return '🚀 Panglima Antariksa';
      if (score >= 150) return '🛸 Pilot Tempur Alien';
      return '⭐ Kadet Luar Angkasa';

    case 'galaxy-void':
      if (score >= 500) return '🌌 Ace Pilot Galaksi';
      if (score >= 250) return '🛰️ Penjelajah Lubang Cacing';
      return '🌠 Penembak Laser';

    case 'neon-breaker':
      if (score >= 1000) return '💥 Penghancur Bata Neon';
      if (score >= 500) return '🏓 Ahli Pantulan Sudut';
      return '✨ Pemain Breaker';

    case 'midnight-8ball':
      if (score >= 100) return '🎱 Master Meja Biliar';
      return '🍸 Pemain Bar Santai';

    case 'retro-football-2d':
      if (score >= 500) return '⚽ Juara Piala Dunia J2ME';
      return '🥅 Striker Liga Mini';

    case 'bantumi':
      if (score >= 30) return '🐚 Sultan Congklak Nusantara';
      return '🌾 Pemain Congklak Cekatan';

    case 'memory-pairs':
      if (score >= 200) return '🧠 Otak Super Komputer';
      return '🃏 Pencocok Kartu Retro';

    case 'red-bounce':
      if (score >= 300) return '🔴 Bola Karet Ajaib';
      return '⭕ Pemantul Cincin Emas';

    case 'diamond-relic':
      if (score >= 200) return '💎 Arkeolog Penakluk Kuil';
      return '🗝️ Pemburu Permata';

    case 'persian-sands':
      if (score >= 300) return '🗡️ Pangeran Akrobatik Persia';
      return '🏜️ Pendekar Gurun Pasir';

    default:
      if (score >= 300) return '🏆 Juara Legendaris';
      if (score >= 100) return '★ Pemain Andal';
      return '🎮 Penjelajah Retro';
  }
}

export function createShareText(options: ScoreCardOptions): string {
  const rank = getGameRankTitle(options.gameId, options.score);
  return `📱 RETROPOCKET ARCADE — REKOR BARU!
━━━━━━━━━━━━━━━━━━━━━━
🎮 Game   : ${options.gameTitle}
🏆 Skor   : ${options.score} Poin
🎖️ Gelar  : ${rank}
🕹️ Era    : ${options.era.toUpperCase()}

"Ada yang berani ngalahin rekor gw gak?"
Tanding langsung di browser tanpa install:
👉 ${options.challengeUrl}`;
}

export function generateScoreCardCanvas(options: ScoreCardOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const rank = getGameRankTitle(options.gameId, options.score);

  // 1. Chassis Outer Background (Warm vintage parchment hardware)
  ctx.fillStyle = '#f0ebe1';
  ctx.fillRect(0, 0, width, height);

  // Dot matrix background grid
  ctx.fillStyle = 'rgba(30, 34, 41, 0.04)';
  for (let x = 12; x < width; x += 16) {
    for (let y = 12; y < height; y += 16) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // 2. Thick Brutalist Outer Border
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#1e2229';
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Hard drop shadow edge inside border
  ctx.fillStyle = '#1e2229';
  ctx.fillRect(width - 22, 22, 6, height - 44);
  ctx.fillRect(22, height - 22, width - 44, 6);

  // 3. Top Telecom Masthead Header (#144299)
  ctx.fillStyle = '#144299';
  ctx.fillRect(22, 22, width - 50, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ RETROPOCKET ARCADE ★', width / 2 - 3, 46);

  // 4. Cartridge MMC Header with Gold Pins
  const cardTop = 86;
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(36, cardTop, width - 78, 460);
  ctx.strokeRect(36, cardTop, width - 78, 460);

  // MMC Gold Pins
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(52 + i * 16, cardTop + 10, 8, 14);
    ctx.strokeRect(52 + i * 16, cardTop + 10, 8, 14);
  }

  ctx.fillStyle = '#717b8c';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('MMC-ROM • VERIFIED HIGHSCORE TICKET', 174, cardTop + 20);

  // Horizontal divider
  ctx.fillStyle = '#e7e1d5';
  ctx.fillRect(50, cardTop + 36, width - 106, 2);

  // 5. Game Title & Tribute
  ctx.fillStyle = '#1e2229';
  ctx.font = '900 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(options.gameTitle.toUpperCase(), width / 2 - 3, cardTop + 68);

  ctx.fillStyle = '#636c7c';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(options.tributeTo, width / 2 - 3, cardTop + 92);

  // 6. Giant Nokia LCD Screen Mockup for Score Display
  const lcdX = 52;
  const lcdY = cardTop + 114;
  const lcdW = width - 110;
  const lcdH = 168;

  // LCD Bezel
  ctx.fillStyle = '#d8d3c5';
  ctx.fillRect(lcdX, lcdY, lcdW, lcdH);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1e2229';
  ctx.strokeRect(lcdX, lcdY, lcdW, lcdH);

  // LCD Screen (Olive green Nokia LCD)
  ctx.fillStyle = '#879571';
  ctx.fillRect(lcdX + 8, lcdY + 8, lcdW - 16, lcdH - 16);

  // Subtle Scanlines
  ctx.fillStyle = 'rgba(20, 36, 16, 0.08)';
  for (let sy = lcdY + 8; sy < lcdY + lcdH - 8; sy += 3) {
    ctx.fillRect(lcdX + 8, sy, lcdW - 16, 1);
  }

  // LCD Content: Score & Rank
  ctx.fillStyle = '#142410';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REKOR RESMI PEMAIN', width / 2 - 3, lcdY + 30);

  // Giant Digits
  ctx.font = '900 58px monospace';
  ctx.fillText(String(options.score), width / 2 - 3, lcdY + 86);

  // Rank Banner inside LCD
  ctx.fillStyle = '#142410';
  ctx.fillRect(lcdX + 24, lcdY + 116, lcdW - 48, 28);
  ctx.fillStyle = '#879571';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(rank, width / 2 - 3, lcdY + 134);

  // 7. Challenge Call to Action & Quote
  ctx.fillStyle = '#1e2229';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('"Ada yang berani kalahin rekor gw?"', width / 2 - 3, cardTop + 320);

  ctx.fillStyle = '#144299';
  ctx.font = '900 13px monospace';
  ctx.fillText('⚔️ SCAN / BUKA LINK DI BAWAH UNTUK TANDING ⚔️', width / 2 - 3, cardTop + 348);

  // URL Box
  ctx.fillStyle = '#ece7db';
  ctx.fillRect(52, cardTop + 370, width - 110, 36);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1e2229';
  ctx.strokeRect(52, cardTop + 370, width - 110, 36);

  ctx.fillStyle = '#1e2229';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(options.challengeUrl, width / 2 - 3, cardTop + 392);

  // 8. Footer Date & Stamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  ctx.fillStyle = '#717b8c';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`TERCETAK: ${dateStr} • 100% CLEAN-ROOM NATIVE WEB ENGINE`, width / 2 - 3, cardTop + 434);

  return canvas;
}

export function downloadScoreCardImage(options: ScoreCardOptions, filename = 'retropocket-rekor.png'): void {
  const canvas = generateScoreCardCanvas(options);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

