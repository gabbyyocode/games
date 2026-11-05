import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const WIDTH = 960;
const HEIGHT = 540;
const DRAGON_X = 225;
const DRAGON_RADIUS = 19;
const WHALE_WIDTH = 140;
const WHALE_SPACING = 420;
const BLOWHOLE_X = 46;
const SPRAY_HALF = 16;
const FLOOR_Y = 484;
const STORM_TARGET_X = DRAGON_X - 55;
const STORM_BOLT_TOP = 128;
const STORM_BOLT_BOTTOM = 270;
const STORM_WARNING_SECONDS = 1.5;
const STORM_DANGER_SECONDS = 0.14;

type Obstacle = {
  x: number;
  sprayTop: number;
  passed: boolean;
};

type GamePhase = "ready" | "playing" | "over";

type Storm = {
  x: number;
  phase: "approach" | "warning" | "strike" | "fade";
  elapsed: number;
};

type GameWorld = {
  phase: GamePhase;
  dragonY: number;
  velocity: number;
  obstacles: Obstacle[];
  score: number;
  elapsed: number;
  storm: Storm | null;
  nextStormScore: number;
};

function makeWorld(phase: GamePhase = "ready"): GameWorld {
  return {
    phase,
    dragonY: HEIGHT / 2,
    velocity: 0,
    obstacles: [
      { x: 820, sprayTop: 310, passed: false },
      { x: 820 + WHALE_SPACING, sprayTop: 240, passed: false },
      { x: 820 + WHALE_SPACING * 2, sprayTop: 280, passed: false },
    ],
    score: 0,
    elapsed: 0,
    storm: null,
    nextStormScore: 10,
  };
}

function drawCloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = "rgba(255, 247, 232, 0.72)";
  context.beginPath();
  context.ellipse(0, 8, 39, 13, 0, 0, Math.PI * 2);
  context.ellipse(-18, 3, 18, 15, 0, 0, Math.PI * 2);
  context.ellipse(4, -5, 23, 21, 0, 0, Math.PI * 2);
  context.ellipse(25, 4, 17, 14, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function sprayTopY(obstacle: Obstacle, time: number, short = false) {
  const pulse = 0.68 + 0.32 * (0.5 + 0.5 * Math.sin(time * 5.5 + obstacle.x * 0.02));
  const blowY = FLOOR_Y - 52;
  const top = blowY - (blowY - obstacle.sprayTop) * pulse;
  return short ? Math.max(top, FLOOR_Y - 95) : top;
}

function drawWhale(context: CanvasRenderingContext2D, x: number) {
  const y = FLOOR_Y;

  context.fillStyle = "#4f79b8";
  context.beginPath();
  context.moveTo(x + 92, y - 30);
  context.quadraticCurveTo(x + 136, y - 54, x + 116, y - 24);
  context.quadraticCurveTo(x + 138, y - 6, x + 94, y - 16);
  context.fill();

  context.fillStyle = "#6d97d4";
  context.beginPath();
  context.ellipse(x + 58, y - 28, 48, 22, -0.04, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#e7f3fb";
  context.beginPath();
  context.ellipse(x + 60, y - 18, 28, 10, 0, 0, Math.PI);
  context.fill();

  context.fillStyle = "#5c86c4";
  context.beginPath();
  context.moveTo(x + 68, y - 20);
  context.quadraticCurveTo(x + 90, y - 2, x + 54, y - 12);
  context.fill();

  context.fillStyle = "#24324e";
  context.beginPath();
  context.arc(x + 26, y - 32, 2.4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fffef8";
  context.beginPath();
  context.arc(x + 26.8, y - 32.8, 0.9, 0, Math.PI * 2);
  context.fill();
}

function drawSpout(
  context: CanvasRenderingContext2D,
  obstacle: Obstacle,
  time: number,
  short = false,
) {
  const blowX = obstacle.x + BLOWHOLE_X;
  const blowY = FLOOR_Y - 50;
  const top = sprayTopY(obstacle, time, short);
  const wobble = Math.sin(time * 9 + obstacle.x) * 5;

  const stream = context.createLinearGradient(blowX, blowY, blowX, top);
  stream.addColorStop(0, "rgba(125, 190, 214, 0.18)");
  stream.addColorStop(0.4, "rgba(176, 226, 242, 0.78)");
  stream.addColorStop(1, "rgba(255, 255, 255, 0.95)");
  context.fillStyle = stream;
  context.beginPath();
  context.moveTo(blowX - 7, blowY);
  context.quadraticCurveTo(blowX - 16 + wobble, (blowY + top) / 2, blowX - 4, top + 10);
  context.quadraticCurveTo(blowX + 1, top - 4, blowX + 8, top + 8);
  context.quadraticCurveTo(blowX + 16 - wobble, (blowY + top) / 2, blowX + 7, blowY);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  for (let drop = 0; drop < 5; drop += 1) {
    const cycle = (time * 1.35 + drop * 0.22) % 1;
    const dropY = blowY - cycle * (blowY - top);
    const dropX = blowX + Math.sin(time * 8 + drop * 1.7) * (4 + cycle * 12);
    context.beginPath();
    context.arc(dropX, dropY, 2 + (1 - cycle) * 1.6, 0, Math.PI * 2);
    context.fill();
  }
}

function drawStorm(context: CanvasRenderingContext2D, storm: Storm) {
  const isWarning = storm.phase === "warning";
  const isStrike = storm.phase === "strike";
  const opacity = storm.phase === "fade" ? 1 - storm.elapsed / 0.38 : 1;
  const boltX = storm.x + 55;

  context.save();
  context.globalAlpha = Math.max(0, opacity);
  context.fillStyle = "rgba(54, 51, 91, 0.16)";
  context.beginPath();
  context.ellipse(storm.x, 145, 86, 13, 0, 0, Math.PI * 2);
  context.fill();

  const cloud = context.createLinearGradient(storm.x - 75, 0, storm.x + 70, 0);
  cloud.addColorStop(0, "#56536f");
  cloud.addColorStop(0.55, "#39384f");
  cloud.addColorStop(1, "#625c78");
  context.fillStyle = cloud;
  context.beginPath();
  context.ellipse(storm.x, 117, 69, 25, 0, 0, Math.PI * 2);
  context.ellipse(storm.x - 39, 110, 29, 27, 0, 0, Math.PI * 2);
  context.ellipse(storm.x - 4, 97, 39, 36, 0, 0, Math.PI * 2);
  context.ellipse(storm.x + 36, 108, 32, 29, 0, 0, Math.PI * 2);
  context.fill();

  if (isWarning || isStrike) {
    const flash = isStrike ? 1 : 0.3 + Math.max(0, Math.sin(storm.elapsed * 16)) * 0.34;
    const boltPoints = [
      [boltX + 7, 128],
      [boltX - 10, 176],
      [boltX + 6, 183],
      [boltX - 13, 229],
      [boltX + 3, 237],
      [boltX - 12, 267],
      [boltX + 4, STORM_BOLT_BOTTOM],
    ];

    context.globalAlpha *= flash;
    context.strokeStyle = "#ffdd7d";
    context.lineWidth = isStrike ? 12 : 8;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.shadowColor = "#fff1af";
    context.shadowBlur = isStrike ? 18 : 10;
    context.beginPath();
    context.moveTo(boltPoints[0][0], boltPoints[0][1]);
    for (const [x, y] of boltPoints.slice(1)) {
      context.lineTo(x, y);
    }
    context.stroke();

    context.shadowBlur = 0;
    context.strokeStyle = "#fffdf1";
    context.lineWidth = isStrike ? 4.5 : 2.5;
    context.beginPath();
    context.moveTo(boltPoints[0][0], boltPoints[0][1]);
    for (const [x, y] of boltPoints.slice(1)) {
      context.lineTo(x, y);
    }
    context.stroke();

  }
  context.restore();
}

function drawDragon(
  context: CanvasRenderingContext2D,
  y: number,
  velocity: number,
  elapsed: number,
) {
  const tilt = Math.max(-0.42, Math.min(0.48, velocity / 1150));
  const wingBeat = Math.sin(elapsed * 10) * 0.24;
  context.save();
  context.translate(DRAGON_X, y);
  context.rotate(tilt);

  context.fillStyle = "rgba(42, 34, 69, 0.2)";
  context.beginPath();
  context.ellipse(-1, 24, 31, 8, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#5c51a7";
  context.beginPath();
  context.moveTo(-15, 8);
  context.quadraticCurveTo(-43, 21, -48, 7);
  context.quadraticCurveTo(-30, 18, -21, -2);
  context.fill();
  context.fillStyle = "#f3b982";
  context.beginPath();
  context.arc(-48, 7, 4, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(-5, -8);
  context.rotate(wingBeat);
  context.fillStyle = "#8e83e0";
  context.beginPath();
  context.moveTo(1, 4);
  context.quadraticCurveTo(-2, -40, -34, -42);
  context.quadraticCurveTo(-29, -17, -15, 7);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(219, 211, 255, 0.68)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-5, 1);
  context.lineTo(-27, -32);
  context.moveTo(-8, 3);
  context.lineTo(-25, -14);
  context.stroke();
  context.restore();

  context.fillStyle = "#756bd0";
  context.beginPath();
  context.ellipse(-3, 3, 27, 19, -0.08, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f0b77e";
  context.beginPath();
  context.ellipse(-2, 14, 14, 6, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#574e9e";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-11, 17);
  context.lineTo(-13, 24);
  context.moveTo(5, 17);
  context.lineTo(3, 24);
  context.stroke();

  context.fillStyle = "#8279dc";
  context.beginPath();
  context.ellipse(18, -6, 19, 16, 0.08, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#a29bed";
  context.beginPath();
  context.ellipse(31, 1, 12, 8, 0.08, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f0d091";
  context.beginPath();
  context.moveTo(8, -18);
  context.lineTo(5, -30);
  context.quadraticCurveTo(16, -25, 17, -15);
  context.moveTo(20, -19);
  context.lineTo(24, -29);
  context.quadraticCurveTo(30, -23, 27, -15);
  context.fill();

  context.fillStyle = "#29253e";
  context.beginPath();
  context.arc(22, -9, 3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fff8e9";
  context.beginPath();
  context.arc(23, -10, 1, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#554b9c";
  context.beginPath();
  context.arc(35, -1, 1.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawWorld(
  context: CanvasRenderingContext2D,
  world: GameWorld,
  timestamp: number,
) {
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#f5b38f");
  sky.addColorStop(0.58, "#f8d3a4");
  sky.addColorStop(1, "#f3d9b1");
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = "rgba(255, 241, 190, 0.78)";
  context.beginPath();
  context.arc(770, 108, 48, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255, 248, 224, 0.3)";
  context.beginPath();
  context.arc(770, 108, 66, 0, Math.PI * 2);
  context.fill();

  const drift = world.phase === "playing" ? world.elapsed * 16 : timestamp * 0.012;
  drawCloud(context, 130 - (drift % 1120), 116, 0.82);
  drawCloud(context, 495 - ((drift * 0.66) % 1120), 205, 0.58);
  drawCloud(context, 930 - ((drift * 0.8) % 1120), 92, 0.72);

  context.fillStyle = "#df9c91";
  context.beginPath();
  context.moveTo(0, 383);
  context.quadraticCurveTo(145, 319, 286, 382);
  context.quadraticCurveTo(440, 441, 604, 370);
  context.quadraticCurveTo(791, 307, WIDTH, 373);
  context.lineTo(WIDTH, FLOOR_Y);
  context.lineTo(0, FLOOR_Y);
  context.fill();

  context.fillStyle = "#c57e91";
  context.beginPath();
  context.moveTo(0, 423);
  context.quadraticCurveTo(150, 378, 303, 431);
  context.quadraticCurveTo(476, 486, 648, 417);
  context.quadraticCurveTo(810, 365, WIDTH, 423);
  context.lineTo(WIDTH, FLOOR_Y);
  context.lineTo(0, FLOOR_Y);
  context.fill();

  const sea = context.createLinearGradient(0, FLOOR_Y, 0, HEIGHT);
  sea.addColorStop(0, "#8eb8d6");
  sea.addColorStop(1, "#3d6c98");
  context.fillStyle = sea;
  context.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);

  const waveTime = world.phase === "playing" ? world.elapsed : timestamp / 1000;
  context.strokeStyle = "rgba(255, 252, 245, 0.7)";
  context.lineWidth = 3;
  context.beginPath();
  for (let x = 0; x <= WIDTH; x += 8) {
    const waveY = FLOOR_Y + 5 + Math.sin((x + waveTime * 80) / 26) * 3;
    if (x === 0) context.moveTo(x, waveY);
    else context.lineTo(x, waveY);
  }
  context.stroke();

  for (const obstacle of world.obstacles) {
    drawWhale(context, obstacle.x);
    drawSpout(context, obstacle, waveTime, world.storm !== null);
  }

  if (world.storm) {
    drawStorm(context, world.storm);
  }

  drawDragon(context, world.dragonY, world.velocity, world.elapsed);
}

function FlyingDragonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef(makeWorld());
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const autoFullscreenAttempted = useRef(false);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === gameRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (!isFallbackFullscreen) return;

    const bodyOverflow = document.body.style.overflow;
    const documentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsFallbackFullscreen(false);
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = documentOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFallbackFullscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      throw new Error("The Flying Dragon game needs a canvas that supports 2D drawing.");
    }

    let frameId = 0;
    let previousTime = 0;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * pixelRatio;
    canvas.height = HEIGHT * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const finishGame = () => {
      const world = worldRef.current;
      world.phase = "over";
      setPhase("over");
      setBestScore((best) => Math.max(best, world.score));
    };

    const animate = (timestamp: number) => {
      const world = worldRef.current;
      const delta = previousTime === 0 ? 0 : Math.min((timestamp - previousTime) / 1000, 0.032);
      previousTime = timestamp;

      if (world.phase === "playing") {
        world.elapsed += delta;
        world.velocity += 1380 * delta;
        world.dragonY += world.velocity * delta;

        const speed = 250 + Math.min(world.score * 4, 100);
        for (const obstacle of world.obstacles) {
          obstacle.x -= speed * delta;
          if (!obstacle.passed && obstacle.x + WHALE_WIDTH < DRAGON_X - DRAGON_RADIUS) {
            obstacle.passed = true;
            world.score += 1;
            setScore(world.score);
          }

          const blowX = obstacle.x + BLOWHOLE_X;
          const sprayTop = sprayTopY(obstacle, world.elapsed, world.storm !== null);
          const hitsSpray =
            blowX - SPRAY_HALF < DRAGON_X + DRAGON_RADIUS &&
            blowX + SPRAY_HALF > DRAGON_X - DRAGON_RADIUS &&
            world.dragonY + DRAGON_RADIUS > sprayTop;
          const hitsWhale =
            obstacle.x + 8 < DRAGON_X + DRAGON_RADIUS &&
            obstacle.x + WHALE_WIDTH - 8 > DRAGON_X - DRAGON_RADIUS &&
            world.dragonY + DRAGON_RADIUS > FLOOR_Y - 46;
          if (hitsSpray || hitsWhale) {
            finishGame();
            break;
          }
        }

        if (world.storm) {
          const storm = world.storm;
          if (storm.phase === "approach") {
            storm.x -= speed * delta;
            if (storm.x <= STORM_TARGET_X) {
              storm.x = STORM_TARGET_X;
              storm.phase = "warning";
              storm.elapsed = 0;
            }
          } else if (storm.phase === "warning") {
            storm.elapsed += delta;
            if (storm.elapsed >= STORM_WARNING_SECONDS) {
              storm.phase = "strike";
              storm.elapsed = 0;
            }
          } else if (storm.phase === "strike") {
            storm.elapsed += delta;
            const boltX = storm.x + 55;
            const hitsLightning =
              storm.elapsed <= STORM_DANGER_SECONDS &&
              Math.abs(DRAGON_X - boltX) < DRAGON_RADIUS + 5 &&
              world.dragonY + DRAGON_RADIUS > STORM_BOLT_TOP &&
              world.dragonY - DRAGON_RADIUS < STORM_BOLT_BOTTOM;
            if (hitsLightning) {
              finishGame();
            } else if (storm.elapsed >= 0.32) {
              storm.phase = "fade";
              storm.elapsed = 0;
            }
          } else {
            storm.elapsed += delta;
            if (storm.elapsed >= 0.38) {
              world.storm = null;
            }
          }
        }

        if (!world.storm && world.score >= world.nextStormScore) {
          world.storm = { x: WIDTH + 90, phase: "approach", elapsed: 0 };
          world.nextStormScore = world.score + 6;
        }

        if (world.dragonY - DRAGON_RADIUS < 12 || world.dragonY + DRAGON_RADIUS > FLOOR_Y) {
          finishGame();
        }

        const firstObstacle = world.obstacles[0];
        if (firstObstacle && firstObstacle.x + WHALE_WIDTH < 0) {
          const lastObstacle = world.obstacles[world.obstacles.length - 1];
          world.obstacles.shift();
          world.obstacles.push({
            x: lastObstacle.x + WHALE_SPACING,
            sprayTop: 200 + Math.random() * 130,
            passed: false,
          });
        }
      }

      drawWorld(context, world, timestamp);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const startGame = () => {
    if (!autoFullscreenAttempted.current) {
      autoFullscreenAttempted.current = true;
      void enterFullscreen();
    }
    worldRef.current = makeWorld("playing");
    worldRef.current.velocity = -470;
    setScore(0);
    setPhase("playing");
    gameRef.current?.focus();
  };

  const flap = () => {
    const world = worldRef.current;
    if (world.phase !== "playing") return;
    world.velocity = -470;
  };

  const enterFullscreen = async () => {
    const game = gameRef.current;
    if (!game) return;

    if (!game.requestFullscreen) {
      setIsFallbackFullscreen(true);
      return;
    }

    try {
      await game.requestFullscreen();
      setIsFallbackFullscreen(false);
    } catch {
      setIsFallbackFullscreen(true);
    }
  };

  const toggleFullscreen = async () => {
    const game = gameRef.current;
    if (!game) return;

    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
      return;
    }

    if (document.fullscreenElement === game) {
      await document.exitFullscreen();
    } else {
      await enterFullscreen();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code !== "Space" && event.code !== "ArrowUp") return;
    event.preventDefault();
    if (worldRef.current.phase === "ready" || worldRef.current.phase === "over") {
      startGame();
    } else {
      flap();
    }
  };

  return (
    <div
      className={`dragon-game${isFallbackFullscreen ? " is-fullscreen" : ""}`}
      ref={gameRef}
      role="group"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={flap}
      aria-label="Flying Dragon game. Press Space, Arrow Up, or tap to fly over whale spray and avoid lightning after 10 points."
    >
      <div className="dragon-game-screen">
        <canvas
          className="dragon-game-canvas"
          ref={canvasRef}
          aria-label="A little purple dragon flying over whales, with lightning storms after 10 points."
        />
        <div className="game-hud" aria-live="polite">
          <span className="game-hud-label">SKY SCORE</span>
          <strong>{score}</strong>
          <span className="game-best">BEST {bestScore}</span>
        </div>
        <button
          className="game-fullscreen-button"
          type="button"
          aria-label={isFullscreen || isFallbackFullscreen ? "Exit fullscreen" : "Play fullscreen"}
          title={isFullscreen || isFallbackFullscreen ? "Exit fullscreen" : "Play fullscreen"}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onClick={toggleFullscreen}
        >
          {isFullscreen || isFallbackFullscreen ? "×" : "⛶"}
        </button>
        {phase !== "playing" && (
          <div className="game-overlay">
            <div className="game-prompt">
              <span className="game-prompt-sparkle" aria-hidden="true">✦</span>
              <p className="game-prompt-eyebrow">
                {phase === "ready" ? "A LITTLE ADVENTURE" : "ONE MORE FLIGHT?"}
              </p>
              <h4>{phase === "ready" ? "Ready, little dragon?" : "The sky is still yours."}</h4>
              <p className="game-prompt-copy">
                {phase === "ready"
                  ? "Storm at 10! Fly low to dodge the lightning."
                  : `You flew past ${score} ${score === 1 ? "whale" : "whales"}. Give it another go!`}
              </p>
              <button className="button button-primary game-start" onClick={startGame}>
                {phase === "ready" ? "Let’s fly" : "Fly again"} <span aria-hidden="true">→</span>
              </button>
              <p className="game-controls">
                <span className="game-keyboard-hint">SPACE · ↑</span>
                <span className="game-tap-hint">TAP ANYWHERE TO FLAP</span>
              </p>
              <p className="game-rotate-hint">Turn your phone sideways for the best view.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlyingDragonGame;
