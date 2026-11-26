import { sound } from './audio';
import {
  SPAWN_X,
  SPAWN_Y,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createBats,
  createBeetles,
  createBossState,
  createInitialScarf,
} from './level';
import { InputState, Particle, Platform, SwingingLantern, WorldState } from './types';

const GRAVITY = 1480;
const JUMP_VEL = -590;
const APEX_VEL_THRESHOLD = 95;
const APEX_GRAVITY_MULT = 0.52;
const MAX_FALL_SPEED = 780;
const MOVE_SPEED = 315;
const GROUND_ACCEL = 2500;
const GROUND_DECEL = 2800;
const AIR_ACCEL = 1750;
const AIR_DECEL = 850;
const COYOTE_TIME = 0.115;
const JUMP_BUFFER_TIME = 0.125;

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function spawnParticles(
  world: WorldState,
  x: number,
  y: number,
  count: number,
  color: Particle['color'],
  speedMin = 40,
  speedMax = 210,
  gravity = 520,
  sizeMin = 2.5,
  sizeMax = 6
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    const maxLife = 0.25 + Math.random() * 0.35;
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 45,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      life: maxLife,
      maxLife,
      color,
      gravity,
    });
  }
}

function updateScarf(world: WorldState, dt: number, justLanded: boolean): void {
  const p = world.player;
  const scarf = p.scarf;
  if (scarf.length === 0) return;

  const anchorX = p.x + p.w * 0.5 - p.facing * 2;
  const anchorY = p.y + 15;
  scarf[0].x = anchorX;
  scarf[0].y = anchorY;
  scarf[0].vx = 0;
  scarf[0].vy = 0;

  const segLen = 6.2;
  const falling = !p.grounded && p.vy > 45;
  const fallFactor = falling ? clamp((p.vy - 45) / 360, 0, 1) : 0;

  for (let i = 1; i < scarf.length; i++) {
    const node = scarf[i];
    // Scarf trails upward when falling, swings forward on landing, trails behind when running
    if (justLanded) {
      node.vx += p.facing * (180 + i * 24);
      node.vy += 45;
    }

    const windX = -p.facing * (Math.abs(p.vx) > 25 ? 110 : 28) + Math.sin(world.time * 4.5 + i * 0.7) * 24;
    const upwardLift = falling ? -460 * fallFactor - i * 28 * fallFactor : 60;

    node.vx += (windX - node.vx * 3.8) * dt;
    node.vy += (upwardLift - node.vy * 3.4) * dt;

    node.x += node.vx * dt;
    node.y += node.vy * dt;
  }

  // Distance constraint solver (3 iterations for crisp ribbon feel)
  for (let iter = 0; iter < 3; iter++) {
    scarf[0].x = anchorX;
    scarf[0].y = anchorY;
    for (let i = 1; i < scarf.length; i++) {
      const prev = scarf[i - 1];
      const curr = scarf[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const diff = (dist - segLen) / dist;
      curr.x -= dx * diff;
      curr.y -= dy * diff;
    }
  }
}

function updateLanterns(world: WorldState, dt: number): void {
  for (const l of world.lanterns) {
    l.prevX = l.x;
    l.prevY = l.y;
    l.angle = Math.sin(world.time * l.speed + l.phase) * l.amplitudeRad;
    const cx = l.pivotX + Math.sin(l.angle) * l.length;
    const cy = l.pivotY + Math.cos(l.angle) * l.length;
    l.x = cx - l.w / 2;
    l.y = cy;
  }
  void dt;
}

function updateMovingPlatforms(world: WorldState): void {
  for (const m of world.movingPlatforms) {
    m.prevX = m.x;
    m.prevY = m.y;
    const s = Math.sin(world.time * m.speed + m.phase);
    m.x = m.baseX + s * m.rangeX;
    m.y = m.baseY + s * m.rangeY;
  }
}

function updateCrumblePlatforms(world: WorldState, dt: number): void {
  for (const c of world.crumblePlatforms) {
    if (c.state === 'shaking') {
      c.timer -= dt;
      if (Math.random() < 0.35) {
        spawnParticles(
          world,
          c.x + 10 + Math.random() * (c.w - 20),
          c.y + c.h,
          1,
          'gray',
          10,
          45,
          360,
          2,
          3.5
        );
      }
      if (c.timer <= 0) {
        c.state = 'broken';
        c.timer = c.respawnDuration;
        sound.crumbleCrack();
        spawnParticles(world, c.x + c.w / 2, c.y + c.h / 2, 12, 'white', 40, 140, 480, 2.5, 5);
      }
    } else if (c.state === 'broken') {
      c.timer -= dt;
      if (c.timer <= 0) {
        c.state = 'solid';
        c.timer = 0;
        spawnParticles(world, c.x + c.w / 2, c.y + c.h / 2, 6, 'gray', 20, 75, -40, 2, 4);
      }
    }
  }
}

function damagePlayer(world: WorldState, sourceX: number, fromPit = false): void {
  const p = world.player;
  if (!fromPit && p.invulnTimer > 0) return;
  if (world.irisMode !== 'open') return;

  p.hp = Math.max(0, p.hp - 1);
  world.hitsTaken += 1;
  p.invulnTimer = 1.25;
  world.shakeTimer = 0.22;
  world.shakeIntensity = 7;
  sound.hurt();
  spawnParticles(world, p.x + p.w / 2, p.y + p.h / 2, 14, 'black', 70, 250, 480, 3, 7);

  if (p.hp <= 0) {
    world.irisMode = 'closing_death';
    world.pendingRespawnType = 'checkpoint';
    return;
  }

  if (fromPit) {
    world.irisMode = 'closing_pit';
    world.pendingRespawnType = 'pit';
    return;
  }

  // Knockback
  const knockDir = p.x + p.w / 2 < sourceX ? -1 : 1;
  p.vx = knockDir * 240;
  p.vy = -290;
  p.grounded = false;
  p.onLanternId = null;
  p.onMovingId = null;
}

function performRespawn(world: WorldState): void {
  const p = world.player;
  for (const c of world.crumblePlatforms) {
    c.state = 'solid';
    c.timer = 0;
  }
  if (world.pendingRespawnType === 'pit') {
    p.x = p.lastSafeX;
    p.y = p.lastSafeY;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    p.onLanternId = null;
    p.onMovingId = null;
    p.invulnTimer = 1.1;
    p.scarf = createInitialScarf(p.x + p.w / 2, p.y);
  } else if (world.pendingRespawnType === 'checkpoint') {
    const rx = world.checkpoint.activated ? world.checkpoint.x : SPAWN_X;
    const ry = world.checkpoint.activated ? world.checkpoint.y - p.h : SPAWN_Y;
    p.x = rx;
    p.y = ry;
    p.vx = 0;
    p.vy = 0;
    p.hp = p.maxHp;
    p.grounded = false;
    p.onLanternId = null;
    p.onMovingId = null;
    p.invulnTimer = 1.0;
    p.lastSafeX = rx;
    p.lastSafeY = ry;
    p.scarf = createInitialScarf(p.x + p.w / 2, p.y);

    // Reset boss if checkpoint was reached (or full level enemies if start)
    if (world.checkpoint.activated) {
      world.boss = createBossState();
    } else {
      world.beetles = createBeetles();
      world.bats = createBats();
      world.boss = createBossState();
    }
  } else if (world.pendingRespawnType === 'fin') {
    world.screen = 'FIN';
    world.pendingRespawnType = 'none';
    world.irisMode = 'open';
    world.irisRadius = 1;
    return;
  }

  world.pendingRespawnType = 'none';
  world.irisMode = 'open';
}

function getSolidPlatforms(world: WorldState): Platform[] {
  if (world.boss.phase !== 'dormant' && world.boss.phase !== 'defeated_melt' && world.boss.phase !== 'door_open') {
    // Include temporary theater curtain gate on left of boss arena during fight
    return [
      ...world.platforms,
      {
        id: 'boss-gate-left',
        x: world.boss.arenaLeft - 24,
        y: 700,
        w: 24,
        h: 620,
        kind: 'stage',
        safeAnchor: false,
      },
    ];
  }
  return world.platforms;
}

function updatePlayer(world: WorldState, input: InputState, dt: number): void {
  const p = world.player;
  const solids = getSolidPlatforms(world);

  // Carry player with swinging lantern or moving platform if standing on one
  if (p.grounded && p.onLanternId) {
    const lantern = world.lanterns.find((l) => l.id === p.onLanternId);
    if (lantern) {
      p.x += lantern.x - lantern.prevX;
      p.y += lantern.y - lantern.prevY;
    }
  } else if (p.grounded && p.onMovingId) {
    const mp = world.movingPlatforms.find((m) => m.id === p.onMovingId);
    if (mp) {
      p.x += mp.x - mp.prevX;
      p.y += mp.y - mp.prevY;
    }
  }

  // Horizontal velocity
  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (moveDir !== 0) {
    p.facing = moveDir as 1 | -1;
    const accel = p.grounded ? GROUND_ACCEL : AIR_ACCEL;
    p.vx += moveDir * accel * dt;
    p.vx = clamp(p.vx, -MOVE_SPEED, MOVE_SPEED);
  } else {
    const decel = p.grounded ? GROUND_DECEL : AIR_DECEL;
    if (Math.abs(p.vx) <= decel * dt) {
      p.vx = 0;
    } else {
      p.vx -= Math.sign(p.vx) * decel * dt;
    }
  }

  // Timers
  if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
  if (p.slashCooldown > 0) p.slashCooldown = Math.max(0, p.slashCooldown - dt);
  if (p.slashTimer > 0) p.slashTimer = Math.max(0, p.slashTimer - dt);

  if (p.grounded) {
    p.coyoteTimer = COYOTE_TIME;
  } else {
    p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
  }

  if (input.jumpPressed) {
    p.jumpBufferTimer = JUMP_BUFFER_TIME;
  } else {
    p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
  }

  // Execute buffered/coyote jump
  if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
    p.vy = JUMP_VEL;
    p.grounded = false;
    p.onLanternId = null;
    p.onMovingId = null;
    p.coyoteTimer = 0;
    p.jumpBufferTimer = 0;
    p.jumpHeld = true;
    p.squashX = 0.8;
    p.squashY = 1.22;
    sound.jump();
    spawnParticles(world, p.x + p.w / 2, p.y + p.h, 6, 'white', 35, 110, 240, 2, 4.5);
  }

  // Variable jump height (tapped vs held)
  if (!input.jumpDown && p.jumpHeld && p.vy < -210) {
    p.vy *= 0.56;
    p.jumpHeld = false;
  }

  // Ori-style apex hang time
  const isNearApex = !p.grounded && Math.abs(p.vy) < APEX_VEL_THRESHOLD;
  const gMult = isNearApex ? APEX_GRAVITY_MULT : 1.0;
  p.vy = Math.min(MAX_FALL_SPEED, p.vy + GRAVITY * gMult * dt);

  // Slash trigger
  if (input.slashPressed && p.slashCooldown <= 0) {
    p.slashTimer = 0.17;
    p.slashCooldown = 0.27;
    const sw = 62;
    const sh = 50;
    const sx = p.facing === 1 ? p.x + p.w - 4 : p.x - sw + 4;
    const sy = p.y - 2;
    world.slash = {
      x: sx,
      y: sy,
      w: sw,
      h: sh,
      dir: p.facing,
      timer: 0.17,
      duration: 0.17,
      hitIds: new Set<string>(),
    };
    sound.slash();
  }

  // Move X & resolve horizontal collisions
  p.x += p.vx * dt;
  for (const plat of solids) {
    if (rectsOverlap(p.x, p.y + 3, p.w, p.h - 6, plat.x, plat.y, plat.w, plat.h)) {
      if (p.vx > 0) {
        p.x = plat.x - p.w;
        p.vx = 0;
      } else if (p.vx < 0) {
        p.x = plat.x + plat.w;
        p.vx = 0;
      }
    }
  }

  // Move Y & resolve vertical collisions
  const wasGrounded = p.grounded;
  const prevBottom = p.y + p.h;
  p.y += p.vy * dt;
  p.grounded = false;
  p.onLanternId = null;
  p.onMovingId = null;

  let landedOnSafeAnchor: Platform | null = null;

  // Static solid platforms
  for (const plat of solids) {
    if (rectsOverlap(p.x + 2, p.y, p.w - 4, p.h, plat.x, plat.y, plat.w, plat.h)) {
      if (p.vy >= 0 && prevBottom <= plat.y + 16) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.grounded = true;
        if (plat.safeAnchor) {
          landedOnSafeAnchor = plat;
        }
      } else if (p.vy < 0 && p.y - p.vy * dt >= plat.y + plat.h - 14) {
        p.y = plat.y + plat.h;
        p.vy = 0;
      }
    }
  }

  // Disintegrating platforms (one-way top landing)
  if (!p.grounded && p.vy >= 0) {
    for (const c of world.crumblePlatforms) {
      if (c.state === 'broken') continue;
      if (
        p.x + p.w - 3 > c.x &&
        p.x + 3 < c.x + c.w &&
        prevBottom <= c.y + 16 &&
        p.y + p.h >= c.y
      ) {
        p.y = c.y - p.h;
        p.vy = 0;
        p.grounded = true;
        if (c.state === 'solid') {
          c.state = 'shaking';
          c.timer = c.shakeDuration;
          sound.crumbleCrack();
        }
        break;
      }
    }
  }

  // Moving pulley platforms (one-way top landing)
  if (!p.grounded && p.vy >= 0) {
    for (const m of world.movingPlatforms) {
      if (
        p.x + p.w - 3 > m.x &&
        p.x + 3 < m.x + m.w &&
        prevBottom <= m.prevY + 16 &&
        p.y + p.h >= m.y
      ) {
        p.y = m.y - p.h;
        p.vy = 0;
        p.grounded = true;
        p.onMovingId = m.id;
        break;
      }
    }
  }

  // Swinging lantern platforms (one-way top landing so jumping up from underneath never snags)
  if (!p.grounded && p.vy >= 0) {
    for (const l of world.lanterns) {
      const prevLanternTop = l.prevY;
      if (
        p.x + p.w - 3 > l.x &&
        p.x + 3 < l.x + l.w &&
        prevBottom <= prevLanternTop + 14 &&
        p.y + p.h >= l.y
      ) {
        p.y = l.y - p.h;
        p.vy = 0;
        p.grounded = true;
        p.onLanternId = l.id;
        break;
      }
    }
  }

  const justLanded = !wasGrounded && p.grounded;
  if (justLanded) {
    p.squashX = 1.24;
    p.squashY = 0.78;
    p.jumpHeld = false;
    sound.land();
    spawnParticles(world, p.x + p.w / 2, p.y + p.h, 5, 'white', 30, 95, 280, 2, 4);
  }

  // Save last safe ground when solidly inside a safeAnchor platform (away from edges)
  if (p.grounded && landedOnSafeAnchor) {
    const margin = 22;
    if (
      p.x >= landedOnSafeAnchor.x + margin &&
      p.x + p.w <= landedOnSafeAnchor.x + landedOnSafeAnchor.w - margin
    ) {
      p.lastSafeX = p.x;
      p.lastSafeY = landedOnSafeAnchor.y - p.h;
    }
  }

  // Squash/stretch spring recovery
  p.squashX += (1 - p.squashX) * Math.min(1, 14 * dt);
  p.squashY += (1 - p.squashY) * Math.min(1, 14 * dt);

  if (p.grounded && Math.abs(p.vx) > 20) {
    p.runCycle += dt * (Math.abs(p.vx) / 36);
  }

  // Check ink pools & pit bottom
  for (const pool of world.inkPools) {
    if (rectsOverlap(p.x + 4, p.y + 8, p.w - 8, p.h - 10, pool.x, pool.y + 10, pool.w, pool.h)) {
      spawnParticles(world, p.x + p.w / 2, pool.y + 12, 14, 'black', 60, 210, 480, 3, 6);
      damagePlayer(world, p.x + p.w / 2, true);
      break;
    }
  }

  if (p.y > world.pitBottomY) {
    damagePlayer(world, p.x + p.w / 2, true);
  }

  updateScarf(world, dt, justLanded);
}

function updateSlash(world: WorldState, dt: number): void {
  const s = world.slash;
  if (!s) return;

  // Keep slash anchored in front of player as they move
  const p = world.player;
  s.x = s.dir === 1 ? p.x + p.w - 4 : p.x - s.w + 4;
  s.y = p.y - 2;
  s.timer -= dt;

  // Check beetles
  for (const b of world.beetles) {
    if (b.dead || s.hitIds.has(b.id)) continue;
    if (rectsOverlap(s.x, s.y, s.w, s.h, b.x, b.y, b.w, b.h)) {
      s.hitIds.add(b.id);
      b.hp -= 1;
      b.flashTimer = 0.14;
      b.stunTimer = 0.32;
      b.vx = s.dir * 160;
      world.shakeTimer = 0.09;
      world.shakeIntensity = 3.5;
      spawnParticles(world, b.x + b.w / 2, b.y + b.h / 2, 10, 'white', 60, 220, 400, 2.5, 5.5);
      if (b.hp <= 0) {
        b.dead = true;
        sound.killEnemy();
        spawnParticles(world, b.x + b.w / 2, b.y + b.h / 2, 16, 'black', 80, 260, 520, 3, 7);
      } else {
        sound.hitEnemy();
      }
    }
  }

  // Check bats
  for (const bat of world.bats) {
    if (bat.phase === 'dead' || s.hitIds.has(bat.id)) continue;
    if (
      rectsOverlap(
        s.x,
        s.y,
        s.w,
        s.h,
        bat.x - bat.r,
        bat.y - bat.r,
        bat.r * 2,
        bat.r * 2
      )
    ) {
      s.hitIds.add(bat.id);
      bat.hp -= 1;
      bat.flashTimer = 0.14;
      world.shakeTimer = 0.09;
      world.shakeIntensity = 3.5;
      spawnParticles(world, bat.x, bat.y, 12, 'black', 70, 230, 350, 3, 6);
      if (bat.hp <= 0) {
        bat.phase = 'dead';
        sound.killEnemy();
      } else {
        sound.hitEnemy();
      }
    }
  }

  // Check boss (The Ink Usher)
  const boss = world.boss;
  if (!s.hitIds.has('boss')) {
    let hitTarget = false;

    // Stuck gloves during slam_stuck are the primary vulnerable window
    if (boss.phase === 'slam_stuck' && boss.slamStuckGloveBox) {
      const g = boss.slamStuckGloveBox;
      if (rectsOverlap(s.x, s.y, s.w, s.h, g.x, g.y, g.w, g.h)) {
        hitTarget = true;
      }
    }
    // Also allow hitting the Usher during sweep_recover (leaning down after sweeping) or mid-air slash on body during sweep_attack
    else if (boss.phase === 'sweep_recover' || boss.phase === 'sweep_attack') {
      const bx = boss.bodyX - 42;
      const by = boss.bodyY - 140;
      if (rectsOverlap(s.x, s.y, s.w, s.h, bx, by, 84, 140)) {
        hitTarget = true;
      }
    }

    if (hitTarget && boss.hp > 0) {
      s.hitIds.add('boss');
      boss.hp = Math.max(0, boss.hp - 1);
      boss.flashTimer = 0.16;
      world.shakeTimer = 0.14;
      world.shakeIntensity = 5.5;
      sound.bossHit();
      spawnParticles(
        world,
        s.x + s.w / 2,
        s.y + s.h / 2,
        14,
        'white',
        80,
        260,
        420,
        3,
        6.5
      );

      if (boss.hp <= 0) {
        boss.phase = 'defeated_melt';
        boss.phaseTimer = 1.8;
        boss.sweepActive = false;
        boss.slamActive = false;
        boss.slamStuckGloveBox = null;
        sound.bossMelt();
        spawnParticles(world, boss.bodyX, boss.floorY - 60, 28, 'black', 80, 320, 500, 4, 9);
      }
    }
  }

  if (s.timer <= 0) {
    world.slash = null;
  }
}

function updateBeetles(world: WorldState, dt: number): void {
  const p = world.player;
  for (const b of world.beetles) {
    if (b.dead) continue;
    if (b.flashTimer > 0) b.flashTimer = Math.max(0, b.flashTimer - dt);

    if (b.stunTimer > 0) {
      b.stunTimer = Math.max(0, b.stunTimer - dt);
      b.x += b.vx * dt;
      b.vx *= Math.max(0, 1 - 8 * dt);
      b.x = clamp(b.x, b.minX, b.maxX - b.w);
      if (b.stunTimer === 0) {
        b.vx = b.facing * b.speed;
      }
    } else {
      b.animTime += dt * 7;
      b.x += b.vx * dt;
      if (b.x <= b.minX) {
        b.x = b.minX;
        b.facing = 1;
        b.vx = b.speed;
      } else if (b.x + b.w >= b.maxX) {
        b.x = b.maxX - b.w;
        b.facing = -1;
        b.vx = -b.speed;
      }
    }

    // Contact hazard with player
    if (
      b.stunTimer <= 0.05 &&
      rectsOverlap(p.x + 4, p.y + 4, p.w - 8, p.h - 6, b.x + 4, b.y + 4, b.w - 8, b.h - 4)
    ) {
      damagePlayer(world, b.x + b.w / 2);
    }
  }
}

function updateBats(world: WorldState, dt: number): void {
  const p = world.player;
  const px = p.x + p.w / 2;
  const py = p.y + p.h / 2;

  for (const bat of world.bats) {
    if (bat.phase === 'dead') continue;
    if (bat.flashTimer > 0) bat.flashTimer = Math.max(0, bat.flashTimer - dt);
    bat.wingTime += dt * (bat.phase === 'swoop' ? 16 : 9);

    if (bat.phase === 'perched') {
      const dist = Math.hypot(px - bat.homeX, py - bat.homeY);
      if (dist < bat.triggerRadius && py > bat.homeY - 40) {
        bat.phase = 'telegraph';
        bat.phaseTimer = 0.65;
        bat.facing = px < bat.homeX ? -1 : 1;
        bat.swoopStartX = bat.homeX;
        bat.swoopStartY = bat.homeY;
        bat.swoopPeakX = bat.homeX + bat.facing * 75;
        bat.swoopPeakY = Math.min(py + 12, bat.homeY + 155);
        bat.swoopEndX = bat.homeX + bat.facing * 170;
        bat.swoopEndY = bat.homeY + 12;
        sound.batScreech();
      }
    } else if (bat.phase === 'telegraph') {
      bat.phaseTimer -= dt;
      bat.x = bat.homeX + Math.sin(world.time * 45) * 2.5;
      bat.y = bat.homeY + 6;
      if (bat.phaseTimer <= 0) {
        bat.phase = 'swoop';
        bat.phaseTimer = 0;
      }
    } else if (bat.phase === 'swoop') {
      bat.phaseTimer += dt * 1.15;
      const t = clamp(bat.phaseTimer, 0, 1);
      // Quadratic Bezier swoop arc
      const u = 1 - t;
      bat.x = u * u * bat.swoopStartX + 2 * u * t * bat.swoopPeakX + t * t * bat.swoopEndX;
      bat.y = u * u * bat.swoopStartY + 2 * u * t * bat.swoopPeakY + t * t * bat.swoopEndY;
      if (t >= 1) {
        bat.phase = 'recover';
        bat.phaseTimer = 0;
      }
    } else if (bat.phase === 'recover') {
      bat.phaseTimer += dt * 0.75;
      const t = clamp(bat.phaseTimer, 0, 1);
      bat.x = bat.swoopEndX + (bat.homeX - bat.swoopEndX) * t;
      bat.y = bat.swoopEndY + (bat.homeY - bat.swoopEndY) * t;
      if (t >= 1) {
        bat.x = bat.homeX;
        bat.y = bat.homeY;
        bat.phase = 'perched';
      }
    }

    // Contact hazard
    if (
      bat.phase === 'swoop' &&
      rectsOverlap(p.x + 4, p.y + 4, p.w - 8, p.h - 8, bat.x - 13, bat.y - 11, 26, 22)
    ) {
      damagePlayer(world, bat.x);
    }
  }
}

function updateCheckpointAndStretches(world: WorldState, dt: number): void {
  const p = world.player;

  // Stretch banner labels
  if (world.stretchBannerTimer > 0) {
    world.stretchBannerTimer = Math.max(0, world.stretchBannerTimer - dt);
  }
  if (p.x > 4660 && p.x < 4860 && world.stretchLabel !== 'ACT II · THE LANTERN CHASM') {
    world.stretchLabel = 'ACT II · THE LANTERN CHASM';
    world.stretchBannerTimer = 2.6;
  } else if (p.x > 10440 && p.x < 10680 && world.stretchLabel !== 'ACT III · THE PROJECTION GALLERY') {
    world.stretchLabel = 'ACT III · THE PROJECTION GALLERY';
    world.stretchBannerTimer = 2.6;
  }

  // Projector booth checkpoint
  const cp = world.checkpoint;
  if (!cp.activated && p.x >= cp.triggerX) {
    cp.activated = true;
    cp.bannerTimer = 2.8;
    p.hp = p.maxHp;
    p.lastSafeX = cp.x;
    p.lastSafeY = cp.y - p.h;
    sound.checkpoint();
    spawnParticles(world, cp.x + 20, cp.y - 45, 16, 'white', 40, 160, 160, 2.5, 5);
  }
  if (cp.bannerTimer > 0) {
    cp.bannerTimer = Math.max(0, cp.bannerTimer - dt);
  }
}

function startBossAttack(world: WorldState, kind: 'sweep' | 'slam'): void {
  const boss = world.boss;
  const p = world.player;
  const centerX = (boss.arenaLeft + boss.arenaRight) / 2;

  if (kind === 'sweep') {
    boss.phase = 'sweep_telegraph';
    boss.phaseTimer = boss.hp <= 3 ? 0.78 : 0.92;
    const fromRight = p.x + p.w / 2 < centerX;
    boss.facing = fromRight ? -1 : 1;
    boss.bodyX = fromRight ? boss.arenaRight - 170 : boss.arenaLeft + 170;
    boss.sweepStartX = fromRight ? boss.arenaRight - 140 : boss.arenaLeft + 140;
    boss.sweepEndX = fromRight ? boss.arenaLeft + 75 : boss.arenaRight - 75;
    boss.sweepGloveX = boss.sweepStartX;
    boss.sweepGloveY = boss.floorY - 24;
    boss.sweepActive = false;
    sound.bossTelegraph();
  } else {
    boss.phase = 'slam_aim';
    boss.phaseTimer = boss.hp <= 3 ? 0.72 : 0.88;
    boss.slamTargetX = clamp(p.x + p.w / 2, boss.arenaLeft + 110, boss.arenaRight - 110);
    boss.bodyX = boss.slamTargetX;
    boss.slamFistsY = boss.floorY - 265;
    boss.slamActive = false;
    boss.slamStuckGloveBox = null;
    sound.bossTelegraph();
  }
}

function updateBoss(world: WorldState, dt: number): void {
  const boss = world.boss;
  const p = world.player;
  if (boss.flashTimer > 0) boss.flashTimer = Math.max(0, boss.flashTimer - dt);

  if (boss.phase === 'dormant') {
    // Enter theater
    if (p.x >= boss.arenaLeft + 135) {
      boss.phase = 'intro';
      boss.phaseTimer = 2.7;
      boss.introProgress = 0;
      world.stretchLabel = 'THE UNDERGROUND THEATER · THE INK USHER';
      world.stretchBannerTimer = 2.8;
      sound.projectorSputter();
    }
    return;
  }

  if (boss.phase === 'intro') {
    boss.phaseTimer -= dt;
    boss.introProgress = clamp(1 - boss.phaseTimer / 2.7, 0, 1);
    if (boss.phaseTimer <= 0) {
      boss.phase = 'idle';
      boss.phaseTimer = 0.55;
    }
    return;
  }

  if (boss.phase === 'idle') {
    boss.phaseTimer -= dt;
    if (boss.phaseTimer <= 0) {
      // Teach each attack on its own first, then alternate
      if (!boss.taughtSweep) {
        boss.taughtSweep = true;
        boss.nextPattern = 'slam';
        startBossAttack(world, 'sweep');
      } else if (!boss.taughtSlam) {
        boss.taughtSlam = true;
        boss.nextPattern = 'sweep';
        startBossAttack(world, 'slam');
      } else {
        const chosen = boss.nextPattern;
        boss.nextPattern = chosen === 'sweep' ? 'slam' : 'sweep';
        startBossAttack(world, chosen);
      }
    }
    return;
  }

  if (boss.phase === 'sweep_telegraph') {
    boss.phaseTimer -= dt;
    if (boss.phaseTimer <= 0) {
      boss.phase = 'sweep_attack';
      boss.phaseTimer = boss.hp <= 3 ? 1.38 : 1.62;
      boss.sweepActive = true;
      sound.bossSweep();
    }
    return;
  }

  if (boss.phase === 'sweep_attack') {
    const dur = boss.hp <= 3 ? 1.38 : 1.62;
    boss.phaseTimer -= dt;
    const t = clamp(1 - boss.phaseTimer / dur, 0, 1);
    // Smooth ease in-out sweep across the floor
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    boss.sweepGloveX = boss.sweepStartX + (boss.sweepEndX - boss.sweepStartX) * eased;
    boss.sweepGloveY = boss.floorY - 22;
    boss.bodyX = boss.sweepGloveX - boss.facing * 75;

    // Sweep glove hazard (low along floor; easily cleared by jumping!)
    if (
      rectsOverlap(
        p.x + 4,
        p.y + 4,
        p.w - 8,
        p.h - 4,
        boss.sweepGloveX - 42,
        boss.floorY - 40,
        84,
        40
      )
    ) {
      damagePlayer(world, boss.sweepGloveX);
    }

    if (boss.phaseTimer <= 0) {
      boss.sweepActive = false;
      boss.phase = 'sweep_recover';
      boss.phaseTimer = 0.85;
    }
    return;
  }

  if (boss.phase === 'sweep_recover') {
    boss.phaseTimer -= dt;
    if (boss.phaseTimer <= 0) {
      boss.phase = 'idle';
      boss.phaseTimer = 0.45;
    }
    return;
  }

  if (boss.phase === 'slam_aim') {
    boss.phaseTimer -= dt;
    const desiredX = clamp(p.x + p.w / 2, boss.arenaLeft + 115, boss.arenaRight - 115);
    boss.slamTargetX += (desiredX - boss.slamTargetX) * Math.min(1, 5.5 * dt);
    boss.bodyX = boss.slamTargetX;
    boss.slamFistsY = boss.floorY - 265 + Math.sin(world.time * 10) * 6;
    if (boss.phaseTimer <= 0) {
      boss.phase = 'slam_pause';
      boss.phaseTimer = boss.hp <= 3 ? 0.46 : 0.56;
    }
    return;
  }

  if (boss.phase === 'slam_pause') {
    // Locked target — player moves aside!
    boss.phaseTimer -= dt;
    if (boss.phaseTimer <= 0) {
      boss.phase = 'slam_drop';
      boss.phaseTimer = 0.22;
      boss.slamActive = true;
    }
    return;
  }

  if (boss.phase === 'slam_drop') {
    boss.phaseTimer -= dt;
    const t = clamp(1 - boss.phaseTimer / 0.22, 0, 1);
    boss.slamFistsY = boss.floorY - 265 + (235) * (t * t);

    // Falling fist hitbox
    if (
      rectsOverlap(
        p.x + 4,
        p.y + 4,
        p.w - 8,
        p.h - 4,
        boss.slamTargetX - 54,
        boss.slamFistsY - 28,
        108,
        56
      )
    ) {
      damagePlayer(world, boss.slamTargetX);
    }

    if (boss.phaseTimer <= 0) {
      boss.slamFistsY = boss.floorY - 30;
      boss.slamActive = false;
      boss.phase = 'slam_stuck';
      boss.phaseTimer = boss.hp <= 3 ? 1.6 : 1.85;
      boss.slamStuckGloveBox = {
        x: boss.slamTargetX - 56,
        y: boss.floorY - 56,
        w: 112,
        h: 56,
      };
      world.shakeTimer = 0.25;
      world.shakeIntensity = 9;
      sound.bossSlam();
      spawnParticles(world, boss.slamTargetX - 35, boss.floorY, 10, 'white', 70, 220, 420, 3, 6);
      spawnParticles(world, boss.slamTargetX + 35, boss.floorY, 10, 'white', 70, 220, 420, 3, 6);
    }
    return;
  }

  if (boss.phase === 'slam_stuck') {
    boss.phaseTimer -= dt;
    if (boss.phaseTimer <= 0) {
      boss.slamStuckGloveBox = null;
      boss.phase = 'idle';
      boss.phaseTimer = 0.5;
    }
    return;
  }

  if (boss.phase === 'defeated_melt') {
    boss.phaseTimer -= dt;
    boss.puddleSpread = clamp(1 - boss.phaseTimer / 1.8, 0, 1);
    if (boss.phaseTimer <= 0) {
      boss.phase = 'door_open';
      boss.doorwayOpenProgress = 0;
    }
    return;
  }

  if (boss.phase === 'door_open') {
    boss.doorwayOpenProgress = Math.min(1, boss.doorwayOpenProgress + dt * 1.4);
    // Player walks through the glowing white doorway to end the game
    if (
      boss.doorwayOpenProgress > 0.65 &&
      rectsOverlap(
        p.x + 6,
        p.y + 6,
        p.w - 12,
        p.h - 6,
        boss.doorwayX + 12,
        boss.doorwayY + 20,
        boss.doorwayW - 24,
        boss.doorwayH - 20
      )
    ) {
      if (world.irisMode === 'open') {
        world.irisMode = 'closing_fin';
        world.pendingRespawnType = 'fin';
        sound.finChord();
      }
    }
  }
}

function updateCamera(world: WorldState, dt: number): void {
  const p = world.player;
  const boss = world.boss;

  let targetX = p.x + p.w / 2 - VIEW_WIDTH * 0.36;
  let targetY = p.y + p.h / 2 - VIEW_HEIGHT * 0.56;

  // Lock camera cinematically onto theater once boss fight begins
  if (boss.phase !== 'dormant') {
    targetX = boss.arenaLeft - 10;
    targetY = boss.floorY - VIEW_HEIGHT + 115;
  }

  targetX = clamp(targetX, 0, world.worldWidth - VIEW_WIDTH);
  targetY = clamp(targetY, -40, world.worldHeight - VIEW_HEIGHT);

  world.cameraX += (targetX - world.cameraX) * Math.min(1, 6.5 * dt);
  world.cameraY += (targetY - world.cameraY) * Math.min(1, 5.2 * dt);

  if (world.shakeTimer > 0) {
    world.shakeTimer = Math.max(0, world.shakeTimer - dt);
  }
}

function updateParticles(world: WorldState, dt: number): void {
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const pt = world.particles[i];
    pt.life -= dt;
    if (pt.life <= 0) {
      world.particles.splice(i, 1);
      continue;
    }
    pt.vy += pt.gravity * dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  }
}

export function stepWorld(world: WorldState, input: InputState, rawDt: number): void {
  const dt = Math.min(rawDt, 0.033);
  world.time += dt;

  if (world.screen !== 'PLAYING') {
    return;
  }

  world.runTime += dt;

  // Handle iris transitions (pit blink, checkpoint death, FIN ending)
  if (world.irisMode !== 'open') {
    const speed = world.irisMode === 'closing_pit' ? 3.8 : 2.1;
    world.irisRadius = Math.max(0, world.irisRadius - dt * speed);
    if (world.irisRadius <= 0) {
      performRespawn(world);
    }
    updateCamera(world, dt);
    updateParticles(world, dt);
    return;
  } else if (world.irisRadius < 1) {
    world.irisRadius = Math.min(1, world.irisRadius + dt * 3.4);
  }

  updateLanterns(world, dt);
  updateMovingPlatforms(world);
  updateCrumblePlatforms(world, dt);
  updatePlayer(world, input, dt);
  updateSlash(world, dt);
  updateBeetles(world, dt);
  updateBats(world, dt);
  updateCheckpointAndStretches(world, dt);
  updateBoss(world, dt);
  updateCamera(world, dt);
  updateParticles(world, dt);
}
