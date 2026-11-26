import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react';
import { sound } from './game/audio';
import { stepWorld } from './game/engine';
import { VIEW_HEIGHT, VIEW_WIDTH, createInitialWorld } from './game/level';
import { renderWorld } from './game/renderer';
import { GameScreenState, InputState, WorldState } from './game/types';

interface HudSnapshot {
  screen: GameScreenState;
  hp: number;
  maxHp: number;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  bossDefeated: boolean;
  checkpointBanner: boolean;
  stretchLabel: string;
  stretchBanner: boolean;
  runTime: number;
  hitsTaken: number;
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function extractHud(world: WorldState): HudSnapshot {
  const boss = world.boss;
  const bossActive =
    boss.phase !== 'dormant' &&
    boss.phase !== 'defeated_melt' &&
    boss.phase !== 'door_open';
  return {
    screen: world.screen,
    hp: world.player.hp,
    maxHp: world.player.maxHp,
    bossActive,
    bossHp: boss.hp,
    bossMaxHp: boss.maxHp,
    bossDefeated: boss.phase === 'defeated_melt' || boss.phase === 'door_open',
    checkpointBanner: world.checkpoint.bannerTimer > 0,
    stretchLabel: world.stretchLabel,
    stretchBanner: world.stretchBannerTimer > 0,
    runTime: world.runTime,
    hitsTaken: world.hitsTaken,
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<WorldState>(createInitialWorld('TITLE'));
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jumpDown: false,
    jumpPressed: false,
    slashPressed: false,
  });

  const [hud, setHud] = useState<HudSnapshot>(() => extractHud(worldRef.current));
  const [muted, setMuted] = useState(false);

  const syncHud = useCallback((force = false) => {
    const next = extractHud(worldRef.current);
    setHud((prev) => {
      if (
        !force &&
        prev.screen === next.screen &&
        prev.hp === next.hp &&
        prev.bossActive === next.bossActive &&
        prev.bossHp === next.bossHp &&
        prev.bossDefeated === next.bossDefeated &&
        prev.checkpointBanner === next.checkpointBanner &&
        prev.stretchBanner === next.stretchBanner &&
        prev.stretchLabel === next.stretchLabel &&
        (next.screen !== 'FIN' ||
          (Math.floor(prev.runTime) === Math.floor(next.runTime) &&
            prev.hitsTaken === next.hitsTaken))
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    sound.unlock();
    worldRef.current = createInitialWorld('PLAYING');
    inputRef.current = {
      left: false,
      right: false,
      jumpDown: false,
      jumpPressed: false,
      slashPressed: false,
    };
    sound.checkpoint();
    syncHud(true);
  }, [syncHud]);

  const togglePause = useCallback(() => {
    const w = worldRef.current;
    if (w.screen === 'PLAYING') {
      w.screen = 'PAUSED';
      syncHud(true);
    } else if (w.screen === 'PAUSED') {
      w.screen = 'PLAYING';
      syncHud(true);
    }
  }, [syncHud]);

  const handleToggleMute = useCallback(() => {
    sound.unlock();
    const m = sound.toggleMute();
    setMuted(m);
  }, []);

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const w = worldRef.current;

      if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        e.preventDefault();
      }

      if (code === 'Enter') {
        if (w.screen === 'TITLE' || w.screen === 'FIN') {
          startGame();
          return;
        }
      }

      if (code === 'Escape') {
        if (w.screen === 'PLAYING' || w.screen === 'PAUSED') {
          togglePause();
          return;
        }
      }

      if (code === 'KeyM') {
        handleToggleMute();
        return;
      }

      if (w.screen !== 'PLAYING') return;

      sound.unlock();
      const inp = inputRef.current;

      if (code === 'KeyA' || code === 'ArrowLeft') inp.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') inp.right = true;

      if (code === 'Space' || code === 'KeyZ') {
        if (!inp.jumpDown) {
          inp.jumpPressed = true;
        }
        inp.jumpDown = true;
      }

      if (code === 'KeyX' || code === 'KeyJ') {
        if (!e.repeat) {
          inp.slashPressed = true;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const inp = inputRef.current;
      if (code === 'KeyA' || code === 'ArrowLeft') inp.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') inp.right = false;
      if (code === 'Space' || code === 'KeyZ') inp.jumpDown = false;
    };

    const onBlur = () => {
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpDown = false;
      inputRef.current.jumpPressed = false;
      inputRef.current.slashPressed = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [handleToggleMute, startGame, togglePause]);

  // Main 60fps requestAnimationFrame loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const world = worldRef.current;
      const input = inputRef.current;

      stepWorld(world, input, dt);

      // Clear single-frame edge triggers
      input.jumpPressed = false;
      input.slashPressed = false;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderWorld(ctx, world);
        }
      }

      syncHud(false);
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [syncHud]);

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#080808] text-[#f4f1ea]">
      {/* Aspect-locked 16:9 Silent-Film Theater Viewport */}
      <div className="relative aspect-video max-h-screen w-full max-w-[177.78vh] overflow-hidden border border-[#2c2c29] bg-[#0b0b0b] shadow-2xl">
        <canvas
          ref={canvasRef}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          className="block h-full w-full"
        />

        {/* Active Gameplay HUD */}
        {(hud.screen === 'PLAYING' || hud.screen === 'PAUSED') && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5">
            {/* Top Bar */}
            <div className="flex items-start justify-between gap-4">
              {/* Health Pips (Top-Left) */}
              <div
                className="flex items-center gap-2.5 bg-[#0b0b0b]/80 px-3.5 py-2 border border-[#3a3a36]"
                aria-label={`Health: ${hud.hp} of ${hud.maxHp}`}
              >
                <div className="flex items-center gap-2">
                  {Array.from({ length: hud.maxHp }).map((_, i) => {
                    const filled = i < hud.hp;
                    return (
                      <svg
                        key={i}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        className="transition-transform duration-150"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 3 L20 12 L12 21 L4 12 Z"
                          fill={filled ? '#f4f1ea' : 'transparent'}
                          stroke="#f4f1ea"
                          strokeWidth="2"
                        />
                        {!filled && (
                          <path
                            d="M8 8 L16 16"
                            stroke="#6f6d66"
                            strokeWidth="1.5"
                          />
                        )}
                      </svg>
                    );
                  })}
                </div>
                <span className="font-display text-xs tracking-wider text-[#d4d1c8] tabular-nums">
                  {hud.hp}/{hud.maxHp}
                </span>
              </div>

              {/* Boss Health / Stretch / Checkpoint Intertitle Banner */}
              <div className="flex flex-col items-center gap-2">
                {hud.bossActive && (
                  <div className="flex flex-col items-center gap-1.5 bg-[#0b0b0b]/85 px-5 py-2 border border-[#5a5852]">
                    <span className="font-display text-xs font-bold tracking-[0.22em] text-[#f4f1ea]">
                      THE INK USHER
                    </span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: hud.bossMaxHp }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-2.5 w-5 border border-[#f4f1ea] transition-colors duration-150 ${
                            idx < hud.bossHp ? 'bg-[#f4f1ea]' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {hud.checkpointBanner && (
                  <div className="bg-[#0b0b0b]/90 px-4 py-1.5 border border-[#d4d1c8]">
                    <span className="font-display text-xs tracking-[0.18em] text-[#f4f1ea]">
                      CHECKPOINT · PROJECTOR BOOTH
                    </span>
                  </div>
                )}

                {!hud.checkpointBanner && hud.stretchBanner && (
                  <div className="bg-[#0b0b0b]/85 px-4 py-1.5 border border-[#5a5852]">
                    <span className="font-display text-xs tracking-[0.18em] text-[#e5e2d9]">
                      {hud.stretchLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Audio & Pause Controls (Top-Right) */}
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  title={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
                  aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                  className="flex h-10 w-10 items-center justify-center border border-[#3a3a36] bg-[#0b0b0b]/80 text-[#f4f1ea] transition-colors hover:border-[#f4f1ea] hover:bg-[#1a1a18] focus-visible:outline-2 focus-visible:outline-[#f4f1ea]"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={togglePause}
                  title={hud.screen === 'PAUSED' ? 'Resume (Esc)' : 'Pause (Esc)'}
                  aria-label={hud.screen === 'PAUSED' ? 'Resume game' : 'Pause game'}
                  className="flex h-10 w-10 items-center justify-center border border-[#3a3a36] bg-[#0b0b0b]/80 text-[#f4f1ea] transition-colors hover:border-[#f4f1ea] hover:bg-[#1a1a18] focus-visible:outline-2 focus-visible:outline-[#f4f1ea]"
                >
                  {hud.screen === 'PAUSED' ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TITLE SCREEN */}
        {hud.screen === 'TITLE' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#090909]/72 p-6">
            <div className="relative flex w-full max-w-xl flex-col items-center border-2 border-[#e8e4da] bg-[#0d0d0d]/95 px-10 py-11 text-center shadow-2xl">
              {/* Inner silent-film double frame */}
              <div className="pointer-events-none absolute inset-2 border border-[#5a5852]" />

              <p className="font-editorial text-xs tracking-[0.28em] text-[#b8b4aa]">
                A SILENT-FILM DESCENT
              </p>

              <h1 className="font-display mt-3 text-4xl font-bold tracking-[0.12em] text-[#f4f1ea] sm:text-5xl">
                THE HOLLOW REEL
              </h1>

              <div className="my-6 h-px w-40 bg-[#5a5852]" />

              <p className="font-editorial max-w-md text-sm leading-relaxed text-[#d4d1c8]">
                Descend through the inked caverns, cross the sunken mine rails, and face
                the shadow inside the underground theater.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs tracking-wide text-[#b8b4aa]">
                <span>Move: A / D or Arrows</span>
                <span aria-hidden="true">·</span>
                <span>Jump: Space / Z</span>
                <span aria-hidden="true">·</span>
                <span>Slash: X / J</span>
              </div>

              <button
                type="button"
                onClick={startGame}
                className="font-display mt-8 border-2 border-[#f4f1ea] bg-[#f4f1ea] px-8 py-3 text-sm font-bold tracking-[0.2em] text-[#0b0b0b] transition-colors hover:bg-transparent hover:text-[#f4f1ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4f1ea]"
              >
                START GAME
              </button>

              <p className="font-editorial mt-3 text-xs italic text-[#9b988f]">
                Press Enter to begin
              </p>
            </div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {hud.screen === 'PAUSED' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#090909]/78 p-6">
            <div className="relative flex w-full max-w-md flex-col items-center border-2 border-[#e8e4da] bg-[#0d0d0d] px-8 py-9 text-center">
              <div className="pointer-events-none absolute inset-2 border border-[#5a5852]" />

              <h2 className="font-display text-2xl font-bold tracking-[0.2em] text-[#f4f1ea]">
                INTERMISSION
              </h2>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#b8b4aa]">
                <span>A / D or Arrows : Move</span>
                <span aria-hidden="true">·</span>
                <span>Space / Z : Jump</span>
                <span aria-hidden="true">·</span>
                <span>X / J : Slash</span>
              </div>

              <div className="mt-7 flex items-center gap-4">
                <button
                  type="button"
                  onClick={togglePause}
                  className="font-display border border-[#f4f1ea] bg-[#f4f1ea] px-6 py-2.5 text-xs font-bold tracking-[0.16em] text-[#0b0b0b] transition-colors hover:bg-transparent hover:text-[#f4f1ea]"
                >
                  RESUME
                </button>
                <button
                  type="button"
                  onClick={startGame}
                  className="font-display flex items-center gap-2 border border-[#8c8a83] px-5 py-2.5 text-xs font-bold tracking-[0.16em] text-[#f4f1ea] transition-colors hover:border-[#f4f1ea]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  RESTART
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SILENT-FILM "FIN" ENDING CARD */}
        {hud.screen === 'FIN' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#090909]/92 p-6">
            <div className="relative flex w-full max-w-lg flex-col items-center border-2 border-[#f4f1ea] bg-[#0b0b0b] px-10 py-12 text-center shadow-2xl">
              {/* Ornate 1920s silent-film double border */}
              <div className="pointer-events-none absolute inset-2.5 border border-[#737169]" />

              <p className="font-editorial text-xs tracking-[0.26em] text-[#b8b4aa]">
                THE HOLLOW REEL
              </p>

              <h2 className="font-display mt-4 text-6xl font-bold tracking-[0.28em] text-[#f4f1ea]">
                FIN
              </h2>

              <div className="my-6 h-px w-36 bg-[#5a5852]" />

              <div className="flex items-center gap-5 text-sm text-[#d4d1c8] tabular-nums">
                <span>Time: {formatTime(hud.runTime)}</span>
                <span aria-hidden="true">·</span>
                <span>Hits Taken: {hud.hitsTaken}</span>
              </div>

              <button
                type="button"
                onClick={startGame}
                className="font-display mt-8 flex items-center gap-2.5 border-2 border-[#f4f1ea] bg-[#f4f1ea] px-8 py-3 text-sm font-bold tracking-[0.2em] text-[#0b0b0b] transition-colors hover:bg-transparent hover:text-[#f4f1ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4f1ea]"
              >
                <RotateCcw className="h-4 w-4" />
                REPLAY
              </button>

              <p className="font-editorial mt-3 text-xs italic text-[#8c8a83]">
                Press Enter to replay
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
