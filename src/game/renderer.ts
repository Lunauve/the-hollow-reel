import { VIEW_HEIGHT, VIEW_WIDTH } from './level';
import {
  BatEnemy,
  BeetleEnemy,
  CrumblePlatform,
  MovingPlatform,
  Platform,
  SwingingLantern,
  WorldState,
} from './types';

let grainPatternCanvas: HTMLCanvasElement | null = null;

function getGrainCanvas(): HTMLCanvasElement {
  if (grainPatternCanvas) return grainPatternCanvas;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() > 0.5 ? 235 : 22;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = Math.floor(Math.random() * 28);
    }
    g.putImageData(img, 0, 0);
  }
  grainPatternCanvas = c;
  return c;
}

function drawBackground(ctx: CanvasRenderingContext2D, world: WorldState): void {
  const camX = world.cameraX;
  const camY = world.cameraY;

  // Base painted cavern wash
  const bgGrad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  bgGrad.addColorStop(0, '#2a2a28');
  bgGrad.addColorStop(0.5, '#1d1d1c');
  bgGrad.addColorStop(1, '#121211');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Subtle painted shafts of dim silver light
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const sx = ((i * 340 - camX * 0.14) % (VIEW_WIDTH + 400)) - 150;
    const beamGrad = ctx.createLinearGradient(sx, 0, sx + 120, VIEW_HEIGHT);
    beamGrad.addColorStop(0, 'rgba(244, 241, 234, 0.06)');
    beamGrad.addColorStop(1, 'rgba(244, 241, 234, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + 130, 0);
    ctx.lineTo(sx + 290, VIEW_HEIGHT);
    ctx.lineTo(sx + 70, VIEW_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Far parallax rock arches, strata & stalactites (0.22x)
  ctx.save();
  const farStep = 360;
  const farStart = Math.floor((camX * 0.22) / farStep) - 1;
  for (let i = farStart; i < farStart + 6; i++) {
    const x = i * farStep - camX * 0.22;
    const yBase = 140 - camY * 0.08;
    ctx.fillStyle = '#232321';
    ctx.beginPath();
    ctx.moveTo(x - 40, -50);
    ctx.lineTo(x + farStep + 40, -50);
    ctx.lineTo(x + farStep + 40, VIEW_HEIGHT + 50);
    ctx.lineTo(x + farStep - 35, VIEW_HEIGHT + 50);
    ctx.quadraticCurveTo(x + farStep * 0.5, yBase - 60, x + 35, VIEW_HEIGHT + 50);
    ctx.lineTo(x - 40, VIEW_HEIGHT + 50);
    ctx.closePath();
    ctx.fill();

    // Distant rotating film sprocket gear silhouettes in cavern mist
    if (((i % 2) + 2) % 2 === 0) {
      ctx.save();
      ctx.translate(x + farStep * 0.5, 290 - camY * 0.08);
      ctx.rotate(world.time * 0.14);
      ctx.strokeStyle = 'rgba(244, 241, 234, 0.05)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 74, 0, Math.PI * 2);
      ctx.stroke();
      for (let s = 0; s < 6; s++) {
        const ang = (s / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * 72, Math.sin(ang) * 72);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Distant stalactite cluster
    ctx.fillStyle = '#20201e';
    ctx.beginPath();
    ctx.moveTo(x + 75, 0);
    ctx.lineTo(x + 102, 115 + (((i % 3) + 3) % 3) * 28);
    ctx.lineTo(x + 132, 0);
    ctx.moveTo(x + 210, 0);
    ctx.lineTo(x + 228, 76 + (((i % 2) + 2) % 2) * 24);
    ctx.lineTo(x + 248, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Mid parallax cave ceiling canopy, pillars & mine timber ribs (0.45x)
  ctx.save();
  const midStep = 440;
  const midStart = Math.floor((camX * 0.45) / midStep) - 1;
  for (let i = midStart; i < midStart + 5; i++) {
    const x = i * midStep - camX * 0.45;
    ctx.fillStyle = '#181817';
    ctx.fillRect(x + 30, 0, 22, VIEW_HEIGHT);
    ctx.fillRect(x + 280, 0, 18, VIEW_HEIGHT);

    // Jagged ceiling canopy rock formations
    ctx.fillStyle = '#151514';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 110, 44);
    ctx.lineTo(x + 165, 22);
    ctx.lineTo(x + 240, 68);
    ctx.lineTo(x + 335, 30);
    ctx.lineTo(x + midStep, 48);
    ctx.lineTo(x + midStep, 0);
    ctx.closePath();
    ctx.fill();

    // Crossbeam
    ctx.fillStyle = '#181817';
    ctx.beginPath();
    ctx.moveTo(x + 30, 130 - camY * 0.12);
    ctx.lineTo(x + 298, 95 - camY * 0.12);
    ctx.lineTo(x + 298, 114 - camY * 0.12);
    ctx.lineTo(x + 30, 148 - camY * 0.12);
    ctx.closePath();
    ctx.fill();

    // Subtle hanging lantern glow in mid-ground timber
    ctx.fillStyle = 'rgba(244, 241, 234, 0.08)';
    ctx.beginPath();
    ctx.arc(x + 165, 135 - camY * 0.12, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTheaterBackdrop(ctx: CanvasRenderingContext2D, world: WorldState): void {
  const boss = world.boss;
  const left = boss.arenaLeft;
  const right = boss.arenaRight;
  const floorY = boss.floorY;
  const centerX = (left + right) / 2;

  ctx.save();
  // Theater dark back wall
  ctx.fillStyle = '#141413';
  ctx.fillRect(left - 20, floorY - 640, right - left + 40, 640);

  // Ornate proscenium curtain drapes at sides
  ctx.fillStyle = '#0c0c0c';
  for (let side = -1; side <= 1; side += 2) {
    const cx = side === -1 ? left : right - 95;
    ctx.fillRect(cx, floorY - 580, 95, 580);
    ctx.strokeStyle = '#3a3a37';
    ctx.lineWidth = 2;
    for (let f = 1; f <= 3; f++) {
      ctx.beginPath();
      ctx.moveTo(cx + f * 22, floorY - 580);
      ctx.quadraticCurveTo(cx + f * 22 + side * 8, floorY - 280, cx + f * 22, floorY);
      ctx.stroke();
    }
  }

  // Projection screen frame on back wall
  const scrW = 840;
  const scrH = 440;
  const scrX = centerX - scrW / 2;
  const scrY = floorY - scrH - 28;

  ctx.fillStyle = '#1f1f1d';
  ctx.fillRect(scrX - 14, scrY - 14, scrW + 28, scrH + 28);
  ctx.strokeStyle = '#686862';
  ctx.lineWidth = 4;
  ctx.strokeRect(scrX - 14, scrY - 14, scrW + 28, scrH + 28);

  // Screen surface (brightens dramatically when projector is active!)
  const beamActive = boss.phase !== 'dormant';
  const flicker = beamActive ? 0.88 + Math.sin(world.time * 38) * 0.06 + Math.random() * 0.06 : 0.14;
  const lum = Math.floor(215 * flicker);
  ctx.fillStyle = beamActive ? `rgb(${lum}, ${lum - 3}, ${lum - 10})` : '#222220';
  ctx.fillRect(scrX, scrY, scrW, scrH);

  // Projector beam cone from left booth into screen
  if (beamActive) {
    const beamGrad = ctx.createLinearGradient(left - 180, floorY - 290, scrX + scrW * 0.65, scrY + scrH * 0.5);
    beamGrad.addColorStop(0, 'rgba(244, 241, 234, 0.34)');
    beamGrad.addColorStop(1, 'rgba(244, 241, 234, 0.04)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(left - 120, floorY - 230);
    ctx.lineTo(scrX, scrY);
    ctx.lineTo(scrX + scrW, scrY + scrH);
    ctx.lineTo(left - 120, floorY - 210);
    ctx.closePath();
    ctx.fill();
  }

  // Temporary left velvet gate during active fight
  if (boss.phase !== 'dormant' && boss.phase !== 'defeated_melt' && boss.phase !== 'door_open') {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(left - 24, floorY - 580, 24, 580);
    ctx.strokeStyle = '#d4d1c8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, floorY - 580);
    ctx.lineTo(left, floorY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawProps(ctx: CanvasRenderingContext2D, world: WorldState): void {
  for (const prop of world.props) {
    const s = prop.scale ?? 1;
    ctx.save();
    ctx.translate(prop.x, prop.y);
    ctx.scale(s, s);

    if (prop.kind === 'arch') {
      ctx.fillStyle = '#111110';
      ctx.beginPath();
      ctx.moveTo(-80, 0);
      ctx.lineTo(-80, -250);
      ctx.quadraticCurveTo(0, -340, 120, -250);
      ctx.lineTo(120, 0);
      ctx.lineTo(85, 0);
      ctx.lineTo(85, -210);
      ctx.quadraticCurveTo(10, -270, -45, -210);
      ctx.lineTo(-45, 0);
      ctx.closePath();
      ctx.fill();
    } else if (prop.kind === 'lamp') {
      // Vintage post lantern
      ctx.strokeStyle = '#0d0d0d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -82);
      ctx.quadraticCurveTo(0, -96, 16, -96);
      ctx.stroke();

      // Glow cone
      const glow = ctx.createRadialGradient(18, -82, 4, 18, -82, 75);
      glow.addColorStop(0, 'rgba(244, 241, 234, 0.28)');
      glow.addColorStop(1, 'rgba(244, 241, 234, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(18, -82, 75, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f4f1ea';
      ctx.strokeStyle = '#0d0d0d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.rect(11, -90, 14, 18);
      ctx.fill();
      ctx.stroke();
    } else if (prop.kind === 'reel') {
      // Abandoned film reel leaning against stone
      ctx.translate(0, -28);
      ctx.fillStyle = '#151514';
      ctx.strokeStyle = '#6f6e68';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let a = 0; a < 5; a++) {
        const ang = (a / 5) * Math.PI * 2;
        ctx.fillStyle = '#2c2c29';
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 14, Math.sin(ang) * 14, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#d4d1c8';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.kind === 'trestle') {
      ctx.strokeStyle = '#1a1a18';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.lineTo(-22, -130);
      ctx.moveTo(45, 0);
      ctx.lineTo(22, -130);
      ctx.moveTo(-36, -60);
      ctx.lineTo(36, -60);
      ctx.stroke();
    } else if (prop.kind === 'poster') {
      // Torn 1920s theater bill on cavern wall
      ctx.fillStyle = '#d8d5cc';
      ctx.strokeStyle = '#111110';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-32, -110, 64, 84);
      ctx.strokeRect(-32, -110, 64, 84);
      ctx.fillStyle = '#111110';
      ctx.font = '700 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('TONIGHT', 0, -92);
      ctx.fillRect(-20, -82, 40, 28);
      ctx.fillStyle = '#f4f1ea';
      ctx.beginPath();
      ctx.arc(0, -68, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111110';
      ctx.font = '600 8px Cinzel, serif';
      ctx.fillText('INK USHER', 0, -40);
    } else if (prop.kind === 'stalactite') {
      ctx.fillStyle = '#121211';
      ctx.strokeStyle = '#3e3d38';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(-10, 95);
      ctx.lineTo(4, 38);
      ctx.lineTo(14, 65);
      ctx.lineTo(24, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (prop.kind === 'column') {
      // Carved subterranean stone column with Monument Valley–inspired geometric flutes
      ctx.fillStyle = '#171716';
      ctx.strokeStyle = '#474640';
      ctx.lineWidth = 2;
      ctx.fillRect(-16, -240, 32, 240);
      ctx.strokeRect(-16, -240, 32, 240);
      ctx.fillStyle = '#252522';
      ctx.fillRect(-24, -240, 48, 14);
      ctx.fillRect(-24, -14, 48, 14);
      ctx.strokeStyle = '#2c2c29';
      ctx.beginPath();
      ctx.moveTo(-6, -220);
      ctx.lineTo(-6, -20);
      ctx.moveTo(6, -220);
      ctx.lineTo(6, -20);
      ctx.stroke();
    } else if (prop.kind === 'sprocket') {
      // Giant rotating silent-film sprocket gear on cave wall
      ctx.save();
      ctx.rotate(world.time * 0.32);
      ctx.fillStyle = '#161615';
      ctx.strokeStyle = '#52514b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let t = 0; t < 8; t++) {
        const ang = (t / 8) * Math.PI * 2;
        ctx.fillStyle = '#242422';
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 28, Math.sin(ang) * 28, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#0d0d0c';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (prop.kind === 'chains') {
      // Swaying hanging mine chains
      const sway = Math.sin(world.time * 1.6 + prop.x * 0.01) * 7;
      ctx.strokeStyle = '#292926';
      ctx.lineWidth = 3;
      for (const ox of [-14, 14]) {
        ctx.beginPath();
        ctx.moveTo(ox, 0);
        ctx.quadraticCurveTo(ox + sway * 0.5, 65, ox + sway, 130);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawSignposts(ctx: CanvasRenderingContext2D, world: WorldState): void {
  for (const sign of world.signposts) {
    ctx.save();
    ctx.translate(sign.x, sign.y);

    // Wooden post
    ctx.fillStyle = '#181816';
    ctx.strokeStyle = '#090909';
    ctx.lineWidth = 2;
    ctx.fillRect(-5, -116, 10, 116);

    // Painted board
    const bw = 276;
    const bh = 86;
    ctx.fillStyle = '#141413';
    ctx.strokeStyle = '#eae6dc';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-bw / 2, -142, bw, bh);
    ctx.strokeRect(-bw / 2, -142, bw, bh);

    // Corner rivets
    ctx.fillStyle = '#eae6dc';
    for (const rx of [-bw / 2 + 8, bw / 2 - 8]) {
      for (const ry of [-142 + 8, -142 + bh - 8]) {
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#f4f1ea';
    ctx.textAlign = 'center';
    ctx.font = '700 12px Cinzel, serif';
    ctx.fillText(sign.title, 0, -121);

    ctx.font = '600 11px Lora, serif';
    ctx.fillStyle = '#dad6cc';
    sign.lines.forEach((line, idx) => {
      ctx.fillText(line, 0, -101 + idx * 17);
    });

    ctx.restore();
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform): void {
  ctx.save();

  if (plat.kind === 'cart') {
    const cx = plat.x + plat.w / 2;
    const cy = plat.y + plat.h / 2;

    // Tilted broken mine cart chassis underneath
    ctx.save();
    ctx.translate(cx, cy + 4);
    ctx.rotate(plat.cartTilt ?? 0);

    // Cart body
    ctx.fillStyle = '#161615';
    ctx.strokeStyle = '#8b8880';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-plat.w * 0.46, -18);
    ctx.lineTo(plat.w * 0.46, -18);
    ctx.lineTo(plat.w * 0.36, 12);
    ctx.lineTo(-plat.w * 0.36, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wheels
    for (const wx of [-plat.w * 0.25, plat.w * 0.25]) {
      ctx.fillStyle = '#0c0c0b';
      ctx.strokeStyle = '#cfccc4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wx, 18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Solid flat riding rim at exact collision top so player can judge landings effortlessly
    ctx.fillStyle = '#090909';
    ctx.fillRect(plat.x, plat.y, plat.w, 12);
    ctx.fillStyle = '#f7f5ef';
    ctx.fillRect(plat.x, plat.y, plat.w, 3);
    ctx.restore();
    return;
  }

  // Solid black ink rock / bridge / stage
  ctx.fillStyle = plat.kind === 'bridge' ? '#121211' : '#090909';
  ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

  // Subtle hand-inked vertical rock striations
  ctx.strokeStyle = '#1b1b19';
  ctx.lineWidth = 2;
  for (let sx = plat.x + 24; sx < plat.x + plat.w - 16; sx += 44) {
    ctx.beginPath();
    ctx.moveTo(sx, plat.y + 10);
    ctx.lineTo(sx - 6, Math.min(plat.y + plat.h, plat.y + 95));
    ctx.stroke();
  }

  // Crisp side edges
  ctx.strokeStyle = '#6c6a63';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(plat.x + 0.75, plat.y);
  ctx.lineTo(plat.x + 0.75, plat.y + Math.min(plat.h, 180));
  ctx.moveTo(plat.x + plat.w - 0.75, plat.y);
  ctx.lineTo(plat.x + plat.w - 0.75, plat.y + Math.min(plat.h, 180));
  ctx.stroke();

  // Thin crisp WHITE RIM on playable top surface
  ctx.fillStyle = '#f5f2ea';
  ctx.fillRect(plat.x, plat.y, plat.w, 3);

  ctx.restore();
}

function drawInkPools(ctx: CanvasRenderingContext2D, world: WorldState): void {
  for (const pool of world.inkPools) {
    ctx.save();
    ctx.fillStyle = '#050505';
    ctx.fillRect(pool.x, pool.y, pool.w, pool.h);

    // Rippling white ink surface highlights
    ctx.strokeStyle = '#dbd8cf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = pool.x; x <= pool.x + pool.w; x += 14) {
      const waveY = pool.y + Math.sin(world.time * 3.5 + x * 0.06) * 2.5;
      if (x === pool.x) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();

    // Small rising ink bubbles
    for (let b = 0; b < 5; b++) {
      const bx = pool.x + ((b * 173 + world.time * 18) % Math.max(40, pool.w - 20)) + 10;
      const cycle = (world.time * 1.4 + b * 0.7) % 1;
      const by = pool.y - cycle * 12;
      ctx.fillStyle = '#050505';
      ctx.strokeStyle = '#cfccc4';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(bx, by, 3 + cycle * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawLantern(ctx: CanvasRenderingContext2D, l: SwingingLantern): void {
  const cx = l.x + l.w / 2;
  const cy = l.y;

  ctx.save();
  // Ceiling chain mount
  ctx.fillStyle = '#181816';
  ctx.beginPath();
  ctx.arc(l.pivotX, l.pivotY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Swinging chain
  ctx.strokeStyle = '#0d0d0d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(l.pivotX, l.pivotY);
  ctx.lineTo(cx, cy - 32);
  ctx.stroke();

  // Soft lantern illumination halo
  const halo = ctx.createRadialGradient(cx, cy - 16, 4, cx, cy - 16, 110);
  halo.addColorStop(0, 'rgba(244, 241, 234, 0.32)');
  halo.addColorStop(1, 'rgba(244, 241, 234, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy - 16, 110, 0, Math.PI * 2);
  ctx.fill();

  // Lantern housing above platform
  ctx.fillStyle = '#f4f1ea';
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 2.5;
  ctx.fillRect(cx - 10, cy - 32, 20, 26);
  ctx.strokeRect(cx - 10, cy - 32, 20, 26);

  // Solid black ink lantern platform with crisp white landing rim
  ctx.fillStyle = '#090909';
  ctx.fillRect(l.x, l.y, l.w, l.h);
  ctx.strokeStyle = '#6f6d66';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(l.x, l.y, l.w, l.h);
  ctx.fillStyle = '#f7f5ef';
  ctx.fillRect(l.x, l.y, l.w, 3.5);

  ctx.restore();
}

function drawMovingPlatform(ctx: CanvasRenderingContext2D, m: MovingPlatform, time: number): void {
  ctx.save();

  // Draw cable/pulley guide rail
  const trackStartX = m.baseX - m.rangeX + m.w / 2;
  const trackEndX = m.baseX + m.rangeX + m.w / 2;
  const trackStartY = m.baseY - m.rangeY + m.h / 2;
  const trackEndY = m.baseY + m.rangeY + m.h / 2;

  ctx.strokeStyle = 'rgba(220, 217, 208, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(trackStartX, trackStartY);
  ctx.lineTo(trackEndX, trackEndY);
  ctx.stroke();
  ctx.setLineDash([]);

  // End pulley anchors
  for (const [ax, ay] of [
    [trackStartX, trackStartY],
    [trackEndX, trackEndY],
  ]) {
    ctx.fillStyle = '#1a1a18';
    ctx.strokeStyle = '#9d9a91';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ax, ay, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Moving iron trolley body
  ctx.fillStyle = '#0c0c0b';
  ctx.strokeStyle = '#8b8880';
  ctx.lineWidth = 2;
  ctx.fillRect(m.x, m.y, m.w, m.h);
  ctx.strokeRect(m.x, m.y, m.w, m.h);

  // Small spinning gear wheels underneath
  const rot = time * 4;
  for (const wx of [m.x + 16, m.x + m.w - 16]) {
    ctx.save();
    ctx.translate(wx, m.y + m.h + 4);
    ctx.rotate(rot);
    ctx.fillStyle = '#1b1b19';
    ctx.strokeStyle = '#d4d1c8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Crisp white playable top rim
  ctx.fillStyle = '#f7f5ef';
  ctx.fillRect(m.x, m.y, m.w, 3.5);

  ctx.restore();
}

function drawCrumblePlatform(ctx: CanvasRenderingContext2D, c: CrumblePlatform, time: number): void {
  ctx.save();
  if (c.state === 'broken') {
    // Faint dashed ghost silhouette indicating it will reform
    ctx.strokeStyle = 'rgba(244, 241, 234, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.restore();
    return;
  }

  const jx = c.state === 'shaking' ? Math.sin(time * 55) * 3 : 0;
  const jy = c.state === 'shaking' ? Math.cos(time * 48) * 1.5 : 0;
  ctx.translate(jx, jy);

  // Chalk-slate body
  ctx.fillStyle = c.state === 'shaking' ? '#252522' : '#141413';
  ctx.strokeStyle = c.state === 'shaking' ? '#ffffff' : '#9c998f';
  ctx.lineWidth = 2;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeRect(c.x, c.y, c.w, c.h);

  // Fracture lines across surface so player recognizes disintegrating slate
  ctx.strokeStyle = c.state === 'shaking' ? '#ffffff' : '#73716a';
  ctx.lineWidth = c.state === 'shaking' ? 2.2 : 1.5;
  ctx.beginPath();
  ctx.moveTo(c.x + c.w * 0.28, c.y + 3);
  ctx.lineTo(c.x + c.w * 0.36, c.y + 12);
  ctx.lineTo(c.x + c.w * 0.25, c.y + c.h);
  ctx.moveTo(c.x + c.w * 0.66, c.y + 3);
  ctx.lineTo(c.x + c.w * 0.6, c.y + 13);
  ctx.lineTo(c.x + c.w * 0.72, c.y + c.h);
  ctx.stroke();

  // Crisp white rim along top edge
  ctx.fillStyle = '#f7f5ef';
  ctx.fillRect(c.x, c.y, c.w, 3.5);

  ctx.restore();
}

function drawCheckpointBooth(ctx: CanvasRenderingContext2D, world: WorldState): void {
  const cp = world.checkpoint;
  ctx.save();
  ctx.translate(cp.x, cp.y);

  // Booth body
  ctx.fillStyle = '#111110';
  ctx.strokeStyle = '#cfccc4';
  ctx.lineWidth = 2.5;
  ctx.fillRect(-52, -112, 104, 112);
  ctx.strokeRect(-52, -112, 104, 112);

  // Slanted roof
  ctx.fillStyle = '#090909';
  ctx.beginPath();
  ctx.moveTo(-64, -112);
  ctx.lineTo(0, -138);
  ctx.lineTo(64, -112);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Projector reels on top/window
  const spin = cp.activated ? world.time * 4.5 : 0.2;
  for (const rx of [-22, 18]) {
    ctx.save();
    ctx.translate(rx, -148);
    ctx.rotate(spin);
    ctx.fillStyle = '#1c1c1a';
    ctx.strokeStyle = '#e8e4da';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();
    ctx.restore();
  }

  // Booth window & lens glow
  ctx.fillStyle = cp.activated ? '#f4f1ea' : '#2e2e2b';
  ctx.fillRect(14, -84, 24, 24);
  ctx.strokeStyle = '#090909';
  ctx.strokeRect(14, -84, 24, 24);

  if (cp.activated) {
    const beam = ctx.createLinearGradient(38, -72, 220, -40);
    beam.addColorStop(0, 'rgba(244, 241, 234, 0.32)');
    beam.addColorStop(1, 'rgba(244, 241, 234, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(38, -80);
    ctx.lineTo(220, -115);
    ctx.lineTo(220, -25);
    ctx.lineTo(38, -64);
    ctx.closePath();
    ctx.fill();
  }

  // Small label plate
  ctx.fillStyle = '#e8e4da';
  ctx.font = '700 9px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText(cp.activated ? 'REEL SAVED' : 'BOOTH', 0, -20);

  ctx.restore();
}

function drawBeetle(ctx: CanvasRenderingContext2D, b: BeetleEnemy, time: number): void {
  if (b.dead) return;
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h);
  ctx.scale(b.facing, 1);

  const flash = b.flashTimer > 0;
  const bounce = b.stunTimer > 0 ? Math.sin(time * 40) * 2 : Math.abs(Math.sin(b.animTime)) * 2.5;

  // Spinning wind-up key on back
  ctx.save();
  ctx.translate(-4, -b.h - 4 - bounce);
  const keySpin = Math.sin(b.animTime * 1.4);
  ctx.strokeStyle = flash ? '#ffffff' : '#cfccc4';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(0, -6);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-5 * keySpin, -9, Math.max(2, Math.abs(6 * keySpin)), 5, 0, 0, Math.PI * 2);
  ctx.ellipse(5 * keySpin, -9, Math.max(2, Math.abs(6 * keySpin)), 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Rubber-hose scuttling legs
  ctx.strokeStyle = '#090909';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    const legSwing = Math.sin(b.animTime * 2 + i * 1.4) * 5;
    ctx.beginPath();
    ctx.moveTo(i * 11, -8);
    ctx.quadraticCurveTo(i * 11 + legSwing, -3, i * 11 + legSwing * 1.2, 0);
    ctx.stroke();
  }

  // Beetle shell
  ctx.fillStyle = flash ? '#f4f1ea' : '#0b0b0b';
  ctx.strokeStyle = '#e5e2d9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -14 - bounce, 21, 14, 0, Math.PI, 0);
  ctx.lineTo(21, -8 - bounce);
  ctx.lineTo(-21, -8 - bounce);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 1920s pie-cut eye
  ctx.fillStyle = flash ? '#0b0b0b' : '#f4f1ea';
  ctx.beginPath();
  ctx.arc(11, -15 - bounce, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? '#f4f1ea' : '#0b0b0b';
  ctx.beginPath();
  ctx.arc(12.5, -15 - bounce, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBat(ctx: CanvasRenderingContext2D, bat: BatEnemy, time: number): void {
  if (bat.phase === 'dead') return;
  ctx.save();
  ctx.translate(bat.x, bat.y);

  const flash = bat.flashTimer > 0;
  const wingFlap =
    bat.phase === 'perched'
      ? 0.25
      : bat.phase === 'telegraph'
        ? Math.sin(time * 28) * 0.55 - 0.35
        : Math.sin(bat.wingTime) * 0.7;

  // Scalloped rubber-hose wings
  ctx.fillStyle = flash ? '#f4f1ea' : '#0b0b0b';
  ctx.strokeStyle = '#e5e2d9';
  ctx.lineWidth = 1.8;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(20, -18, 34, -4);
    ctx.quadraticCurveTo(24, 6, 18, 4);
    ctx.quadraticCurveTo(11, 10, 4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Round inked body & ears
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-8, -9);
  ctx.lineTo(-10, -19);
  ctx.lineTo(-2, -11);
  ctx.moveTo(8, -9);
  ctx.lineTo(10, -19);
  ctx.lineTo(2, -11);
  ctx.fill();

  // Eyes (brighter during telegraph!)
  ctx.fillStyle = bat.phase === 'telegraph' ? '#ffffff' : '#e8e4da';
  const eyeSize = bat.phase === 'telegraph' ? 4.2 : 3;
  ctx.beginPath();
  ctx.arc(-4.5, -2, eyeSize, 0, Math.PI * 2);
  ctx.arc(4.5, -2, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // Screech telegraph ring
  if (bat.phase === 'telegraph') {
    ctx.strokeStyle = 'rgba(244, 241, 234, 0.65)';
    ctx.lineWidth = 1.8;
    const r = 18 + ((time * 45) % 18);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, world: WorldState): void {
  const p = world.player;

  // Brief blink during invulnerability
  if (p.invulnTimer > 0 && Math.floor(world.time * 18) % 2 === 0) {
    return;
  }

  // 1. Long white scarf (Monument Valley Ro-inspired flowing ribbon)
  if (p.scarf.length > 1) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Dark ink outline for scarf
    ctx.strokeStyle = '#090909';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(p.scarf[0].x, p.scarf[0].y);
    for (let i = 1; i < p.scarf.length; i++) {
      ctx.lineTo(p.scarf[i].x, p.scarf[i].y);
    }
    ctx.stroke();

    // Pure white scarf body
    ctx.strokeStyle = '#f8f6f0';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(p.scarf[0].x, p.scarf[0].y);
    for (let i = 1; i < p.scarf.length; i++) {
      ctx.lineTo(p.scarf[i].x, p.scarf[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 2. Traveler body with squash & stretch around feet
  ctx.save();
  const footX = p.x + p.w / 2;
  const footY = p.y + p.h;
  ctx.translate(footX, footY);
  ctx.scale(p.squashX * p.facing, p.squashY);

  // Rubber-hose legs & white-cuffed cartoon boots
  const stride = p.grounded && Math.abs(p.vx) > 15 ? Math.sin(p.runCycle) * 7 : p.grounded ? 0 : 4;
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';

  // Back leg
  ctx.beginPath();
  ctx.moveTo(-3, -12);
  ctx.quadraticCurveTo(-5 - stride * 0.5, -6, -4 - stride, -2);
  ctx.stroke();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.ellipse(-2 - stride, -2, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front leg
  ctx.beginPath();
  ctx.moveTo(3, -12);
  ctx.quadraticCurveTo(5 + stride * 0.5, -6, 4 + stride, -2);
  ctx.stroke();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.ellipse(6 + stride, -2, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Geometric conical cloak (Ro silhouette)
  ctx.fillStyle = '#0b0b0b';
  ctx.strokeStyle = '#edeae0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(15, -9);
  ctx.lineTo(-15, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle geometric cloak fold line
  ctx.strokeStyle = '#484743';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(-3, -10);
  ctx.stroke();

  // Scarf collar around neck
  ctx.fillStyle = '#f8f6f0';
  ctx.strokeStyle = '#090909';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -32, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pale angular face beneath dark geometric hood
  // Hood back/cone
  ctx.fillStyle = '#0b0b0b';
  ctx.strokeStyle = '#edeae0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-2, -52); // pointed Ro hood apex
  ctx.lineTo(10, -33);
  ctx.lineTo(-11, -33);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pale angular face cutout
  ctx.fillStyle = '#f2efe6';
  ctx.beginPath();
  ctx.moveTo(1, -43);
  ctx.lineTo(8.5, -39);
  ctx.lineTo(7, -33);
  ctx.lineTo(-1, -33);
  ctx.closePath();
  ctx.fill();

  // Expressive dark ink eye
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.ellipse(4.8, -37.5, 1.4, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Small Monument Valley–inspired crown hovering gently above the hood
  const crownBob = Math.sin(world.time * 4.2) * 1.4;
  ctx.save();
  ctx.translate(-1, -59 + crownBob);
  ctx.fillStyle = '#f8f6f0';
  ctx.strokeStyle = '#090909';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-7, 2);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-3, -2);
  ctx.lineTo(0, -8);
  ctx.lineTo(3, -2);
  ctx.lineTo(8, -6);
  ctx.lineTo(7, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Sword held ready at side when not actively swinging
  if (!world.slash) {
    ctx.save();
    ctx.translate(-6, -24);
    ctx.rotate(-0.55);
    ctx.fillStyle = '#eae6dc';
    ctx.strokeStyle = '#090909';
    ctx.lineWidth = 1.5;
    // Blade tip peeking behind cloak
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(0, -18);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawSlash(ctx: CanvasRenderingContext2D, world: WorldState): void {
  const s = world.slash;
  if (!s) return;

  const progress = 1 - s.timer / s.duration;
  const alpha = Math.max(0, 1 - progress * 0.55);

  ctx.save();
  const cx = s.dir === 1 ? s.x + 8 : s.x + s.w - 8;
  const cy = s.y + s.h * 0.52;
  ctx.translate(cx, cy);
  ctx.scale(s.dir, 1);

  // Outer crisp crescent trail
  ctx.globalAlpha = alpha * 0.92;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#090909';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(4, 0, 38, -Math.PI * 0.44, Math.PI * 0.44);
  ctx.arc(-4, 0, 27, Math.PI * 0.38, -Math.PI * 0.38, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Swung geometric ivory-and-ink Sword sweeping through the arc!
  const swingAngle = -1.25 + progress * 2.45;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.translate(-4, 2);
  ctx.rotate(swingAngle);

  // Hand / hilt grip
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(-3, -4, 6, 8);
  // Crossguard
  ctx.fillStyle = '#f8f6f0';
  ctx.strokeStyle = '#090909';
  ctx.lineWidth = 1.8;
  ctx.fillRect(3, -8, 4, 16);
  ctx.strokeRect(3, -8, 4, 16);

  // Crisp long blade
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(7, -3.5);
  ctx.lineTo(42, -2);
  ctx.lineTo(48, 0);
  ctx.lineTo(42, 2);
  ctx.lineTo(7, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central fuller line
  ctx.strokeStyle = '#6f6d66';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(39, 0);
  ctx.stroke();

  ctx.restore();

  ctx.restore();
}

function drawCartoonGlove(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  rotation = 0,
  mode: 'fist' | 'palm' | 'grip' = 'fist'
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);

  ctx.fillStyle = '#f6f3ec';
  ctx.strokeStyle = '#090909';
  ctx.lineWidth = 3;

  if (mode === 'palm') {
    // Wide flat sweeping palm
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Thumb tucked up
    ctx.beginPath();
    ctx.ellipse(-16, -13, 12, 7, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (mode === 'grip') {
    // Fingers curled gripping frame edge
    ctx.beginPath();
    ctx.roundRect(-22, -20, 44, 40, 14);
    ctx.fill();
    ctx.stroke();
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 11, 14, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // Classic oversized Mickey-style fist
    ctx.beginPath();
    ctx.roundRect(-26, -24, 52, 46, 18);
    ctx.fill();
    ctx.stroke();
    // Knuckle curves
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 12, 16, 7, 0, Math.PI);
      ctx.stroke();
    }
  }

  // Three classic 1920s black lines on back of glove
  ctx.strokeStyle = '#090909';
  ctx.lineWidth = 2.2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 8, -10);
    ctx.lineTo(i * 10, 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBoss(ctx: CanvasRenderingContext2D, world: WorldState): void {
  const boss = world.boss;
  if (boss.phase === 'dormant') return;

  const centerX = (boss.arenaLeft + boss.arenaRight) / 2;
  const scrW = 840;
  const scrH = 440;
  const scrX = centerX - scrW / 2;
  const scrY = boss.floorY - scrH - 28;

  // Intro sequence: projected shadow forms on back screen, glove grips edge and pulls Usher in!
  if (boss.phase === 'intro') {
    const p = boss.introProgress;
    ctx.save();

    // Projected shadow silhouette inside screen
    const shadowAlpha = Math.min(1, p * 2.2);
    ctx.globalAlpha = shadowAlpha;
    const ux = centerX + 160;
    const uy = scrY + scrH - 20;
    const pullX = p > 0.65 ? ((p - 0.65) / 0.35) * 40 : 0;

    // Lanky shadow on wall
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(ux - pullX, uy - 110, 26, 76, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ux - pullX, uy - 205, 24, 0, Math.PI * 2);
    ctx.fill();

    // Eyes on screen
    ctx.fillStyle = '#f6f3ec';
    ctx.beginPath();
    ctx.ellipse(ux - pullX - 9, uy - 208, 4, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(ux - pullX + 6, uy - 208, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Giant white glove gripping edge of screen!
    if (p > 0.32) {
      const gripT = Math.min(1, (p - 0.32) / 0.35);
      const gx = scrX + scrW - 10 + (1 - gripT) * -70;
      const gy = scrY + scrH * 0.58;
      // Rubber-hose arm reaching to screen edge
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(ux - pullX, uy - 135);
      ctx.quadraticCurveTo(ux + 120, gy - 40, gx, gy);
      ctx.stroke();

      drawCartoonGlove(ctx, gx, gy, 1.05, 1.05, -0.2, 'grip');
    }

    ctx.restore();
    return;
  }

  // Defeat melt into puddle + glowing white doorway
  if (boss.phase === 'defeated_melt' || boss.phase === 'door_open') {
    ctx.save();

    // Spreading puddle of black ink on theater stage
    const spread = boss.phase === 'door_open' ? 1 : boss.puddleSpread;
    const puddleW = 60 + spread * 140;
    const bodyHeightScale = Math.max(0.05, 1 - spread);

    if (bodyHeightScale > 0.08) {
      ctx.fillStyle = '#070707';
      ctx.beginPath();
      ctx.ellipse(
        boss.bodyX,
        boss.floorY - 75 * bodyHeightScale,
        28 / Math.sqrt(bodyHeightScale),
        75 * bodyHeightScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = '#060606';
    ctx.strokeStyle = '#d4d1c8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(boss.bodyX, boss.floorY - 2, puddleW, 12, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cast glowing white doorway onto the back wall
    if (boss.phase === 'door_open') {
      const dp = boss.doorwayOpenProgress;
      const dw = boss.doorwayW * dp;
      const dh = boss.doorwayH * dp;
      const dx = boss.doorwayX + (boss.doorwayW - dw) / 2;
      const dy = boss.floorY - dh;

      // Radiant halo
      const halo = ctx.createRadialGradient(
        boss.doorwayX + boss.doorwayW / 2,
        boss.floorY - boss.doorwayH / 2,
        10,
        boss.doorwayX + boss.doorwayW / 2,
        boss.floorY - boss.doorwayH / 2,
        140
      );
      halo.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(boss.doorwayX + boss.doorwayW / 2, boss.floorY - boss.doorwayH / 2, 140, 0, Math.PI * 2);
      ctx.fill();

      // White arched doorway
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#090909';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dx, boss.floorY);
      ctx.lineTo(dx, dy + dw * 0.45);
      ctx.arc(dx + dw / 2, dy + dw * 0.45, dw / 2, Math.PI, 0);
      ctx.lineTo(dx + dw, boss.floorY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (dp > 0.8) {
        ctx.fillStyle = '#f4f1ea';
        ctx.font = '700 12px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', boss.doorwayX + boss.doorwayW / 2, dy - 12);
      }
    }

    ctx.restore();
    return;
  }

  // Active Ink Usher Boss Render
  const flash = boss.flashTimer > 0;
  const bob = Math.sin(world.time * 3.8) * 6;
  const lean = boss.phase === 'sweep_recover' ? 28 : 0;

  ctx.save();

  // Target shadow ring on floor during slam_aim & slam_pause
  if (boss.phase === 'slam_aim' || boss.phase === 'slam_pause') {
    ctx.save();
    ctx.strokeStyle = boss.phase === 'slam_pause' ? '#ffffff' : 'rgba(244, 241, 234, 0.55)';
    ctx.lineWidth = boss.phase === 'slam_pause' ? 3 : 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.ellipse(boss.slamTargetX, boss.floorY - 3, 56, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Lanky Usher body (drawn slightly behind gloves)
  const bx = boss.bodyX;
  const by = boss.bodyY + bob + lean;

  // Rubber-hose legs
  ctx.strokeStyle = flash ? '#ffffff' : '#080808';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx - 12, by - 78);
  ctx.quadraticCurveTo(bx - 22, by - 40, bx - 16, boss.floorY);
  ctx.moveTo(bx + 12, by - 78);
  ctx.quadraticCurveTo(bx + 22, by - 40, bx + 16, boss.floorY);
  ctx.stroke();

  // Lanky torso / usher coat
  ctx.fillStyle = flash ? '#ffffff' : '#080808';
  ctx.strokeStyle = '#d4d1c8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 24, by - 165);
  ctx.lineTo(bx + 24, by - 165);
  ctx.lineTo(bx + 32, by - 72);
  ctx.lineTo(bx - 32, by - 72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White usher bow-tie
  ctx.fillStyle = flash ? '#080808' : '#f4f1ea';
  ctx.beginPath();
  ctx.moveTo(bx, by - 156);
  ctx.lineTo(bx - 12, by - 162);
  ctx.lineTo(bx - 12, by - 150);
  ctx.closePath();
  ctx.moveTo(bx, by - 156);
  ctx.lineTo(bx + 12, by - 162);
  ctx.lineTo(bx + 12, by - 150);
  ctx.closePath();
  ctx.fill();

  // Head & pie-cut eyes
  ctx.fillStyle = flash ? '#ffffff' : '#080808';
  ctx.beginPath();
  ctx.ellipse(bx, by - 196, 24, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Usher cap brim
  ctx.beginPath();
  ctx.ellipse(bx, by - 220, 28, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(bx - 18, by - 236, 36, 16);

  // Pie-cut eyes
  ctx.fillStyle = flash ? '#080808' : '#f4f1ea';
  for (const ex of [-8, 8]) {
    ctx.beginPath();
    ctx.ellipse(bx + ex, by - 198, 4.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Arms & Oversized White Gloves per phase
  if (boss.phase === 'sweep_telegraph' || boss.phase === 'sweep_attack') {
    const jitter = boss.phase === 'sweep_telegraph' ? Math.sin(world.time * 45) * 3 : 0;
    const gx = boss.sweepGloveX + jitter;
    const gy = boss.sweepGloveY;

    // Rubber-hose arm reaching down to flat palm
    ctx.strokeStyle = '#080808';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(bx + boss.facing * 18, by - 150);
    ctx.quadraticCurveTo((bx + gx) / 2, by - 60, gx, gy);
    ctx.stroke();

    drawCartoonGlove(ctx, gx, gy, 1.15 * boss.facing, 1.15, 0, 'palm');

    // Off-hand raised
    drawCartoonGlove(ctx, bx - boss.facing * 42, by - 130, 0.85, 0.85, 0.2, 'fist');
  } else if (
    boss.phase === 'slam_aim' ||
    boss.phase === 'slam_pause' ||
    boss.phase === 'slam_drop' ||
    boss.phase === 'slam_stuck'
  ) {
    const stuckJitter = boss.phase === 'slam_stuck' ? Math.sin(world.time * 36) * 2.5 : 0;
    const fx = boss.slamTargetX + stuckJitter;
    const fy = boss.slamFistsY;

    // Two noodle arms up/down to fists
    ctx.strokeStyle = '#080808';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(bx - 20, by - 155);
    ctx.quadraticCurveTo(bx - 55, (by - 155 + fy) / 2, fx - 24, fy);
    ctx.moveTo(bx + 20, by - 155);
    ctx.quadraticCurveTo(bx + 55, (by - 155 + fy) / 2, fx + 24, fy);
    ctx.stroke();

    drawCartoonGlove(ctx, fx - 24, fy, 1.05, 1.05, 0.1, 'fist');
    drawCartoonGlove(ctx, fx + 24, fy, -1.05, 1.05, -0.1, 'fist');

    // Cartoon struggle sparks while stuck in floor!
    if (boss.phase === 'slam_stuck') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        const sx = fx + side * 56;
        const sy = boss.floorY - 38;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + side * 10, sy - 8);
        ctx.moveTo(sx, sy + 10);
        ctx.lineTo(sx + side * 12, sy + 8);
        ctx.stroke();
      }
    }
  } else {
    // Idle / sweep_recover rubber-hose stance
    const idleSwing = Math.sin(world.time * 4) * 8;
    ctx.strokeStyle = '#080808';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(bx - 20, by - 150);
    ctx.quadraticCurveTo(bx - 48, by - 115, bx - 44, by - 90 + idleSwing);
    ctx.moveTo(bx + 20, by - 150);
    ctx.quadraticCurveTo(bx + 48, by - 115, bx + 44, by - 90 - idleSwing);
    ctx.stroke();

    drawCartoonGlove(ctx, bx - 44, by - 90 + idleSwing, 0.9, 0.9, 0.2, 'fist');
    drawCartoonGlove(ctx, bx + 44, by - 90 - idleSwing, -0.9, 0.9, -0.2, 'fist');
  }

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, world: WorldState): void {
  for (const pt of world.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color === 'white' ? '#f6f3ec' : pt.color === 'gray' ? '#8c8a83' : '#090909';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFilmOverlay(ctx: CanvasRenderingContext2D, world: WorldState): void {
  // Subtle film grain tile
  const grain = getGrainCanvas();
  const pat = ctx.createPattern(grain, 'repeat');
  if (pat) {
    ctx.save();
    ctx.translate((Math.random() * 128) | 0, (Math.random() * 128) | 0);
    ctx.fillStyle = pat;
    ctx.fillRect(-128, -128, VIEW_WIDTH + 256, VIEW_HEIGHT + 256);
    ctx.restore();
  }

  // Occasional subtle 1920s vertical reel scratch
  if (Math.random() < 0.28) {
    const sx = Math.random() * VIEW_WIDTH;
    ctx.strokeStyle = 'rgba(244, 241, 234, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + (Math.random() - 0.5) * 6, VIEW_HEIGHT);
    ctx.stroke();
  }

  // Soft silent-film vignette
  const vig = ctx.createRadialGradient(
    VIEW_WIDTH / 2,
    VIEW_HEIGHT / 2,
    VIEW_WIDTH * 0.34,
    VIEW_WIDTH / 2,
    VIEW_HEIGHT / 2,
    VIEW_WIDTH * 0.72
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.52)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Silent-film iris transition (pit blink / checkpoint death / FIN)
  if (world.irisRadius < 0.995) {
    ctx.save();
    ctx.fillStyle = '#070707';
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    const px = world.player.x + world.player.w / 2 - world.cameraX;
    const py = world.player.y + world.player.h / 2 - world.cameraY;
    const r = Math.max(0, world.irisRadius * VIEW_WIDTH * 0.85);
    ctx.arc(px, py, r, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();
  }
}

export function renderWorld(ctx: CanvasRenderingContext2D, world: WorldState): void {
  ctx.save();

  // Camera shake offset
  let shakeX = 0;
  let shakeY = 0;
  if (world.shakeTimer > 0) {
    shakeX = (Math.random() - 0.5) * 2 * world.shakeIntensity;
    shakeY = (Math.random() - 0.5) * 2 * world.shakeIntensity;
  }

  // 1. Background parallax
  drawBackground(ctx, world);

  // 2. World space transform
  ctx.save();
  ctx.translate(-Math.round(world.cameraX + shakeX), -Math.round(world.cameraY + shakeY));

  drawTheaterBackdrop(ctx, world);
  drawProps(ctx, world);
  drawSignposts(ctx, world);
  drawCheckpointBooth(ctx, world);

  for (const plat of world.platforms) {
    // Viewport cull
    if (
      plat.x + plat.w < world.cameraX - 80 ||
      plat.x > world.cameraX + VIEW_WIDTH + 80
    ) {
      continue;
    }
    drawPlatform(ctx, plat);
  }

  for (const l of world.lanterns) {
    drawLantern(ctx, l);
  }

  for (const m of world.movingPlatforms) {
    drawMovingPlatform(ctx, m, world.time);
  }

  for (const c of world.crumblePlatforms) {
    drawCrumblePlatform(ctx, c, world.time);
  }

  drawInkPools(ctx, world);

  for (const b of world.beetles) {
    drawBeetle(ctx, b, world.time);
  }

  for (const bat of world.bats) {
    drawBat(ctx, bat, world.time);
  }

  drawBoss(ctx, world);
  drawPlayer(ctx, world);
  drawSlash(ctx, world);
  drawParticles(ctx, world);

  ctx.restore();

  // 3. Film grain, vignette & iris transitions
  drawFilmOverlay(ctx, world);

  ctx.restore();
}
