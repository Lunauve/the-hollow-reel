export type GameScreenState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'FIN';

export interface Vec2 {
  x: number;
  y: number;
}

export type PlatformKind = 'rock' | 'cart' | 'bridge' | 'stage' | 'pillar';

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PlatformKind;
  /** Decorative cart tilt in radians; collision top surface remains flat & white-rimmed */
  cartTilt?: number;
  /** Whether pit respawn can save safe ground on this platform */
  safeAnchor?: boolean;
}

export interface SwingingLantern {
  id: string;
  pivotX: number;
  pivotY: number;
  length: number;
  amplitudeRad: number;
  speed: number;
  phase: number;
  w: number;
  h: number;
  // Runtime computed
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  angle: number;
}

export interface MovingPlatform {
  id: string;
  baseX: number;
  baseY: number;
  rangeX: number;
  rangeY: number;
  speed: number;
  phase: number;
  w: number;
  h: number;
  // Runtime computed
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export type CrumbleState = 'solid' | 'shaking' | 'broken';

export interface CrumblePlatform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  state: CrumbleState;
  timer: number;
  shakeDuration: number;
  respawnDuration: number;
}

export interface InkPool {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Signpost {
  x: number;
  y: number;
  title: string;
  lines: string[];
}

export interface PropDeco {
  kind: 'arch' | 'reel' | 'lamp' | 'trestle' | 'poster' | 'stalactite' | 'column' | 'sprocket' | 'chains';
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
}

export interface BeetleEnemy {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minX: number;
  maxX: number;
  speed: number;
  vx: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  animTime: number;
  stunTimer: number;
  flashTimer: number;
  dead: boolean;
}

export type BatPhase = 'perched' | 'telegraph' | 'swoop' | 'recover' | 'dead';

export interface BatEnemy {
  id: string;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  r: number;
  phase: BatPhase;
  phaseTimer: number;
  swoopStartX: number;
  swoopStartY: number;
  swoopPeakX: number;
  swoopPeakY: number;
  swoopEndX: number;
  swoopEndY: number;
  facing: 1 | -1;
  hp: number;
  flashTimer: number;
  triggerRadius: number;
  wingTime: number;
}

export type BossPhase =
  | 'dormant'
  | 'intro'
  | 'idle'
  | 'sweep_telegraph'
  | 'sweep_attack'
  | 'sweep_recover'
  | 'slam_aim'
  | 'slam_pause'
  | 'slam_drop'
  | 'slam_stuck'
  | 'defeated_melt'
  | 'door_open';

export interface BossState {
  phase: BossPhase;
  phaseTimer: number;
  introProgress: number; // 0..1
  hp: number;
  maxHp: number;
  flashTimer: number;
  // Teaching & alternating pattern tracking
  taughtSweep: boolean;
  taughtSlam: boolean;
  nextPattern: 'sweep' | 'slam';
  // Arena bounds
  arenaLeft: number;
  arenaRight: number;
  floorY: number;
  // Usher body & glove positions
  bodyX: number;
  bodyY: number;
  facing: 1 | -1;
  // Sweep glove state
  sweepStartX: number;
  sweepEndX: number;
  sweepGloveX: number;
  sweepGloveY: number;
  sweepActive: boolean;
  // Slam fists state
  slamTargetX: number;
  slamFistsY: number;
  slamActive: boolean;
  slamStuckGloveBox: { x: number; y: number; w: number; h: number } | null;
  // Melt & exit doorway
  puddleSpread: number;
  doorwayOpenProgress: number;
  doorwayX: number;
  doorwayY: number;
  doorwayW: number;
  doorwayH: number;
}

export interface SlashArc {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: 1 | -1;
  timer: number;
  duration: number;
  hitIds: Set<string>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: 'white' | 'black' | 'gray';
  gravity: number;
}

export interface ScarfNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  onLanternId: string | null;
  onMovingId: string | null;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpHeld: boolean;
  slashTimer: number;
  slashCooldown: number;
  hp: number;
  maxHp: number;
  invulnTimer: number;
  squashX: number;
  squashY: number;
  runCycle: number;
  fallDist: number;
  lastSafeX: number;
  lastSafeY: number;
  scarf: ScarfNode[];
}

export interface CheckpointState {
  x: number;
  y: number;
  triggerX: number;
  activated: boolean;
  bannerTimer: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpDown: boolean;
  jumpPressed: boolean;
  slashPressed: boolean;
}

export interface WorldState {
  screen: GameScreenState;
  time: number;
  runTime: number;
  hitsTaken: number;
  cameraX: number;
  cameraY: number;
  shakeTimer: number;
  shakeIntensity: number;
  irisRadius: number; // 0..1 (1 = fully open, 0 = black closed)
  irisMode: 'open' | 'closing_pit' | 'closing_death' | 'closing_fin';
  pendingRespawnType: 'none' | 'pit' | 'checkpoint' | 'fin';
  stretchLabel: string;
  stretchBannerTimer: number;
  player: PlayerState;
  platforms: Platform[];
  lanterns: SwingingLantern[];
  movingPlatforms: MovingPlatform[];
  crumblePlatforms: CrumblePlatform[];
  inkPools: InkPool[];
  signposts: Signpost[];
  props: PropDeco[];
  beetles: BeetleEnemy[];
  bats: BatEnemy[];
  checkpoint: CheckpointState;
  boss: BossState;
  slash: SlashArc | null;
  particles: Particle[];
  pitBottomY: number;
  worldWidth: number;
  worldHeight: number;
}
