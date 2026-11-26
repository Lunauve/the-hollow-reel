import {
  BatEnemy,
  BeetleEnemy,
  BossState,
  CheckpointState,
  CrumblePlatform,
  InkPool,
  MovingPlatform,
  Platform,
  PropDeco,
  ScarfNode,
  Signpost,
  SwingingLantern,
  WorldState,
} from './types';

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

export const SPAWN_X = 140;
export const SPAWN_Y = 454;

export function createInitialScarf(x: number, y: number): ScarfNode[] {
  const nodes: ScarfNode[] = [];
  for (let i = 0; i < 8; i++) {
    nodes.push({ x: x - i * 6, y: y + 14, vx: 0, vy: 0 });
  }
  return nodes;
}

export function createBossState(): BossState {
  const arenaLeft = 12615;
  const arenaRight = 13875;
  const floorY = 1300;
  const centerX = (arenaLeft + arenaRight) / 2;

  return {
    phase: 'dormant',
    phaseTimer: 0,
    introProgress: 0,
    hp: 6,
    maxHp: 6,
    flashTimer: 0,
    taughtSweep: false,
    taughtSlam: false,
    nextPattern: 'sweep',
    arenaLeft,
    arenaRight,
    floorY,
    bodyX: centerX + 160,
    bodyY: floorY,
    facing: -1,
    sweepStartX: arenaRight - 140,
    sweepEndX: arenaLeft + 90,
    sweepGloveX: arenaRight - 140,
    sweepGloveY: floorY - 26,
    sweepActive: false,
    slamTargetX: centerX,
    slamFistsY: floorY - 260,
    slamActive: false,
    slamStuckGloveBox: null,
    puddleSpread: 0,
    doorwayOpenProgress: 0,
    doorwayX: centerX - 44,
    doorwayY: floorY - 150,
    doorwayW: 88,
    doorwayH: 150,
  };
}

export function createLevelPlatforms(): Platform[] {
  return [
    // Left cavern boundary wall
    { id: 'wall-left', x: -120, y: -100, w: 160, h: 1100, kind: 'rock', safeAnchor: false },

    // STRETCH 1: Sunless Entry & Sunken Rails
    { id: 's1-start', x: 40, y: 500, w: 500, h: 420, kind: 'rock', safeAnchor: true },
    // Easy gap 1: 110px (540 -> 650), dy = -15
    { id: 's1-hop1', x: 650, y: 485, w: 310, h: 435, kind: 'rock', safeAnchor: true },
    // Easy gap 2: 150px (960 -> 1110), dy = -20
    { id: 's1-hop2', x: 1110, y: 465, w: 330, h: 455, kind: 'rock', safeAnchor: true },
    // Lower safety shelf beneath first crumbling platform so player learns safely
    { id: 's1-crumble1-catch', x: 1520, y: 590, w: 230, h: 360, kind: 'rock', safeAnchor: true },
    // Descent step (gap from crumble-1: 120px)
    { id: 's1-desc1', x: 1795, y: 565, w: 280, h: 420, kind: 'rock', safeAnchor: true },
    // Ink pool near shore (gap 120, dy +85)
    { id: 's1-shore-l', x: 2195, y: 650, w: 280, h: 420, kind: 'rock', safeAnchor: true },
    // Broken mine carts + crumbling slab across ink pool
    { id: 's1-cart1', x: 2590, y: 655, w: 105, h: 48, kind: 'cart', cartTilt: -0.06, safeAnchor: false },
    // (crumble-2 sits at x: 2825..2925, y: 640)
    { id: 's1-cart2', x: 3060, y: 655, w: 110, h: 48, kind: 'cart', cartTilt: 0.05, safeAnchor: false },
    { id: 's1-cart3', x: 3295, y: 660, w: 105, h: 48, kind: 'cart', cartTilt: -0.04, safeAnchor: false },
    // Wide beetle ledge (gap 125)
    { id: 's1-beetle-ledge', x: 3525, y: 660, w: 640, h: 460, kind: 'rock', safeAnchor: true },

    // STRETCH 2: Lantern Chasm, Moving Pulleys & Crumbling Spans
    // (move-1 glides horizontally between x: 4250..4460 at y: 700, w: 104)
    { id: 's2-step1', x: 4655, y: 720, w: 325, h: 460, kind: 'rock', safeAnchor: true },
    // Beetle bridge (gap 135, dy +75)
    { id: 's2-beetle2', x: 5115, y: 795, w: 540, h: 460, kind: 'bridge', safeAnchor: true },
    // Shallow safety basin beneath first swinging lantern
    { id: 's2-shallow-floor', x: 5655, y: 885, w: 480, h: 380, kind: 'rock', safeAnchor: true },
    { id: 's2-shallow-step-l', x: 5695, y: 840, w: 85, h: 45, kind: 'bridge', safeAnchor: false },
    { id: 's2-shallow-step-r', x: 6030, y: 840, w: 85, h: 45, kind: 'bridge', safeAnchor: false },
    // Landing after first swinging lantern
    { id: 's2-lantern1-end', x: 6135, y: 795, w: 440, h: 460, kind: 'rock', safeAnchor: true },
    // (crumble-3 at 6695..6790, crumble-4 at 6930..7025 over ink fissure)
    // Bat trestle ledge (gap 120)
    { id: 's2-bat1-ledge', x: 7145, y: 870, w: 500, h: 460, kind: 'bridge', safeAnchor: true },
    // (move-2 vertical elevator glides y: 870..955 at x: 7775..7880)
    // Beetle #3 ledge (gap 130)
    { id: 's2-beetle3', x: 8010, y: 955, w: 480, h: 480, kind: 'rock', safeAnchor: true },
    // Wide pit central pillar (reached via Lantern #2)
    { id: 's2-pillar', x: 8945, y: 945, w: 140, h: 460, kind: 'pillar', safeAnchor: true },
    // Wide pit far landing (reached via Lantern #3)
    { id: 's2-wide-end', x: 9470, y: 955, w: 480, h: 480, kind: 'rock', safeAnchor: true },

    // STRETCH 3: Projection Gallery & Booth Checkpoint
    // (move-3 glides horizontally x: 10040..10240 at y: 1015, w: 100)
    { id: 's3-step1', x: 10435, y: 1040, w: 340, h: 480, kind: 'rock', safeAnchor: true },
    // (crumble-5 sits at x: 10910..11005, y: 1085)
    { id: 's3-step2', x: 11145, y: 1120, w: 425, h: 480, kind: 'bridge', safeAnchor: true },
    // Cart 4 over narrow fissure (gap 125, dy +10)
    { id: 's3-cart4', x: 11695, y: 1130, w: 115, h: 48, kind: 'cart', cartTilt: 0.04, safeAnchor: false },
    // Projector Booth Checkpoint ledge (gap 125, dy +60)
    { id: 's3-booth', x: 11935, y: 1190, w: 560, h: 520, kind: 'rock', safeAnchor: true },
    // Theater threshold step down
    { id: 's3-stair', x: 12495, y: 1245, w: 120, h: 465, kind: 'stage', safeAnchor: true },

    // BOSS ARENA: Underground Theater
    { id: 'boss-stage', x: 12615, y: 1300, w: 1260, h: 420, kind: 'stage', safeAnchor: true },
    { id: 'boss-wall-right', x: 13875, y: 600, w: 220, h: 1120, kind: 'rock', safeAnchor: false },
  ];
}

export function createLanterns(): SwingingLantern[] {
  return [
    {
      id: 'lantern-1',
      pivotX: 5895,
      pivotY: 480,
      length: 300,
      amplitudeRad: 0.34,
      speed: 1.55,
      phase: 0,
      w: 98,
      h: 22,
      x: 5895 - 49,
      y: 780,
      prevX: 5895 - 49,
      prevY: 780,
      angle: 0,
    },
    {
      id: 'lantern-2',
      pivotX: 8725,
      pivotY: 635,
      length: 305,
      amplitudeRad: 0.34,
      speed: 1.5,
      phase: 0.2,
      w: 98,
      h: 22,
      x: 8725 - 49,
      y: 940,
      prevX: 8725 - 49,
      prevY: 940,
      angle: 0,
    },
    {
      id: 'lantern-3',
      pivotX: 9280,
      pivotY: 635,
      length: 305,
      amplitudeRad: 0.33,
      speed: 1.55,
      phase: 1.6,
      w: 98,
      h: 22,
      x: 9280 - 49,
      y: 940,
      prevX: 9280 - 49,
      prevY: 940,
      angle: 0,
    },
  ];
}

export function createMovingPlatforms(): MovingPlatform[] {
  return [
    {
      id: 'move-1',
      baseX: 4355,
      baseY: 700,
      rangeX: 105,
      rangeY: 0,
      speed: 1.45,
      phase: 0,
      w: 104,
      h: 20,
      x: 4355,
      y: 700,
      prevX: 4355,
      prevY: 700,
    },
    {
      id: 'move-2',
      baseX: 7775,
      baseY: 912,
      rangeX: 0,
      rangeY: 45,
      speed: 1.7,
      phase: 0.5,
      w: 105,
      h: 20,
      x: 7775,
      y: 912,
      prevX: 7775,
      prevY: 912,
    },
    {
      id: 'move-3',
      baseX: 10140,
      baseY: 1015,
      rangeX: 100,
      rangeY: 0,
      speed: 1.55,
      phase: 1.1,
      w: 102,
      h: 20,
      x: 10140,
      y: 1015,
      prevX: 10140,
      prevY: 1015,
    },
  ];
}

export function createCrumblePlatforms(): CrumblePlatform[] {
  return [
    {
      id: 'crumble-1',
      x: 1575,
      y: 505,
      w: 100,
      h: 22,
      state: 'solid',
      timer: 0,
      shakeDuration: 0.68,
      respawnDuration: 2.0,
    },
    {
      id: 'crumble-2',
      x: 2825,
      y: 640,
      w: 100,
      h: 22,
      state: 'solid',
      timer: 0,
      shakeDuration: 0.65,
      respawnDuration: 2.0,
    },
    {
      id: 'crumble-3',
      x: 6695,
      y: 820,
      w: 96,
      h: 22,
      state: 'solid',
      timer: 0,
      shakeDuration: 0.62,
      respawnDuration: 2.0,
    },
    {
      id: 'crumble-4',
      x: 6930,
      y: 845,
      w: 96,
      h: 22,
      state: 'solid',
      timer: 0,
      shakeDuration: 0.62,
      respawnDuration: 2.0,
    },
    {
      id: 'crumble-5',
      x: 10910,
      y: 1085,
      w: 96,
      h: 22,
      state: 'solid',
      timer: 0,
      shakeDuration: 0.6,
      respawnDuration: 2.0,
    },
  ];
}

export function createInkPools(): InkPool[] {
  return [
    { id: 'pool-carts', x: 2475, y: 725, w: 1050, h: 260 },
    { id: 'pool-crumble', x: 6575, y: 970, w: 570, h: 260 },
    { id: 'pool-wide-pit', x: 8490, y: 1135, w: 980, h: 280 },
    { id: 'pool-s3', x: 11575, y: 1245, w: 360, h: 260 },
  ];
}

export function createSignposts(): Signpost[] {
  return [
    {
      x: 250,
      y: 500,
      title: 'CAVERN SIGN',
      lines: [
        'A / D or ARROWS : MOVE',
        'SPACE / Z : JUMP (HOLD FOR FARTHER)',
        'X / J : SWORD SLASH',
      ],
    },
  ];
}

export function createProps(): PropDeco[] {
  return [
    { kind: 'arch', x: 110, y: 500, scale: 1.15 },
    { kind: 'column', x: 380, y: 500, scale: 1 },
    { kind: 'lamp', x: 460, y: 500, scale: 1 },
    { kind: 'stalactite', x: 600, y: 70, scale: 1.15 },
    { kind: 'reel', x: 820, y: 485, scale: 0.95 },
    { kind: 'chains', x: 1035, y: 60, scale: 1.1 },
    { kind: 'stalactite', x: 1260, y: 55, scale: 1.3 },
    { kind: 'column', x: 1380, y: 465, scale: 0.95 },
    { kind: 'sprocket', x: 1625, y: 310, scale: 1.2 },
    { kind: 'trestle', x: 1935, y: 565, scale: 1 },
    { kind: 'lamp', x: 2350, y: 650, scale: 1 },
    { kind: 'trestle', x: 2950, y: 725, scale: 1.2 },
    { kind: 'chains', x: 3180, y: 160, scale: 1 },
    { kind: 'lamp', x: 3635, y: 660, scale: 1 },
    { kind: 'reel', x: 4040, y: 660, scale: 1.05 },
    { kind: 'sprocket', x: 4400, y: 450, scale: 1.3 },
    { kind: 'stalactite', x: 4820, y: 240, scale: 1.2 },
    { kind: 'column', x: 5220, y: 795, scale: 1.05 },
    { kind: 'trestle', x: 5420, y: 795, scale: 1 },
    { kind: 'lamp', x: 6235, y: 795, scale: 1 },
    { kind: 'chains', x: 6850, y: 310, scale: 1.1 },
    { kind: 'stalactite', x: 7365, y: 380, scale: 1.15 },
    { kind: 'sprocket', x: 7825, y: 560, scale: 1.25 },
    { kind: 'lamp', x: 8380, y: 955, scale: 1 },
    { kind: 'stalactite', x: 8990, y: 430, scale: 1.3 },
    { kind: 'reel', x: 9660, y: 955, scale: 1.1 },
    { kind: 'column', x: 10540, y: 1040, scale: 1 },
    { kind: 'poster', x: 10660, y: 1040, scale: 1 },
    { kind: 'chains', x: 10960, y: 580, scale: 1 },
    { kind: 'poster', x: 11340, y: 1120, scale: 1 },
    { kind: 'arch', x: 12010, y: 1190, scale: 1 },
    { kind: 'lamp', x: 12000, y: 1190, scale: 1 },
  ];
}

export function createBeetles(): BeetleEnemy[] {
  return [
    {
      id: 'beetle-1',
      x: 3880,
      y: 660 - 30,
      w: 44,
      h: 30,
      minX: 3700,
      maxX: 4110,
      speed: 86,
      vx: -86,
      hp: 2,
      maxHp: 2,
      facing: -1,
      animTime: 0,
      stunTimer: 0,
      flashTimer: 0,
      dead: false,
    },
    {
      id: 'beetle-2',
      x: 5450,
      y: 795 - 30,
      w: 44,
      h: 30,
      minX: 5265,
      maxX: 5595,
      speed: 94,
      vx: -94,
      hp: 2,
      maxHp: 2,
      facing: -1,
      animTime: 1.1,
      stunTimer: 0,
      flashTimer: 0,
      dead: false,
    },
    {
      id: 'beetle-3',
      x: 8290,
      y: 955 - 30,
      w: 44,
      h: 30,
      minX: 8130,
      maxX: 8435,
      speed: 98,
      vx: -98,
      hp: 2,
      maxHp: 2,
      facing: -1,
      animTime: 0.5,
      stunTimer: 0,
      flashTimer: 0,
      dead: false,
    },
    {
      id: 'beetle-4',
      x: 11390,
      y: 1120 - 30,
      w: 44,
      h: 30,
      minX: 11250,
      maxX: 11520,
      speed: 100,
      vx: -100,
      hp: 2,
      maxHp: 2,
      facing: -1,
      animTime: 2.0,
      stunTimer: 0,
      flashTimer: 0,
      dead: false,
    },
  ];
}

export function createBats(): BatEnemy[] {
  return [
    {
      id: 'bat-1',
      homeX: 7405,
      homeY: 695,
      x: 7405,
      y: 695,
      r: 18,
      phase: 'perched',
      phaseTimer: 0,
      swoopStartX: 7405,
      swoopStartY: 695,
      swoopPeakX: 7335,
      swoopPeakY: 830,
      swoopEndX: 7225,
      swoopEndY: 705,
      facing: -1,
      hp: 1,
      flashTimer: 0,
      triggerRadius: 285,
      wingTime: 0,
    },
    {
      id: 'bat-2',
      homeX: 9045,
      homeY: 730,
      x: 9045,
      y: 730,
      r: 18,
      phase: 'perched',
      phaseTimer: 0,
      swoopStartX: 9045,
      swoopStartY: 730,
      swoopPeakX: 9000,
      swoopPeakY: 895,
      swoopEndX: 8900,
      swoopEndY: 740,
      facing: -1,
      hp: 1,
      flashTimer: 0,
      triggerRadius: 270,
      wingTime: 1.3,
    },
    {
      id: 'bat-3',
      homeX: 11785,
      homeY: 945,
      x: 11785,
      y: 945,
      r: 18,
      phase: 'perched',
      phaseTimer: 0,
      swoopStartX: 11785,
      swoopStartY: 945,
      swoopPeakX: 11735,
      swoopPeakY: 1090,
      swoopEndX: 11635,
      swoopEndY: 955,
      facing: -1,
      hp: 1,
      flashTimer: 0,
      triggerRadius: 275,
      wingTime: 2.1,
    },
  ];
}

export function createCheckpoint(): CheckpointState {
  return {
    x: 12155,
    y: 1190,
    triggerX: 12135,
    activated: false,
    bannerTimer: 0,
  };
}

export function createInitialWorld(screen: WorldState['screen'] = 'TITLE'): WorldState {
  return {
    screen,
    time: 0,
    runTime: 0,
    hitsTaken: 0,
    cameraX: 0,
    cameraY: 60,
    shakeTimer: 0,
    shakeIntensity: 0,
    irisRadius: 1,
    irisMode: 'open',
    pendingRespawnType: 'none',
    stretchLabel: 'ACT I · THE SUNLESS ENTRY',
    stretchBannerTimer: screen === 'PLAYING' ? 3.0 : 0,
    player: {
      x: SPAWN_X,
      y: SPAWN_Y,
      w: 28,
      h: 46,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      onLanternId: null,
      onMovingId: null,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpHeld: false,
      slashTimer: 0,
      slashCooldown: 0,
      hp: 3,
      maxHp: 3,
      invulnTimer: 0,
      squashX: 1,
      squashY: 1,
      runCycle: 0,
      fallDist: 0,
      lastSafeX: SPAWN_X,
      lastSafeY: SPAWN_Y,
      scarf: createInitialScarf(SPAWN_X + 14, SPAWN_Y),
    },
    platforms: createLevelPlatforms(),
    lanterns: createLanterns(),
    movingPlatforms: createMovingPlatforms(),
    crumblePlatforms: createCrumblePlatforms(),
    inkPools: createInkPools(),
    signposts: createSignposts(),
    props: createProps(),
    beetles: createBeetles(),
    bats: createBats(),
    checkpoint: createCheckpoint(),
    boss: createBossState(),
    slash: null,
    particles: [],
    pitBottomY: 1460,
    worldWidth: 14095,
    worldHeight: 1750,
  };
}
