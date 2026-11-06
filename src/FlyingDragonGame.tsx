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
  fireHeight: number;
  passed: boolean;
};

type GamePhase = "ready" | "playing" | "over";
type ThemeId = "sky" | "volcano" | "forest" | "ice" | "desert" | "night" | "galaxy" | "football" | "wind" | "jungle";
type DragonSkinId = "classic" | "ember" | "moss" | "frost" | "royal" | "football" | "gangsta" | "rudolph" | "wind" | "tuxedo" | "dragonfruit" | "milkyway" | "scansoriopterygid";
type DragonAccessory = "flame" | "leaves" | "ice" | "crown" | "spots" | "gangsta" | "deer" | "wind" | "cat" | "dragonfruit" | "milkyway" | "scansoriopterygid" | "none";
type DragonRarity = "Noob" | "Epic" | "Legendary" | "Ultra";

type WorldTheme = {
  id: ThemeId;
  name: string;
  icon: string;
  cost: number;
  sky: [string, string, string];
  sun: string;
  sunGlow: string;
  far: string;
  near: string;
  sea: [string, string];
  cloud: string;
};

type DragonSkin = {
  id: DragonSkinId;
  name: string;
  icon: string;
  rarity: DragonRarity;
  cost: number;
  preview: string;
  body: string;
  bodyDark: string;
  wing: string;
  wingLine: string;
  belly: string;
  snout: string;
  horn: string;
  accent: string;
  accessory: DragonAccessory;
};

type DragonCollection = {
  tokens: number;
  unlockedSkinIds: DragonSkinId[];
  equippedSkinId: DragonSkinId;
  unlockedThemeIds: ThemeId[];
};

const DRAGON_COLLECTION_KEY = "flyingDragonCollection";

const DRAGON_SKINS: DragonSkin[] = [
  {
    id: "classic",
    name: "Classic",
    icon: "🐉",
    rarity: "Noob",
    cost: 0,
    preview: "#8279dc",
    body: "#756bd0",
    bodyDark: "#5c51a7",
    wing: "#8e83e0",
    wingLine: "rgba(219, 211, 255, 0.68)",
    belly: "#f0b77e",
    snout: "#a29bed",
    horn: "#f0d091",
    accent: "#f3b982",
    accessory: "none",
  },
  {
    id: "ember",
    name: "Ember",
    icon: "🔥",
    rarity: "Epic",
    cost: 1,
    preview: "#e95c43",
    body: "#e95c43",
    bodyDark: "#a63d47",
    wing: "#ff9b4a",
    wingLine: "rgba(255, 225, 160, 0.82)",
    belly: "#ffd078",
    snout: "#ffb65c",
    horn: "#ffe28a",
    accent: "#ffce62",
    accessory: "flame",
  },
  {
    id: "moss",
    name: "Moss",
    icon: "🍃",
    rarity: "Epic",
    cost: 2,
    preview: "#55a875",
    body: "#55a875",
    bodyDark: "#347455",
    wing: "#8bcf83",
    wingLine: "rgba(224, 255, 186, 0.8)",
    belly: "#e9c77d",
    snout: "#94cf7d",
    horn: "#e8d18c",
    accent: "#b9e889",
    accessory: "leaves",
  },
  {
    id: "frost",
    name: "Frost",
    icon: "❄",
    rarity: "Epic",
    cost: 3,
    preview: "#55b9d1",
    body: "#55b9d1",
    bodyDark: "#347eaa",
    wing: "#91e1ec",
    wingLine: "rgba(235, 255, 255, 0.86)",
    belly: "#e8fbff",
    snout: "#a6eff2",
    horn: "#e7ffff",
    accent: "#a6edff",
    accessory: "ice",
  },
  {
    id: "royal",
    name: "Royal",
    icon: "👑",
    rarity: "Legendary",
    cost: 4,
    preview: "#ac62ce",
    body: "#ac62ce",
    bodyDark: "#713d9c",
    wing: "#d18cea",
    wingLine: "rgba(255, 222, 255, 0.84)",
    belly: "#f1d27d",
    snout: "#d69be9",
    horn: "#f5d875",
    accent: "#ffe78b",
    accessory: "crown",
  },
  {
    id: "football",
    name: "Football",
    icon: "⚽",
    rarity: "Legendary",
    cost: 5,
    preview: "#f6f5f0",
    body: "#f6f5f0",
    bodyDark: "#292b30",
    wing: "#fffefa",
    wingLine: "rgba(72, 75, 82, 0.72)",
    belly: "#e8e7e2",
    snout: "#fffefa",
    horn: "#34363b",
    accent: "#17191d",
    accessory: "spots",
  },
  {
    id: "gangsta",
    name: "Gangsta",
    icon: "🐉",
    rarity: "Ultra",
    cost: 15,
    preview: "#f0bf38",
    body: "#e9c94f",
    bodyDark: "#977222",
    wing: "#f3db7b",
    wingLine: "rgba(255, 247, 196, 0.82)",
    belly: "#f8e9ae",
    snout: "#f2d86c",
    horn: "#fff1bd",
    accent: "#e8ac28",
    accessory: "gangsta",
  },
  {
    id: "rudolph",
    name: "Rudolph",
    icon: "🐉",
    rarity: "Legendary",
    cost: 7,
    preview: "#a85d36",
    body: "#a85d36",
    bodyDark: "#70402d",
    wing: "#c27a4b",
    wingLine: "rgba(255, 220, 174, 0.78)",
    belly: "#f1d5a5",
    snout: "#bc714b",
    horn: "#ead9b5",
    accent: "#e52538",
    accessory: "deer",
  },
  {
    id: "wind",
    name: "Wind",
    icon: "🐉",
    rarity: "Epic",
    cost: 4,
    preview: "#b9f1ed",
    body: "#b9f1ed",
    bodyDark: "#6bb7c1",
    wing: "#e4ffff",
    wingLine: "rgba(255, 255, 255, 0.9)",
    belly: "#e9fbf4",
    snout: "#a6e2e4",
    horn: "#edffff",
    accent: "#75cfd2",
    accessory: "wind",
  },
  {
    id: "tuxedo",
    name: "Muffin",
    icon: "🐉",
    rarity: "Ultra",
    cost: 30,
    preview: "#20242b",
    body: "#20242b",
    bodyDark: "#090a0d",
    wing: "#20242b",
    wingLine: "rgba(16, 18, 23, 0.9)",
    belly: "#f5f4ef",
    snout: "#f5f4ef",
    horn: "#20242b",
    accent: "#f5f4ef",
    accessory: "cat",
  },
  {
    id: "dragonfruit",
    name: "Dragonfruit",
    icon: "🐉",
    rarity: "Ultra",
    cost: 5,
    preview: "#f05b9e",
    body: "#f05b9e",
    bodyDark: "#aa326d",
    wing: "#ff9bc4",
    wingLine: "rgba(255, 232, 244, 0.88)",
    belly: "#ffe0e9",
    snout: "#ffadd0",
    horn: "#b8e889",
    accent: "#a7db69",
    accessory: "dragonfruit",
  },
  {
    id: "milkyway",
    name: "Milkyway",
    icon: "🌌",
    rarity: "Ultra",
    cost: 6,
    preview: "#171722",
    body: "#171722",
    bodyDark: "#080810",
    wing: "#242432",
    wingLine: "rgba(194, 180, 255, 0.7)",
    belly: "#282238",
    snout: "#30293f",
    horn: "#c5b5ff",
    accent: "#f3eaff",
    accessory: "milkyway",
  },
  {
    id: "scansoriopterygid",
    name: "Scansoriopterygid",
    icon: "🪶",
    rarity: "Legendary",
    cost: 8,
    preview: "#493b35",
    body: "#493b35",
    bodyDark: "#211d20",
    wing: "#675044",
    wingLine: "rgba(126, 91, 67, 0.9)",
    belly: "#78604b",
    snout: "#5c453b",
    horn: "#3a2a27",
    accent: "#a34d35",
    accessory: "scansoriopterygid",
  },
];

const DRAGON_RARITIES: DragonRarity[] = ["Noob", "Epic", "Legendary", "Ultra"];

const DEFAULT_DRAGON_COLLECTION: DragonCollection = {
  tokens: 0,
  unlockedSkinIds: ["classic"],
  equippedSkinId: "classic",
  unlockedThemeIds: ["sky"],
};

function isDragonSkinId(value: unknown): value is DragonSkinId {
  return DRAGON_SKINS.some((skin) => skin.id === value);
}

function isThemeId(value: unknown): value is ThemeId {
  return WORLD_THEMES.some((theme) => theme.id === value);
}

function loadDragonCollection(): DragonCollection {
  try {
    const stored = localStorage.getItem(DRAGON_COLLECTION_KEY);
    if (!stored) return DEFAULT_DRAGON_COLLECTION;

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Saved dragon collection is not an object.");
    }

    const collection = parsed as Record<string, unknown>;
    if (
      typeof collection.tokens !== "number" ||
      !Number.isSafeInteger(collection.tokens) ||
      collection.tokens < 0 ||
      !Array.isArray(collection.unlockedSkinIds) ||
      !collection.unlockedSkinIds.every(isDragonSkinId) ||
      !isDragonSkinId(collection.equippedSkinId)
    ) {
      throw new Error("Saved dragon collection has an invalid shape.");
    }

    const savedThemeIds = collection.unlockedThemeIds ?? ["sky"];
    if (!Array.isArray(savedThemeIds) || !savedThemeIds.every(isThemeId)) {
      throw new Error("Saved dragon collection has invalid unlocked worlds.");
    }

    const unlockedSkinIds = Array.from(
      new Set<DragonSkinId>(["classic", ...collection.unlockedSkinIds]),
    );
    const equippedSkinId = unlockedSkinIds.includes(collection.equippedSkinId)
      ? collection.equippedSkinId
      : "classic";

    const unlockedThemeIds = Array.from(new Set<ThemeId>(["sky", ...savedThemeIds]));

    return {
      tokens: collection.tokens,
      unlockedSkinIds,
      equippedSkinId,
      unlockedThemeIds,
    };
  } catch (error) {
    console.error("Could not load the saved Flying Dragon collection.", error);
    return DEFAULT_DRAGON_COLLECTION;
  }
}

const WORLD_THEMES: WorldTheme[] = [
  {
    id: "sky",
    name: "Sky",
    icon: "☁",
    cost: 0,
    sky: ["#f5b38f", "#f8d3a4", "#f3d9b1"],
    sun: "rgba(255, 241, 190, 0.78)",
    sunGlow: "rgba(255, 248, 224, 0.3)",
    far: "#df9c91",
    near: "#c57e91",
    sea: ["#8eb8d6", "#3d6c98"],
    cloud: "rgba(255, 247, 232, 0.72)",
  },
  {
    id: "volcano",
    name: "Volcano",
    icon: "🌋",
    cost: 1,
    sky: ["#4c315d", "#a24f59", "#f09b62"],
    sun: "rgba(255, 190, 114, 0.88)",
    sunGlow: "rgba(255, 112, 75, 0.28)",
    far: "#704452",
    near: "#493444",
    sea: ["#607c91", "#293f5d"],
    cloud: "rgba(255, 218, 183, 0.66)",
  },
  {
    id: "forest",
    name: "Forest",
    icon: "🌲",
    cost: 2,
    sky: ["#82c4b1", "#c5dba4", "#f5dfa8"],
    sun: "rgba(255, 246, 187, 0.8)",
    sunGlow: "rgba(255, 255, 218, 0.28)",
    far: "#80a77b",
    near: "#537d68",
    sea: ["#82c5bb", "#3e7d83"],
    cloud: "rgba(255, 255, 228, 0.72)",
  },
  {
    id: "ice",
    name: "Ice",
    icon: "❄",
    cost: 3,
    sky: ["#6898c3", "#add4e1", "#e7f0e9"],
    sun: "rgba(255, 255, 244, 0.82)",
    sunGlow: "rgba(230, 250, 255, 0.35)",
    far: "#9fc4d2",
    near: "#668fa7",
    sea: ["#91c9dc", "#3f789d"],
    cloud: "rgba(249, 255, 255, 0.8)",
  },
  {
    id: "desert",
    name: "Desert",
    icon: "☀",
    cost: 4,
    sky: ["#e77d55", "#f4b463", "#f8dda0"],
    sun: "rgba(255, 241, 171, 0.86)",
    sunGlow: "rgba(255, 242, 188, 0.3)",
    far: "#e5aa6e",
    near: "#c98259",
    sea: ["#77b6c1", "#376f89"],
    cloud: "rgba(255, 241, 208, 0.7)",
  },
  {
    id: "night",
    name: "Night",
    icon: "☾",
    cost: 4,
    sky: ["#171d46", "#394a78", "#7787a7"],
    sun: "rgba(243, 244, 255, 0.88)",
    sunGlow: "rgba(218, 228, 255, 0.22)",
    far: "#4b5c82",
    near: "#354267",
    sea: ["#557b9b", "#253b60"],
    cloud: "rgba(213, 222, 255, 0.58)",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    icon: "🌌",
    cost: 6,
    sky: ["#100d2b", "#211747", "#0c1637"],
    sun: "rgba(255, 255, 255, 0.9)",
    sunGlow: "rgba(178, 126, 255, 0.22)",
    far: "#28214b",
    near: "#1c183d",
    sea: ["#2a2458", "#10152f"],
    cloud: "rgba(227, 216, 255, 0.65)",
  },
  {
    id: "football",
    name: "Football Match",
    icon: "⚽",
    cost: 5,
    sky: ["#101d3c", "#28385a", "#42546a"],
    sun: "rgba(255, 255, 255, 0.9)",
    sunGlow: "rgba(196, 220, 255, 0.25)",
    far: "#354b55",
    near: "#293d3b",
    sea: ["#398f55", "#17613e"],
    cloud: "rgba(255, 255, 255, 0.7)",
  },
  {
    id: "wind",
    name: "Wind",
    icon: "🍃",
    cost: 4,
    sky: ["#86d8ed", "#b8edf0", "#e7f8e9"],
    sun: "rgba(255, 255, 222, 0.86)",
    sunGlow: "rgba(255, 255, 235, 0.34)",
    far: "#a6d9a8",
    near: "#72bd91",
    sea: ["#80d4c2", "#42a78f"],
    cloud: "rgba(255, 255, 255, 0.86)",
  },
  {
    id: "jungle",
    name: "Jungle",
    icon: "🌴",
    cost: 5,
    sky: ["#69bdc0", "#b4d987", "#d9e78f"],
    sun: "rgba(255, 243, 164, 0.62)",
    sunGlow: "rgba(234, 255, 179, 0.2)",
    far: "#4d8c59",
    near: "#286d4b",
    sea: ["#49a574", "#1f694f"],
    cloud: "rgba(236, 255, 216, 0.62)",
  },
];

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
  nextTokenScore: number;
};

function makeWorld(phase: GamePhase = "ready"): GameWorld {
  return {
    phase,
    dragonY: HEIGHT / 2,
    velocity: 0,
    obstacles: [
      { x: 820, sprayTop: 310, fireHeight: 105, passed: false },
      { x: 820 + WHALE_SPACING, sprayTop: 240, fireHeight: 160, passed: false },
      { x: 820 + WHALE_SPACING * 2, sprayTop: 280, fireHeight: 125, passed: false },
    ],
    score: 0,
    elapsed: 0,
    storm: null,
    nextStormScore: 10,
    nextTokenScore: 10,
  };
}

function drawCloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.fillStyle = color;
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

function drawSoccerBall(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation = 0,
) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = "#f8f7f0";
  context.strokeStyle = "#25282c";
  context.lineWidth = Math.max(1, radius * 0.12);
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = "#25282c";
  context.beginPath();
  context.moveTo(-radius * 0.28, -radius * 0.12);
  context.lineTo(-radius * 0.12, -radius * 0.34);
  context.lineTo(radius * 0.14, -radius * 0.32);
  context.lineTo(radius * 0.3, -radius * 0.08);
  context.lineTo(radius * 0.2, radius * 0.2);
  context.lineTo(-radius * 0.1, radius * 0.27);
  context.closePath();
  context.fill();
  for (let patch = 0; patch < 5; patch += 1) {
    const angle = (patch * Math.PI * 2) / 5 - Math.PI / 2;
    context.beginPath();
    context.arc(
      Math.cos(angle) * radius * 0.69,
      Math.sin(angle) * radius * 0.69,
      radius * 0.16,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

function drawFootballShot(
  context: CanvasRenderingContext2D,
  obstacle: Obstacle,
  time: number,
) {
  const shotX = obstacle.x + BLOWHOLE_X;
  const top = sprayTopY(obstacle, time);
  const range = FLOOR_Y - 57 - top;
  const trail = context.createLinearGradient(shotX, FLOOR_Y - 52, shotX, top);
  trail.addColorStop(0, "rgba(255, 246, 197, 0.42)");
  trail.addColorStop(1, "rgba(255, 246, 197, 0.02)");
  context.strokeStyle = trail;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(shotX, FLOOR_Y - 52);
  context.quadraticCurveTo(shotX + 8, (FLOOR_Y + top) / 2, shotX, top);
  context.stroke();

  for (let shot = 0; shot < 3; shot += 1) {
    const progress = (time * 0.9 + shot / 3 + obstacle.x * 0.002) % 1;
    const y = FLOOR_Y - 57 - progress * range;
    const x = shotX + Math.sin(progress * Math.PI * 1.5 + shot) * 7;
    context.globalAlpha = 1 - progress * 0.24;
    drawSoccerBall(context, x, y, 9, time * 3 + shot);
  }
  context.globalAlpha = 1;

  context.fillStyle = "rgba(12, 31, 24, 0.25)";
  context.beginPath();
  context.ellipse(shotX + 2, FLOOR_Y - 9, 20, 6, 0, 0, Math.PI * 2);
  context.fill();
  drawSoccerBall(context, shotX, FLOOR_Y - 31, 21, time * 0.4 + obstacle.x * 0.01);
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

function drawStorm(context: CanvasRenderingContext2D, storm: Storm, galaxy = false) {
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

  if (galaxy) {
    context.fillStyle = "rgba(54, 51, 91, 0.3)";
    context.beginPath();
    context.ellipse(storm.x, 123, 80, 14, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#58618e";
    context.beginPath();
    context.ellipse(storm.x, 108, 69, 16, 0, 0, Math.PI * 2);
    context.fill();

    const saucer = context.createLinearGradient(storm.x, 95, storm.x, 120);
    saucer.addColorStop(0, "#dce9ff");
    saucer.addColorStop(0.46, "#8da6d5");
    saucer.addColorStop(1, "#4a5687");
    context.fillStyle = saucer;
    context.beginPath();
    context.ellipse(storm.x, 112, 74, 13, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#69799f";
    context.beginPath();
    context.ellipse(storm.x, 116, 48, 7, 0, 0, Math.PI);
    context.fill();

    const dome = context.createLinearGradient(storm.x, 80, storm.x, 105);
    dome.addColorStop(0, "#d6fbff");
    dome.addColorStop(1, "#6283bc");
    context.fillStyle = dome;
    context.beginPath();
    context.ellipse(storm.x, 102, 29, 17, 0, Math.PI, Math.PI * 2);
    context.fill();
    for (const [lightX, color] of [
      [storm.x - 48, "#ff6d8d"],
      [storm.x - 17, "#ffe27a"],
      [storm.x + 18, "#8dfff0"],
      [storm.x + 49, "#ff6d8d"],
    ] as const) {
      context.fillStyle = color;
      context.beginPath();
      context.arc(lightX, 111, 3.2, 0, Math.PI * 2);
      context.fill();
    }
  } else {
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
  }

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

type FallingFruit = "banana" | "strawberry" | "raspberry" | "coconut" | "watermelon";

function drawFallingFruit(
  context: CanvasRenderingContext2D,
  fruit: FallingFruit,
  x: number,
  y: number,
  rotation: number,
  scale: number,
) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.scale(scale, scale);

  if (fruit === "banana") {
    context.fillStyle = "#f5c84c";
    context.beginPath();
    context.moveTo(-13, -9);
    context.quadraticCurveTo(-3, 5, 14, -2);
    context.quadraticCurveTo(8, 15, -5, 13);
    context.quadraticCurveTo(-15, 10, -13, -9);
    context.closePath();
    context.fill();
    context.strokeStyle = "#d99b37";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-12, -9);
    context.lineTo(-15, -11);
    context.moveTo(13, -2);
    context.lineTo(16, -3);
    context.stroke();
  } else if (fruit === "strawberry") {
    context.fillStyle = "#ed5571";
    context.beginPath();
    context.moveTo(0, -11);
    context.bezierCurveTo(15, -14, 14, -2, 0, 12);
    context.bezierCurveTo(-14, -2, -15, -14, 0, -11);
    context.fill();
    context.fillStyle = "#78b96a";
    context.beginPath();
    context.moveTo(-9, -10);
    context.lineTo(-5, -17);
    context.lineTo(0, -12);
    context.lineTo(5, -17);
    context.lineTo(10, -10);
    context.lineTo(0, -7);
    context.closePath();
    context.fill();
    context.fillStyle = "#ffe39b";
    for (const [seedX, seedY] of [[-6, -5], [2, -4], [-3, 2], [6, 1], [1, 7]]) {
      context.beginPath();
      context.ellipse(seedX, seedY, 1, 1.8, 0, 0, Math.PI * 2);
      context.fill();
    }
  } else if (fruit === "raspberry") {
    context.fillStyle = "#d93669";
    for (const [berryX, berryY, radius] of [
      [-5, -5, 6],
      [4, -7, 6],
      [-8, 2, 6],
      [1, 1, 7],
      [8, 2, 5],
      [-4, 9, 5],
      [5, 9, 5],
    ]) {
      context.beginPath();
      context.arc(berryX, berryY, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = "#8fc96d";
    context.beginPath();
    context.moveTo(-6, -10);
    context.lineTo(-3, -17);
    context.lineTo(1, -11);
    context.lineTo(6, -17);
    context.lineTo(7, -9);
    context.closePath();
    context.fill();
  } else if (fruit === "coconut") {
    context.fillStyle = "#79513f";
    context.beginPath();
    context.arc(0, 0, 13, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f5ead1";
    context.beginPath();
    context.arc(0, 0, 9.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#79513f";
    for (const [eyeX, eyeY] of [[-4, -3], [4, -3], [0, 4]]) {
      context.beginPath();
      context.arc(eyeX, eyeY, 1.4, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    context.fillStyle = "#4c9d63";
    context.beginPath();
    context.moveTo(-15, -8);
    context.quadraticCurveTo(0, -14, 15, -8);
    context.lineTo(11, 6);
    context.quadraticCurveTo(0, 13, -11, 6);
    context.closePath();
    context.fill();
    context.fillStyle = "#f16b78";
    context.beginPath();
    context.moveTo(-11, -7);
    context.quadraticCurveTo(0, -11, 11, -7);
    context.lineTo(8, 4);
    context.quadraticCurveTo(0, 9, -8, 4);
    context.closePath();
    context.fill();
    context.fillStyle = "#332d43";
    for (const [seedX, seedY] of [[-5, -4], [3, -5], [0, 1], [6, 2], [-4, 4]]) {
      context.beginPath();
      context.ellipse(seedX, seedY, 1, 1.7, -0.3, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.restore();
}

function drawFruitRain(context: CanvasRenderingContext2D, time: number, dragonY: number) {
  const fruits: FallingFruit[] = ["banana", "strawberry", "raspberry", "coconut", "watermelon"];
  const loopHeight = FLOOR_Y + 90;

  for (let fruitIndex = 0; fruitIndex < 15; fruitIndex += 1) {
    const x = (fruitIndex * 137 + 61) % WIDTH;
    const speed = 72 + (fruitIndex % 4) * 17;
    const y = ((time * speed + fruitIndex * 113) % loopHeight) - 70;
    if (y > FLOOR_Y - 18) continue;
    if (Math.abs(x - DRAGON_X) < 70 && Math.abs(y - dragonY) < 58) continue;

    const rotation = Math.sin(time * 1.5 + fruitIndex * 2.1) * 0.35;
    const scale = 0.72 + (fruitIndex % 3) * 0.13;
    drawFallingFruit(
      context,
      fruits[fruitIndex % fruits.length],
      x,
      y,
      rotation,
      scale,
    );
  }
}

function drawGalaxyBackground(
  context: CanvasRenderingContext2D,
  time: number,
) {
  const space = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  space.addColorStop(0, "#100d2b");
  space.addColorStop(0.52, "#241747");
  space.addColorStop(1, "#0b1737");
  context.fillStyle = space;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const nebulae = [
    { x: 205, y: 170, radius: 220, color: "rgba(133, 71, 196, 0.3)" },
    { x: 675, y: 300, radius: 280, color: "rgba(48, 117, 204, 0.24)" },
    { x: 475, y: 75, radius: 170, color: "rgba(226, 85, 180, 0.17)" },
  ];
  for (const nebula of nebulae) {
    const glow = context.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
    glow.addColorStop(0, nebula.color);
    glow.addColorStop(1, "rgba(20, 17, 54, 0)");
    context.fillStyle = glow;
    context.fillRect(nebula.x - nebula.radius, nebula.y - nebula.radius, nebula.radius * 2, nebula.radius * 2);
  }

  for (let star = 0; star < 100; star += 1) {
    const x = (star * 173 + 47) % WIDTH;
    const y = (star * 83 + 29) % HEIGHT;
    const twinkle = 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(time * 1.8 + star * 2.4));
    context.globalAlpha = twinkle;
    context.fillStyle = star % 9 === 0 ? "#d9c6ff" : "#ffffff";
    context.beginPath();
    context.arc(x, y, star % 11 === 0 ? 2 : 1, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  const planets = [
    { x: 755, y: 145, radius: 41, color: "#db8b72", ring: "#f2c08a" },
    { x: 470, y: 358, radius: 27, color: "#6d83d0", ring: "#b1a2ff" },
    { x: 100, y: 330, radius: 17, color: "#64c4b8", ring: "#a9f1df" },
  ];
  for (const planet of planets) {
    context.save();
    context.translate(planet.x, planet.y);
    context.rotate(-0.2);
    context.strokeStyle = planet.ring;
    context.globalAlpha = 0.78;
    context.lineWidth = 5;
    context.beginPath();
    context.ellipse(0, 0, planet.radius * 1.55, planet.radius * 0.43, 0, 0, Math.PI * 2);
    context.stroke();
    const planetFill = context.createRadialGradient(
      -planet.radius * 0.35,
      -planet.radius * 0.38,
      1,
      0,
      0,
      planet.radius,
    );
    planetFill.addColorStop(0, "#fff3df");
    planetFill.addColorStop(0.28, planet.color);
    planetFill.addColorStop(1, "#2c2457");
    context.globalAlpha = 1;
    context.fillStyle = planetFill;
    context.beginPath();
    context.arc(0, 0, planet.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

}

function drawFootballBackground(context: CanvasRenderingContext2D, time: number) {
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#111a35");
  sky.addColorStop(0.58, "#273451");
  sky.addColorStop(1, "#43515a");
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  for (const lightX of [125, 835]) {
    const glow = context.createRadialGradient(lightX, 165, 4, lightX, 165, 260);
    glow.addColorStop(0, "rgba(255, 246, 204, 0.28)");
    glow.addColorStop(1, "rgba(255, 246, 204, 0)");
    context.fillStyle = glow;
    context.fillRect(lightX - 260, 0, 520, 425);
  }

  context.fillStyle = "#182238";
  context.beginPath();
  context.moveTo(0, 91);
  context.lineTo(124, 132);
  context.lineTo(304, 171);
  context.lineTo(656, 171);
  context.lineTo(836, 132);
  context.lineTo(WIDTH, 91);
  context.lineTo(WIDTH, 355);
  context.lineTo(0, 355);
  context.closePath();
  context.fill();

  const crowdColors = ["#f3d16f", "#ef765f", "#e7edf2", "#62b5cb", "#b99ae9"];
  for (let row = 0; row < 6; row += 1) {
    const y = 190 + row * 25;
    context.fillStyle = row % 2 === 0 ? "#33415a" : "#29364e";
    context.fillRect(0, y + 10, WIDTH, 17);
    for (let seat = 0; seat < 42; seat += 1) {
      const x = seat * 24 + ((row % 2) * 11);
      const colorIndex = (seat * 7 + row * 11) % crowdColors.length;
      context.globalAlpha = 0.72 + 0.2 * (0.5 + 0.5 * Math.sin(time * 3 + seat * 1.7 + row));
      context.fillStyle = crowdColors[colorIndex];
      context.beginPath();
      context.arc(x + 8, y + ((seat + row) % 3), 3.2, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;

  for (const lightX of [125, 835]) {
    context.strokeStyle = "#78839a";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(lightX, 181);
    context.lineTo(lightX, 114);
    context.stroke();
    context.fillStyle = "#fff6cf";
    context.shadowColor = "#fff1bd";
    context.shadowBlur = 20;
    context.fillRect(lightX - 28, 105, 56, 10);
    context.shadowBlur = 0;
  }

  const pitch = context.createLinearGradient(0, 362, 0, HEIGHT);
  pitch.addColorStop(0, "#45a85a");
  pitch.addColorStop(1, "#19733e");
  context.fillStyle = pitch;
  context.fillRect(0, 362, WIDTH, HEIGHT - 362);
  for (let stripe = 0; stripe < 8; stripe += 1) {
    context.fillStyle = stripe % 2 === 0 ? "rgba(196, 241, 161, 0.08)" : "rgba(0, 49, 31, 0.08)";
    context.fillRect(stripe * 120, 362, 120, HEIGHT - 362);
  }

  context.strokeStyle = "rgba(239, 255, 228, 0.88)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, 371);
  context.lineTo(WIDTH, 371);
  context.moveTo(480, 371);
  context.lineTo(480, HEIGHT);
  context.ellipse(480, 435, 47, 42, 0, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = "rgba(248, 255, 241, 0.92)";
  context.lineWidth = 5;
  context.strokeRect(663, 302, 151, 129);
  context.lineWidth = 2;
  for (let netX = 674; netX < 814; netX += 18) {
    context.beginPath();
    context.moveTo(netX, 305);
    context.lineTo(netX, 428);
    context.stroke();
  }
  for (let netY = 316; netY < 430; netY += 17) {
    context.beginPath();
    context.moveTo(665, netY);
    context.lineTo(812, netY);
    context.stroke();
  }
}

function drawWindBackground(context: CanvasRenderingContext2D, time: number) {
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#86d8ed");
  sky.addColorStop(0.58, "#c0eef0");
  sky.addColorStop(1, "#f0f8e6");
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const sunGlow = context.createRadialGradient(765, 105, 8, 765, 105, 115);
  sunGlow.addColorStop(0, "rgba(255, 255, 221, 0.88)");
  sunGlow.addColorStop(1, "rgba(255, 255, 221, 0)");
  context.fillStyle = sunGlow;
  context.fillRect(650, 0, 230, 220);
  context.fillStyle = "rgba(255, 255, 226, 0.86)";
  context.beginPath();
  context.arc(765, 105, 42, 0, Math.PI * 2);
  context.fill();

  drawCloud(context, 180 - ((time * 22) % 1150), 115, 0.9, "rgba(255, 255, 255, 0.88)");
  drawCloud(context, 570 - ((time * 30) % 1200), 198, 0.65, "rgba(255, 255, 255, 0.76)");
  drawCloud(context, 1040 - ((time * 18) % 1250), 95, 0.72, "rgba(255, 255, 255, 0.82)");

  for (let gust = 0; gust < 9; gust += 1) {
    const lane = gust % 5;
    const x = ((time * (80 + (gust % 3) * 24) + gust * 151) % (WIDTH + 220)) - 110;
    const y = 85 + lane * 49 + Math.sin(time * 1.4 + gust) * 9;
    context.globalAlpha = 0.2 + (gust % 3) * 0.06;
    context.strokeStyle = gust % 2 === 0 ? "#ffffff" : "#7dcbd4";
    context.lineWidth = 2 + (gust % 2);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(x, y);
    context.bezierCurveTo(x + 24, y - 10, x + 47, y + 10, x + 72, y);
    context.bezierCurveTo(x + 96, y - 9, x + 117, y + 6, x + 142, y - 2);
    context.stroke();
  }
  context.globalAlpha = 1;

  drawCloud(context, 120 - ((time * 13) % 1200), 356, 1.15, "rgba(255, 255, 255, 0.38)");
  drawCloud(context, 690 - ((time * 17) % 1300), 332, 0.9, "rgba(255, 255, 255, 0.34)");

  const horizon = context.createLinearGradient(0, 390, 0, HEIGHT);
  horizon.addColorStop(0, "rgba(143, 213, 218, 0.24)");
  horizon.addColorStop(1, "#69bdc2");
  context.fillStyle = horizon;
  context.fillRect(0, 390, WIDTH, HEIGHT - 390);
  context.strokeStyle = "rgba(242, 255, 250, 0.72)";
  context.lineWidth = 3;
  context.beginPath();
  for (let x = 0; x <= WIDTH; x += 8) {
    const waveY = FLOOR_Y + 5 + Math.sin((x + time * 80) / 26) * 3;
    if (x === 0) context.moveTo(x, waveY);
    else context.lineTo(x, waveY);
  }
  context.stroke();
}

function drawJungleBackground(context: CanvasRenderingContext2D, time: number) {
  const sky = context.createLinearGradient(0, 0, 0, FLOOR_Y);
  sky.addColorStop(0, "#4aa9a0");
  sky.addColorStop(0.58, "#a9d77d");
  sky.addColorStop(1, "#e5dc83");
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const sunGlow = context.createRadialGradient(746, 137, 8, 746, 137, 142);
  sunGlow.addColorStop(0, "rgba(255, 246, 165, 0.55)");
  sunGlow.addColorStop(1, "rgba(255, 246, 165, 0)");
  context.fillStyle = sunGlow;
  context.fillRect(600, 0, 290, 300);
  context.fillStyle = "rgba(255, 240, 158, 0.75)";
  context.beginPath();
  context.arc(746, 137, 35, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#397a55";
  context.beginPath();
  context.moveTo(0, 305);
  context.quadraticCurveTo(174, 245, 340, 313);
  context.quadraticCurveTo(527, 240, 716, 308);
  context.quadraticCurveTo(866, 250, WIDTH, 300);
  context.lineTo(WIDTH, FLOOR_Y);
  context.lineTo(0, FLOOR_Y);
  context.closePath();
  context.fill();

  for (let tree = 0; tree < 12; tree += 1) {
    const x = tree * 94 - 20;
    const trunkTop = 190 + (tree % 4) * 22;
    const trunkWidth = 23 + (tree % 3) * 7;
    context.fillStyle = tree % 2 === 0 ? "#563a26" : "#70472b";
    context.fillRect(x, trunkTop, trunkWidth, FLOOR_Y - trunkTop);
    context.fillStyle = "#a0723e";
    context.fillRect(x + 5, trunkTop, 5, FLOOR_Y - trunkTop);

    const crownX = x + trunkWidth / 2;
    const crownY = trunkTop - 15;
    context.fillStyle = tree % 2 === 0 ? "#17623b" : "#207744";
    context.beginPath();
    context.ellipse(crownX, crownY, 62, 33, 0, 0, Math.PI * 2);
    context.ellipse(crownX - 35, crownY + 9, 37, 28, -0.3, 0, Math.PI * 2);
    context.ellipse(crownX + 34, crownY + 10, 39, 27, 0.3, 0, Math.PI * 2);
    context.ellipse(crownX, crownY - 20, 38, 29, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = tree % 2 === 0 ? "#3d9a4f" : "#4ca84c";
    for (let frond = 0; frond < 5; frond += 1) {
      const frondX = crownX - 44 + frond * 22;
      context.beginPath();
      context.ellipse(frondX, crownY - 9 - (frond % 2) * 8, 18, 7, -0.35 + frond * 0.15, 0, Math.PI * 2);
      context.fill();
    }

    for (let branch = 0; branch < 3; branch += 1) {
      const leafX = x + (branch - 1) * 24;
      const leafY = trunkTop + branch * 34;
      context.fillStyle = (tree + branch) % 2 === 0 ? "#1f754b" : "#2b8a50";
      context.beginPath();
      context.ellipse(leafX, leafY, 34, 15, -0.5 + branch * 0.35, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(183, 226, 115, 0.55)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(leafX - 24, leafY + 9);
      context.lineTo(leafX + 24, leafY - 9);
      context.stroke();
    }

    const vineLength = 54 + (tree % 4) * 18;
    const vineX = x + trunkWidth + 7;
    context.strokeStyle = "#77a64a";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(vineX, trunkTop);
    context.bezierCurveTo(vineX + 12, trunkTop + vineLength * 0.35, vineX - 13, trunkTop + vineLength * 0.7, vineX + 3, trunkTop + vineLength);
    context.stroke();
    for (let leaf = 0; leaf < 3; leaf += 1) {
      const leafY = trunkTop + 18 + leaf * 22;
      context.fillStyle = leaf % 2 === 0 ? "#a3cc55" : "#5caa50";
      context.beginPath();
      context.ellipse(vineX + (leaf % 2 === 0 ? 8 : -8), leafY, 8, 4, leaf % 2 === 0 ? 0.6 : -0.6, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.fillStyle = "rgba(33, 99, 61, 0.78)";
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(112, 82 + Math.sin(time) * 4, 225, 28);
  context.quadraticCurveTo(346, 103, 470, 24);
  context.quadraticCurveTo(597, 90, 724, 19);
  context.quadraticCurveTo(859, 96, WIDTH, 24);
  context.lineTo(WIDTH, 0);
  context.closePath();
  context.fill();

  for (let leaf = 0; leaf < 18; leaf += 1) {
    const x = (leaf * 71 + 23) % WIDTH;
    const y = 16 + (leaf % 4) * 17 + Math.sin(time * 1.4 + leaf) * 3;
    context.fillStyle = leaf % 2 === 0 ? "#58a94c" : "#79bd4f";
    context.beginPath();
    context.ellipse(x, y, 24, 8, Math.sin(leaf) * 0.3, 0, Math.PI * 2);
    context.fill();
  }

  const water = context.createLinearGradient(0, FLOOR_Y, 0, HEIGHT);
  water.addColorStop(0, "#49a574");
  water.addColorStop(1, "#1f694f");
  context.fillStyle = water;
  context.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
  context.strokeStyle = "rgba(223, 255, 191, 0.55)";
  context.lineWidth = 3;
  context.beginPath();
  for (let x = 0; x <= WIDTH; x += 8) {
    const waterY = FLOOR_Y + 5 + Math.sin((x + time * 80) / 26) * 3;
    if (x === 0) context.moveTo(x, waterY);
    else context.lineTo(x, waterY);
  }
  context.stroke();
}

function drawMilkywayShootingStars(context: CanvasRenderingContext2D, time: number) {
  const shootingStars = [
    { x: 335, y: 82, phase: 0 },
    { x: 835, y: 233, phase: 1.8 },
    { x: 580, y: 185, phase: 3.4 },
  ];
  for (const shootingStar of shootingStars) {
    const blink = Math.pow(Math.max(0, Math.sin(time * 2.8 + shootingStar.phase)), 7);
    if (blink < 0.08) continue;

    context.save();
    context.globalAlpha = blink;
    context.shadowColor = "#fff4c2";
    context.shadowBlur = 18 * blink;
    context.strokeStyle = "#fff7d5";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(shootingStar.x - 7, shootingStar.y);
    context.lineTo(shootingStar.x + 7, shootingStar.y);
    context.moveTo(shootingStar.x, shootingStar.y - 7);
    context.lineTo(shootingStar.x, shootingStar.y + 7);
    context.moveTo(shootingStar.x - 4, shootingStar.y - 4);
    context.lineTo(shootingStar.x + 4, shootingStar.y + 4);
    context.moveTo(shootingStar.x + 4, shootingStar.y - 4);
    context.lineTo(shootingStar.x - 4, shootingStar.y + 4);
    context.stroke();
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(shootingStar.x, shootingStar.y, 2.5, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

function drawSpaceship(
  context: CanvasRenderingContext2D,
  x: number,
  time: number,
  fireHeight: number,
) {
  const y = FLOOR_Y - 29;
  const flamePulse = 0.68 + 0.32 * Math.sin(time * 16 + x * 0.04);

  context.save();
  context.translate(x + WHALE_WIDTH / 2, y);

  const firePlume = context.createLinearGradient(0, -fireHeight, 0, -12);
  firePlume.addColorStop(0, "rgba(255, 91, 48, 0)");
  firePlume.addColorStop(0.35, "rgba(255, 112, 42, 0.72)");
  firePlume.addColorStop(0.78, "rgba(255, 179, 54, 0.92)");
  firePlume.addColorStop(1, "rgba(255, 244, 157, 0.98)");
  context.fillStyle = firePlume;
  context.shadowColor = "#ff7438";
  context.shadowBlur = 18;
  context.beginPath();
  context.moveTo(-7, -13);
  context.quadraticCurveTo(-19 - flamePulse * 5, -42, -8, -66);
  context.quadraticCurveTo(-14, -fireHeight * 0.72, -2, -fireHeight);
  context.quadraticCurveTo(3, -fireHeight * 0.72, 12, -75);
  context.quadraticCurveTo(20 + flamePulse * 4, -48, 7, -13);
  context.closePath();
  context.fill();
  context.shadowBlur = 0;

  for (let spark = 0; spark < 6; spark += 1) {
    const rise = (time * 0.72 + spark * 0.19 + x * 0.001) % 1;
    const sparkY = -18 - rise * (fireHeight - 20);
    const sparkX = Math.sin(time * 7 + spark * 1.9 + x * 0.01) * (3 + rise * 8);
    context.globalAlpha = 1 - rise * 0.35;
    context.fillStyle = spark % 2 === 0 ? "#fff6a6" : "#ff9b43";
    context.beginPath();
    context.ellipse(sparkX, sparkY, 2.5 + rise * 1.5, 5 + rise * 2, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  const engineFlame = context.createLinearGradient(10, 0, 52, 0);
  engineFlame.addColorStop(0, "rgba(255, 237, 129, 0.95)");
  engineFlame.addColorStop(0.35, "rgba(255, 137, 67, 0.9)");
  engineFlame.addColorStop(1, "rgba(255, 75, 96, 0)");
  context.fillStyle = engineFlame;
  context.globalAlpha = flamePulse;
  context.beginPath();
  context.moveTo(12, -9);
  context.lineTo(53 + flamePulse * 8, -15);
  context.lineTo(45, -5);
  context.lineTo(56 + flamePulse * 8, 2);
  context.lineTo(12, -1);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = "#6976b9";
  context.beginPath();
  context.moveTo(18, -18);
  context.lineTo(-28, -10);
  context.lineTo(-51, -2);
  context.lineTo(-26, 4);
  context.lineTo(20, 12);
  context.lineTo(52, 4);
  context.lineTo(36, -4);
  context.closePath();
  context.fill();

  const hull = context.createLinearGradient(0, -16, 0, 11);
  hull.addColorStop(0, "#e3e8ff");
  hull.addColorStop(0.4, "#8998d4");
  hull.addColorStop(1, "#454d82");
  context.fillStyle = hull;
  context.beginPath();
  context.moveTo(-53, -3);
  context.lineTo(-18, -15);
  context.lineTo(30, -10);
  context.lineTo(43, -3);
  context.lineTo(26, 6);
  context.lineTo(-18, 10);
  context.closePath();
  context.fill();

  context.fillStyle = "#242443";
  context.beginPath();
  context.ellipse(4, -7, 13, 7, -0.15, Math.PI, Math.PI * 2);
  context.fill();
  context.fillStyle = "#9ce9ff";
  context.beginPath();
  context.ellipse(4, -8, 9, 4, -0.15, Math.PI, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffcf74";
  context.beginPath();
  context.arc(-35, -2, 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawDragon(
  context: CanvasRenderingContext2D,
  y: number,
  velocity: number,
  elapsed: number,
  skin: DragonSkin,
  glowTime: number,
) {
  const tilt = Math.max(-0.42, Math.min(0.48, velocity / 1150));
  const wingBeat = Math.sin(elapsed * 10) * 0.24;
  context.save();
  context.translate(DRAGON_X, y);
  context.rotate(tilt);

  if (skin.id === "milkyway") {
    context.shadowColor = "rgba(181, 163, 255, 0.55)";
    context.shadowBlur = 10;
  } else if (skin.accessory === "gangsta") {
    context.shadowColor = "rgba(255, 166, 12, 1)";
    context.shadowBlur = 30 + (Math.sin(glowTime * 4) + 1) * 12;
  }

  context.fillStyle = "rgba(42, 34, 69, 0.2)";
  context.beginPath();
  context.ellipse(-1, 24, 31, 8, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = skin.bodyDark;
  context.beginPath();
  context.moveTo(-15, 8);
  context.quadraticCurveTo(-43, 21, -48, 7);
  context.quadraticCurveTo(-30, 18, -21, -2);
  context.fill();
  if (skin.accessory === "scansoriopterygid") {
    context.strokeStyle = skin.bodyDark;
    context.lineWidth = 2;
    context.lineCap = "round";
    for (let feather = 0; feather < 3; feather += 1) {
      context.beginPath();
      context.moveTo(-26 + feather * 3, 5 + feather * 2);
      context.quadraticCurveTo(-39 - feather * 3, 4 + feather * 3, -54 - feather * 4, 1 + feather * 5);
      context.stroke();
    }
  }
  context.fillStyle =
    skin.accessory === "deer" || skin.accessory === "cat" ? skin.bodyDark : skin.accent;
  context.beginPath();
  context.arc(-48, 7, 4, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(-5, -8);
  context.rotate(wingBeat);
  context.fillStyle = skin.wing;
  context.beginPath();
  context.moveTo(1, 4);
  context.quadraticCurveTo(-2, -40, -34, -42);
  context.quadraticCurveTo(-29, -17, -15, 7);
  context.closePath();
  context.fill();
  if (skin.accessory === "scansoriopterygid") {
    context.save();
    context.beginPath();
    context.moveTo(1, 4);
    context.quadraticCurveTo(-2, -40, -34, -42);
    context.quadraticCurveTo(-29, -17, -15, 7);
    context.closePath();
    context.clip();
    context.strokeStyle = skin.bodyDark;
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-5, 1);
    context.quadraticCurveTo(-20, -23, -38, -40);
    context.moveTo(-7, 2);
    context.quadraticCurveTo(-22, -9, -31, -23);
    context.stroke();
    context.strokeStyle = skin.bodyDark;
    context.lineWidth = 2;
    for (let feather = 0; feather < 4; feather += 1) {
      context.beginPath();
      context.moveTo(-9 - feather * 4, 1 - feather * 3);
      context.quadraticCurveTo(-21 - feather * 5, -12 - feather * 4, -30 - feather * 2, -17 - feather * 6);
      context.stroke();
    }
    context.restore();
  }
  if (skin.accessory === "spots") {
    context.save();
    context.beginPath();
    context.moveTo(1, 4);
    context.quadraticCurveTo(-2, -40, -34, -42);
    context.quadraticCurveTo(-29, -17, -15, 7);
    context.closePath();
    context.clip();
    context.fillStyle = skin.accent;
    for (const [spotX, spotY, radius] of [[-25, -30, 4], [-16, -18, 3], [-27, -8, 2.5]]) {
      context.beginPath();
      context.arc(spotX, spotY, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  if (skin.id === "milkyway") {
    context.save();
    context.beginPath();
    context.moveTo(1, 4);
    context.quadraticCurveTo(-2, -40, -34, -42);
    context.quadraticCurveTo(-29, -17, -15, 7);
    context.closePath();
    context.clip();
    context.fillStyle = "rgba(244, 236, 255, 0.9)";
    for (const [starX, starY, radius] of [
      [-23, -29, 1.7],
      [-14, -20, 1.2],
      [-27, -12, 1],
      [-9, -34, 1.2],
    ]) {
      context.beginPath();
      context.arc(starX, starY, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  context.strokeStyle = skin.wingLine;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-5, 1);
  context.lineTo(-27, -32);
  context.moveTo(-8, 3);
  context.lineTo(-25, -14);
  context.stroke();
  context.restore();

  context.fillStyle = skin.body;
  context.beginPath();
  context.ellipse(-3, 3, 27, 19, -0.08, 0, Math.PI * 2);
  context.fill();
  if (skin.accessory === "scansoriopterygid") {
    context.fillStyle = skin.bodyDark;
    context.beginPath();
    context.moveTo(-25, -9);
    context.lineTo(-22, -18);
    context.lineTo(-16, -11);
    context.lineTo(-11, -21);
    context.lineTo(-6, -12);
    context.lineTo(0, -20);
    context.lineTo(5, -10);
    context.lineTo(12, -16);
    context.lineTo(10, -5);
    context.closePath();
    context.fill();
  }
  if (skin.accessory === "cat") {
    context.save();
    context.beginPath();
    context.ellipse(-3, 3, 27, 19, -0.08, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = skin.accent;
    context.beginPath();
    context.ellipse(6, 8, 15, 11, -0.2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  if (skin.accessory === "spots") {
    context.save();
    context.beginPath();
    context.ellipse(-3, 3, 27, 19, -0.08, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = skin.accent;
    for (const [spotX, spotY, radius] of [[-20, -4, 5], [-5, -9, 4], [10, -5, 4], [20, 2, 2.5]]) {
      context.beginPath();
      context.arc(spotX, spotY, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  if (skin.id === "milkyway") {
    context.save();
    context.beginPath();
    context.ellipse(-3, 3, 27, 19, -0.08, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = "rgba(244, 236, 255, 0.92)";
    for (const [starX, starY, radius] of [
      [-20, -1, 1.5],
      [-10, -8, 1],
      [-9, 7, 1.2],
      [0, -4, 1.6],
      [6, 8, 1],
      [12, -1, 1.2],
    ]) {
      context.beginPath();
      context.arc(starX, starY, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  context.fillStyle = skin.belly;
  context.beginPath();
  context.ellipse(-2, 14, 14, 6, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = skin.bodyDark;
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-11, 17);
  context.lineTo(-13, 24);
  context.moveTo(5, 17);
  context.lineTo(3, 24);
  context.stroke();

  context.fillStyle = skin.body;
  context.beginPath();
  context.ellipse(18, -6, 19, 16, 0.08, 0, Math.PI * 2);
  context.fill();
  if (skin.accessory === "cat") {
    context.fillStyle = skin.accent;
    context.beginPath();
    context.moveTo(7, -17);
    context.lineTo(9, -34);
    context.lineTo(21, -22);
    context.closePath();
    context.moveTo(22, -21);
    context.lineTo(34, -35);
    context.lineTo(34, -15);
    context.closePath();
    context.fill();
    context.fillStyle = "#b8a7b3";
    context.beginPath();
    context.moveTo(11, -21);
    context.lineTo(12, -29);
    context.lineTo(18, -22);
    context.closePath();
    context.moveTo(27, -22);
    context.lineTo(32, -29);
    context.lineTo(32, -20);
    context.closePath();
    context.fill();
  }
  if (skin.accessory === "scansoriopterygid") {
    context.fillStyle = skin.snout;
    context.beginPath();
    context.moveTo(24, -4);
    context.lineTo(44, -3);
    context.lineTo(50, 1);
    context.lineTo(43, 5);
    context.lineTo(27, 5);
    context.closePath();
    context.fill();
    context.fillStyle = "#f3dfb7";
    for (const toothX of [31, 38, 44]) {
      context.beginPath();
      context.moveTo(toothX, 4);
      context.lineTo(toothX + 2, 9);
      context.lineTo(toothX + 4, 4);
      context.closePath();
      context.fill();
    }
    context.fillStyle = skin.bodyDark;
    context.beginPath();
    context.ellipse(43, -1, 1.6, 1, 0, 0, Math.PI * 2);
    context.fill();
  } else {
    context.fillStyle = skin.snout;
    context.beginPath();
    context.ellipse(31, 1, 12, 8, 0.08, 0, Math.PI * 2);
    context.fill();
  }
  if (skin.accessory === "gangsta") {
    context.fillStyle = "#e99932";
    context.beginPath();
    context.moveTo(29, -1);
    context.quadraticCurveTo(43, -3, 45, 2);
    context.quadraticCurveTo(39, 7, 29, 4);
    context.closePath();
    context.fill();
  }

  if (skin.accessory === "cat") {
    context.fillStyle = skin.horn;
    context.beginPath();
    context.moveTo(8, -18);
    context.lineTo(9, -33);
    context.lineTo(19, -19);
    context.closePath();
    context.moveTo(21, -19);
    context.lineTo(31, -34);
    context.lineTo(30, -16);
    context.closePath();
    context.fill();
  } else if (skin.accessory === "deer") {
    context.strokeStyle = skin.horn;
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(13, -17);
    context.lineTo(10, -27);
    context.lineTo(4, -33);
    context.moveTo(10, -27);
    context.lineTo(12, -35);
    context.moveTo(25, -17);
    context.lineTo(29, -27);
    context.lineTo(35, -33);
    context.moveTo(29, -27);
    context.lineTo(27, -35);
    context.stroke();
  } else if (skin.accessory !== "scansoriopterygid") {
    context.fillStyle = skin.horn;
    context.beginPath();
    context.moveTo(8, -18);
    context.lineTo(5, -30);
    context.quadraticCurveTo(16, -25, 17, -15);
    context.moveTo(20, -19);
    context.lineTo(24, -29);
    context.quadraticCurveTo(30, -23, 27, -15);
    context.fill();
  }

  if (skin.accessory === "flame") {
    context.fillStyle = skin.accent;
    context.beginPath();
    context.moveTo(-2, -15);
    context.lineTo(3, -26);
    context.lineTo(8, -16);
    context.lineTo(13, -28);
    context.lineTo(18, -15);
    context.closePath();
    context.fill();
  } else if (skin.accessory === "leaves") {
    context.fillStyle = skin.accent;
    for (const [x, y] of [[-19, -6], [-8, -10], [3, -11]]) {
      context.beginPath();
      context.ellipse(x, y, 4, 8, -0.65, 0, Math.PI * 2);
      context.fill();
    }
  } else if (skin.accessory === "ice") {
    context.fillStyle = skin.accent;
    context.beginPath();
    context.moveTo(-17, -10);
    context.lineTo(-13, -20);
    context.lineTo(-8, -10);
    context.lineTo(-2, -23);
    context.lineTo(4, -10);
    context.lineTo(10, -20);
    context.lineTo(15, -8);
    context.closePath();
    context.fill();
  } else if (skin.accessory === "wind") {
    context.strokeStyle = skin.accent;
    context.lineWidth = 2;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-20, -1);
    context.bezierCurveTo(-11, -9, -3, -8, -5, -2);
    context.bezierCurveTo(-7, 2, -13, 1, -12, -3);
    context.moveTo(-8, 8);
    context.bezierCurveTo(1, 0, 10, 2, 8, 8);
    context.bezierCurveTo(6, 12, 0, 11, 1, 7);
    context.stroke();
    context.beginPath();
    context.moveTo(-26, -8);
    context.quadraticCurveTo(-18, -13, -10, -10);
    context.moveTo(-1, -12);
    context.quadraticCurveTo(6, -16, 14, -11);
    context.stroke();
  } else if (skin.accessory === "crown") {
    context.fillStyle = skin.accent;
    context.beginPath();
    context.moveTo(11, -21);
    context.lineTo(10, -31);
    context.lineTo(17, -25);
    context.lineTo(22, -35);
    context.lineTo(27, -25);
    context.lineTo(34, -31);
    context.lineTo(32, -19);
    context.closePath();
    context.fill();
    context.fillRect(12, -20, 20, 3);
  } else if (skin.accessory === "deer") {
    context.fillStyle = skin.accent;
    context.beginPath();
    context.arc(41, 2, 5.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255, 235, 235, 0.9)";
    context.beginPath();
    context.arc(39, 0, 1.8, 0, Math.PI * 2);
    context.fill();
  } else if (skin.accessory === "gangsta") {
    context.fillStyle = "#29253e";
    context.beginPath();
    context.moveTo(6, -19);
    context.quadraticCurveTo(8, -39, 25, -36);
    context.quadraticCurveTo(35, -33, 35, -21);
    context.lineTo(39, -17);
    context.quadraticCurveTo(22, -13, 7, -17);
    context.closePath();
    context.fill();
    context.fillStyle = "#e8ac28";
    context.font = "bold 5px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("GANGSTA", 22, -27);

    context.strokeStyle = "#d99b19";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-2, 8);
    context.lineTo(-2, 15);
    context.stroke();
    context.fillStyle = "#f4c343";
    context.strokeStyle = "#a87312";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(-17, 14, 30, 16, 3);
    context.fill();
    context.stroke();
    context.fillStyle = "#543c12";
    context.font = "bold 6px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Gangster", -2, 22);
  } else if (skin.accessory === "dragonfruit") {
    context.fillStyle = skin.accent;
    context.beginPath();
    context.moveTo(-26, -2);
    context.lineTo(-27, -13);
    context.lineTo(-18, -9);
    context.lineTo(-15, -20);
    context.lineTo(-7, -11);
    context.lineTo(1, -22);
    context.lineTo(7, -12);
    context.lineTo(15, -22);
    context.lineTo(17, -10);
    context.lineTo(26, -15);
    context.lineTo(24, -3);
    context.closePath();
    context.fill();
    context.fillStyle = "#d9f19a";
    for (const [spineX, spineY] of [[-21, -6], [-12, -12], [-3, -11], [7, -12], [18, -7]]) {
      context.beginPath();
      context.ellipse(spineX, spineY, 2.2, 4.2, -0.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  if (skin.accessory === "scansoriopterygid") {
    context.shadowColor = "#ff1717";
    context.shadowBlur = 16;
    context.fillStyle = "#ff2424";
    context.beginPath();
    context.ellipse(22, -9, 3.2, 2.4, -0.15, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#241716";
    context.fillRect(22, -11, 1, 4);
    context.strokeStyle = skin.bodyDark;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(16, -14);
    context.lineTo(27, -13);
    context.stroke();
  } else {
    context.fillStyle = "#29253e";
    context.beginPath();
    context.arc(22, -9, 3, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff8e9";
    context.beginPath();
    context.arc(23, -10, 1, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = skin.bodyDark;
  context.beginPath();
  context.arc(35, -1, 1.5, 0, Math.PI * 2);
  context.fill();
  if (skin.accessory === "cat") {
    context.strokeStyle = skin.accent;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(31, 4);
    context.lineTo(43, 1);
    context.moveTo(31, 7);
    context.lineTo(43, 8);
    context.moveTo(31, 10);
    context.lineTo(41, 14);
    context.stroke();
    context.fillStyle = "#e99cae";
    context.beginPath();
    context.moveTo(34, 2);
    context.lineTo(39, 2);
    context.lineTo(36.5, 5);
    context.closePath();
    context.fill();
  }
  context.restore();
}

function drawMuffinScratch(context: CanvasRenderingContext2D, y: number, elapsed: number) {
  const cycle = elapsed % 1.35;
  if (cycle > 1.1) return;

  const progress = 0.65 + Math.abs(Math.sin(cycle * Math.PI * 6)) * 0.35;
  const fade = cycle < 0.9 ? 1 : (1.1 - cycle) / 0.2;
  context.save();
  context.globalAlpha = fade * 0.78;
  context.strokeStyle = "#fff";
  context.lineWidth = 3.5;
  context.lineCap = "round";
  context.shadowColor = "rgba(255, 255, 255, 0.75)";
  context.shadowBlur = 7;
  for (let index = 0; index < 3; index += 1) {
    const x = DRAGON_X + 55 + index * 10;
    const startY = y - 34 + index * 2;
    context.beginPath();
    context.moveTo(x, startY + 11 * progress);
    context.lineTo(x + 15 * progress, startY - 11 * progress);
    context.stroke();
  }
  context.restore();
}

function drawWorld(
  context: CanvasRenderingContext2D,
  world: GameWorld,
  timestamp: number,
  theme: WorldTheme,
  dragonSkin: DragonSkin,
) {
  const waveTime = world.phase === "playing" ? world.elapsed : timestamp / 1000;
  if (theme.id === "galaxy") {
    drawGalaxyBackground(context, timestamp / 1000);
  } else if (theme.id === "football") {
    drawFootballBackground(context, timestamp / 1000);
  } else if (theme.id === "wind") {
    drawWindBackground(context, timestamp / 1000);
  } else if (theme.id === "jungle") {
    drawJungleBackground(context, timestamp / 1000);
  } else {
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(0.58, theme.sky[1]);
  sky.addColorStop(1, theme.sky[2]);
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  if (theme.id === "night") {
    context.fillStyle = "rgba(255, 255, 255, 0.72)";
    for (let star = 0; star < 36; star += 1) {
      const x = (star * 173 + 47) % WIDTH;
      const y = (star * 83 + 29) % 310;
      context.globalAlpha = 0.45 + ((star * 13) % 50) / 100;
      context.beginPath();
      context.arc(x, y, star % 5 === 0 ? 2 : 1, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  context.fillStyle = theme.sun;
  context.beginPath();
  context.arc(770, 108, 48, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = theme.sunGlow;
  context.beginPath();
  context.arc(770, 108, 66, 0, Math.PI * 2);
  context.fill();

  const drift = world.phase === "playing" ? world.elapsed * 16 : timestamp * 0.012;
  drawCloud(context, 130 - (drift % 1120), 116, 0.82, theme.cloud);
  drawCloud(context, 495 - ((drift * 0.66) % 1120), 205, 0.58, theme.cloud);
  drawCloud(context, 930 - ((drift * 0.8) % 1120), 92, 0.72, theme.cloud);

  if (theme.id === "volcano") {
    for (const [x, peak] of [[145, 270], [480, 236], [815, 285]]) {
      context.fillStyle = "#493548";
      context.beginPath();
      context.moveTo(x - 180, 407);
      context.lineTo(x - 86, peak + 74);
      context.lineTo(x - 26, peak);
      context.lineTo(x + 24, peak + 55);
      context.lineTo(x + 72, peak + 34);
      context.lineTo(x + 180, 407);
      context.closePath();
      context.fill();
      context.fillStyle = "#f4a16a";
      context.beginPath();
      context.ellipse(x - 26, peak + 4, 17, 5, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(255, 122, 74, 0.9)";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(x - 36, peak + 25);
      context.lineTo(x - 52, peak + 64);
      context.moveTo(x - 4, peak + 28);
      context.lineTo(x + 16, peak + 69);
      context.stroke();
    }
  } else if (theme.id === "forest") {
    for (let tree = 0; tree < 17; tree += 1) {
      const x = tree * 62 - 12;
      const base = 419 - (tree % 3) * 13;
      const height = 88 + (tree % 4) * 15;
      context.fillStyle = tree % 2 === 0 ? "#426d61" : "#5c8869";
      context.beginPath();
      context.moveTo(x - 27, base);
      context.lineTo(x, base - height);
      context.lineTo(x + 27, base);
      context.closePath();
      context.fill();
      context.fillRect(x - 3, base - 4, 6, 12);
    }
  } else if (theme.id === "ice") {
    for (const [x, peak] of [[90, 270], [355, 222], [670, 257], [900, 235]]) {
      context.fillStyle = "#729eb4";
      context.beginPath();
      context.moveTo(x - 150, 415);
      context.lineTo(x, peak);
      context.lineTo(x + 142, 415);
      context.closePath();
      context.fill();
      context.fillStyle = "rgba(248, 255, 255, 0.92)";
      context.beginPath();
      context.moveTo(x, peak);
      context.lineTo(x - 36, peak + 67);
      context.lineTo(x - 8, peak + 54);
      context.lineTo(x + 15, peak + 83);
      context.lineTo(x + 35, peak + 64);
      context.closePath();
      context.fill();
    }
  } else if (theme.id === "desert") {
    context.fillStyle = "#d3925e";
    context.beginPath();
    context.moveTo(0, 388);
    context.quadraticCurveTo(160, 283, 342, 388);
    context.quadraticCurveTo(535, 480, 730, 364);
    context.quadraticCurveTo(848, 310, WIDTH, 377);
    context.lineTo(WIDTH, FLOOR_Y);
    context.lineTo(0, FLOOR_Y);
    context.fill();
    for (const x of [165, 565, 875]) {
      context.fillStyle = "#527b68";
      context.fillRect(x - 4, 341, 8, 63);
      context.fillRect(x - 18, 355, 12, 8);
      context.fillRect(x - 18, 344, 7, 20);
      context.fillRect(x + 5, 367, 12, 8);
      context.fillRect(x + 10, 355, 7, 20);
    }
  }

  context.fillStyle = theme.far;
  context.beginPath();
  context.moveTo(0, 383);
  context.quadraticCurveTo(145, 319, 286, 382);
  context.quadraticCurveTo(440, 441, 604, 370);
  context.quadraticCurveTo(791, 307, WIDTH, 373);
  context.lineTo(WIDTH, FLOOR_Y);
  context.lineTo(0, FLOOR_Y);
  context.fill();

  context.fillStyle = theme.near;
  context.beginPath();
  context.moveTo(0, 423);
  context.quadraticCurveTo(150, 378, 303, 431);
  context.quadraticCurveTo(476, 486, 648, 417);
  context.quadraticCurveTo(810, 365, WIDTH, 423);
  context.lineTo(WIDTH, FLOOR_Y);
  context.lineTo(0, FLOOR_Y);
  context.fill();

  const sea = context.createLinearGradient(0, FLOOR_Y, 0, HEIGHT);
  sea.addColorStop(0, theme.sea[0]);
  sea.addColorStop(1, theme.sea[1]);
  context.fillStyle = sea;
  context.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);

  context.strokeStyle = "rgba(255, 252, 245, 0.7)";
  context.lineWidth = 3;
  context.beginPath();
  for (let x = 0; x <= WIDTH; x += 8) {
    const waveY = FLOOR_Y + 5 + Math.sin((x + waveTime * 80) / 26) * 3;
    if (x === 0) context.moveTo(x, waveY);
    else context.lineTo(x, waveY);
  }
  context.stroke();
  }

  if (dragonSkin.id === "milkyway") {
    drawMilkywayShootingStars(context, timestamp / 1000);
  }

  if (dragonSkin.id === "dragonfruit") {
    drawFruitRain(context, timestamp / 1000, world.dragonY);
  }

  for (const obstacle of world.obstacles) {
    if (theme.id === "galaxy") {
      drawSpaceship(context, obstacle.x, waveTime, obstacle.fireHeight);
    } else if (theme.id === "football") {
      drawFootballShot(context, obstacle, waveTime);
    } else {
      drawWhale(context, obstacle.x);
      drawSpout(context, obstacle, waveTime, world.storm !== null);
    }
  }

  if (world.storm) {
    drawStorm(context, world.storm, theme.id === "galaxy");
  }

  if (dragonSkin.accessory === "cat") {
    drawMuffinScratch(context, world.dragonY, timestamp / 1000);
  }

  drawDragon(context, world.dragonY, world.velocity, world.elapsed, dragonSkin, timestamp / 1000);
}

function FlyingDragonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef(makeWorld());
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [collection, setCollection] = useState(loadDragonCollection);
  const [shopOpen, setShopOpen] = useState(false);
  const [storeTab, setStoreTab] = useState<"backgrounds" | "skins">("backgrounds");
  const [tokenNotice, setTokenNotice] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("sky");
  const selectedThemeRef = useRef(
    WORLD_THEMES.find((theme) => theme.id === selectedTheme) ?? WORLD_THEMES[0],
  );
  const equippedSkinRef = useRef(DRAGON_SKINS[0]);
  const tokenNoticeTimerRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const autoFullscreenAttempted = useRef(false);

  useEffect(() => {
    equippedSkinRef.current =
      DRAGON_SKINS.find((skin) => skin.id === collection.equippedSkinId) ?? DRAGON_SKINS[0];
    try {
      localStorage.setItem(DRAGON_COLLECTION_KEY, JSON.stringify(collection));
    } catch (error) {
      console.error("Could not save the Flying Dragon collection.", error);
    }
  }, [collection]);

  useEffect(
    () => () => {
      if (tokenNoticeTimerRef.current !== null) {
        window.clearTimeout(tokenNoticeTimerRef.current);
      }
    },
    [],
  );

  const awardDragonToken = () => {
    setCollection((current) => ({ ...current, tokens: current.tokens + 1 }));
    setTokenNotice("+1 Dragon token!");
    if (tokenNoticeTimerRef.current !== null) {
      window.clearTimeout(tokenNoticeTimerRef.current);
    }
    tokenNoticeTimerRef.current = window.setTimeout(() => setTokenNotice(""), 2200);
  };

  const selectOrBuySkin = (skin: DragonSkin) => {
    const alreadyUnlocked = collection.unlockedSkinIds.includes(skin.id);
    if (!alreadyUnlocked && collection.tokens < skin.cost) return;

    setCollection((current) => {
      if (current.unlockedSkinIds.includes(skin.id)) {
        return { ...current, equippedSkinId: skin.id };
      }
      if (current.tokens < skin.cost) return current;
      return {
        ...current,
        tokens: current.tokens - skin.cost,
        unlockedSkinIds: [...current.unlockedSkinIds, skin.id],
        equippedSkinId: skin.id,
      };
    });
  };

  const selectOrBuyTheme = (theme: WorldTheme) => {
    const unlocked = collection.unlockedThemeIds.includes(theme.id);
    if (!unlocked && collection.tokens < theme.cost) return;

    selectedThemeRef.current = theme;
    setSelectedTheme(theme.id);
    setCollection((current) => {
      if (current.unlockedThemeIds.includes(theme.id)) return current;
      if (current.tokens < theme.cost) return current;
      return {
        ...current,
        tokens: current.tokens - theme.cost,
        unlockedThemeIds: [...current.unlockedThemeIds, theme.id],
      };
    });
  };

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
            while (world.score >= world.nextTokenScore) {
              world.nextTokenScore += 10;
              awardDragonToken();
            }
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
          const hitsShip =
            obstacle.x + 17 < DRAGON_X + DRAGON_RADIUS &&
            obstacle.x + 122 > DRAGON_X - DRAGON_RADIUS &&
            world.dragonY + DRAGON_RADIUS > FLOOR_Y - 44 &&
            world.dragonY - DRAGON_RADIUS < FLOOR_Y - 19;
          const rocketX = obstacle.x + WHALE_WIDTH / 2;
          const rocketY = FLOOR_Y - 29;
          const hitsRocketFire =
            rocketX - 25 < DRAGON_X + DRAGON_RADIUS &&
            rocketX + 20 > DRAGON_X - DRAGON_RADIUS &&
            world.dragonY + DRAGON_RADIUS > rocketY - obstacle.fireHeight &&
            world.dragonY - DRAGON_RADIUS < rocketY - 13;
          const hitsFootball =
            blowX - 22 < DRAGON_X + DRAGON_RADIUS &&
            blowX + 22 > DRAGON_X - DRAGON_RADIUS &&
            world.dragonY + DRAGON_RADIUS > FLOOR_Y - 53;
          const hitsObstacle =
            selectedThemeRef.current.id === "galaxy"
              ? hitsShip || hitsRocketFire
              : selectedThemeRef.current.id === "football"
                ? hitsSpray || hitsFootball
                : hitsSpray || hitsWhale;
          if (hitsObstacle) {
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

        if (selectedThemeRef.current.id !== "wind" && !world.storm && world.score >= world.nextStormScore) {
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
            fireHeight: 90 + Math.random() * 90,
            passed: false,
          });
        }
      }

      drawWorld(
        context,
        world,
        timestamp,
        selectedThemeRef.current,
        equippedSkinRef.current,
      );
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

  const handleStoreTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = ["backgrounds", "skins"] as const;
    const currentIndex = tabs.indexOf(storeTab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    event.stopPropagation();
    const nextTab = tabs[nextIndex];
    setStoreTab(nextTab);
    document.getElementById(`dragon-store-tab-${nextTab}`)?.focus();
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

  const equippedSkin =
    DRAGON_SKINS.find((skin) => skin.id === collection.equippedSkinId) ?? DRAGON_SKINS[0];
  const obstacleName = selectedTheme === "football" ? "football" : "whale";

  return (
    <div
      className={`dragon-game${isFallbackFullscreen ? " is-fullscreen" : ""}`}
      ref={gameRef}
      role="group"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={flap}
      aria-label={
        selectedTheme === "wind"
          ? "Flying Dragon game. Press Space, Arrow Up, or tap to fly over whales beneath a windy sky. The wind is only scenery."
          : selectedTheme === "football"
            ? "Flying Dragon game. Press Space, Arrow Up, or tap to dodge footballs shot into the air and avoid lightning after 10 points."
            : "Flying Dragon game. Press Space, Arrow Up, or tap to fly over whale spray and avoid lightning after 10 points."
      }
    >
      <div className="dragon-game-screen">
        <canvas
          className="dragon-game-canvas"
          ref={canvasRef}
          aria-label={
            selectedTheme === "wind"
              ? `A ${equippedSkin.name.toLowerCase()} dragon flying over whales beneath a breezy sky.`
              : selectedTheme === "football"
                ? `A ${equippedSkin.name.toLowerCase()} dragon dodging footballs shot into the air at a football match.`
                : `A ${equippedSkin.name.toLowerCase()} dragon flying over whales, with lightning storms after 10 points.`
          }
        />
        <div className="game-hud" aria-live="polite">
          <span className="game-hud-label">SKY SCORE</span>
          <strong>{score}</strong>
          <span className="game-best">BEST {bestScore}</span>
          <span className="game-token-count" aria-label={`${collection.tokens} dragon tokens`}>
            🐉 {collection.tokens}
          </span>
        </div>
        {tokenNotice && (
          <div className="dragon-token-notice" role="status">
            {tokenNotice}
          </div>
        )}
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
                {shopOpen ? "DRAGON COLLECTION" : phase === "ready" ? "A LITTLE ADVENTURE" : "ONE MORE FLIGHT?"}
              </p>
              <h4 className={shopOpen ? "dragon-shop-title" : undefined}>
                {shopOpen
                  ? "Spend your dragon tokens"
                  : phase === "ready"
                    ? "Ready, little dragon?"
                    : "The sky is still yours."}
              </h4>
              {shopOpen ? (
                <>
                  <p className="dragon-shop-balance">
                    🐉 {collection.tokens} {collection.tokens === 1 ? "token" : "tokens"}
                  </p>
                  <div
                    className="dragon-store-tabs"
                    role="tablist"
                    aria-label="Dragon store categories"
                    onKeyDown={handleStoreTabKeyDown}
                  >
                    <button
                      id="dragon-store-tab-backgrounds"
                      type="button"
                      role="tab"
                      aria-selected={storeTab === "backgrounds"}
                      aria-controls="dragon-store-panel"
                      tabIndex={storeTab === "backgrounds" ? 0 : -1}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => setStoreTab("backgrounds")}
                    >
                      🌌 Backgrounds
                    </button>
                    <button
                      id="dragon-store-tab-skins"
                      type="button"
                      role="tab"
                      aria-selected={storeTab === "skins"}
                      aria-controls="dragon-store-panel"
                      tabIndex={storeTab === "skins" ? 0 : -1}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => setStoreTab("skins")}
                    >
                      🐉 Dragon skins
                    </button>
                  </div>
                  <div
                    className="dragon-shop-list dragon-store-panel"
                    id="dragon-store-panel"
                    role="tabpanel"
                    aria-labelledby={`dragon-store-tab-${storeTab}`}
                    tabIndex={0}
                  >
                    {storeTab === "backgrounds" ? (
                      <section className="dragon-rarity dragon-world-options">
                        {WORLD_THEMES.map((theme) => {
                          const unlocked = collection.unlockedThemeIds.includes(theme.id);
                          const selected = selectedTheme === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              className={`dragon-world-option${selected ? " is-selected" : ""}`}
                              aria-label={
                                selected
                                  ? `${theme.name} background, selected`
                                  : unlocked
                                    ? `Choose ${theme.name} background`
                                    : `Buy ${theme.name} background for ${theme.cost} ${theme.cost === 1 ? "token" : "tokens"}`
                              }
                              aria-pressed={selected}
                              disabled={!unlocked && collection.tokens < theme.cost}
                              onPointerDown={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                              onClick={() => selectOrBuyTheme(theme)}
                            >
                              <span className="dragon-world-icon" aria-hidden="true">{theme.icon}</span>
                              <span className="dragon-shop-name">
                                <strong>{theme.name}</strong>
                                <small>
                                  {unlocked
                                    ? "Owned"
                                    : `${theme.cost} ${theme.cost === 1 ? "token" : "tokens"}`}
                                </small>
                              </span>
                              <span className="dragon-shop-action">
                                {selected ? "Selected" : unlocked ? "Choose" : "Buy"}
                              </span>
                            </button>
                          );
                        })}
                      </section>
                    ) : (
                      DRAGON_RARITIES.map((rarity) => {
                        const skins = DRAGON_SKINS.filter((skin) => skin.rarity === rarity);
                        if (skins.length === 0) return null;

                        return (
                          <section className={`dragon-rarity dragon-rarity-${rarity.toLowerCase()}`} key={rarity}>
                            <h5>{rarity} Dragons</h5>
                            {skins.map((skin) => {
                              const unlocked = collection.unlockedSkinIds.includes(skin.id);
                              const equipped = collection.equippedSkinId === skin.id;
                              return (
                                <button
                                  key={skin.id}
                                  type="button"
                                  className={`dragon-shop-skin${equipped ? " is-equipped" : ""}`}
                                  aria-label={
                                    equipped
                                      ? `${skin.name}, equipped`
                                      : unlocked
                                        ? `Equip ${skin.name} dragon skin`
                                        : `Buy ${skin.name} dragon skin for ${skin.cost} ${skin.cost === 1 ? "token" : "tokens"}`
                                  }
                                  aria-pressed={equipped}
                                  disabled={!unlocked && collection.tokens < skin.cost}
                                  onPointerDown={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => event.stopPropagation()}
                                  onClick={() => selectOrBuySkin(skin)}
                                >
                                  <span
                                    className="dragon-shop-swatch"
                                    style={{
                                      background: skin.id === "football"
                                        ? "radial-gradient(circle at 30% 35%, #17191d 0 2px, transparent 2.5px), radial-gradient(circle at 68% 65%, #17191d 0 2px, transparent 2.5px), #f6f5f0"
                                        : skin.preview,
                                    }}
                                    aria-hidden="true"
                                  />
                                  <span className="dragon-shop-name">
                                    <strong>{skin.icon} {skin.name}</strong>
                                    <small>{unlocked ? "Owned" : `${skin.cost} ${skin.cost === 1 ? "token" : "tokens"}`}</small>
                                  </span>
                                  <span className="dragon-shop-action">
                                    {equipped ? "Equipped" : unlocked ? "Equip" : "Buy"}
                                  </span>
                                </button>
                              );
                            })}
                          </section>
                        );
                      })
                    )}
                  </div>
                  <button
                    className="dragon-shop-back"
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    onClick={() => setShopOpen(false)}
                  >
                    ← Back to flight
                  </button>
                </>
              ) : (
                <>
                  <p className="game-prompt-copy">
                    {phase === "ready"
                      ? "Worlds cost tokens. Earn one every 10 points!"
                      : selectedTheme === "wind"
                        ? `You flew past ${score} ${score === 1 ? "whale" : "whales"} beneath the windy sky. Every 10 points earns a dragon token!`
                        : `You flew past ${score} ${obstacleName}${score === 1 ? "" : "s"}. Every 10 points earns a dragon token!`}
                  </p>
                  {phase === "ready" ? (
                    <>
                      <div className="dragon-theme-picker" role="group" aria-label="Choose a flying world">
                        {WORLD_THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            aria-label={
                              collection.unlockedThemeIds.includes(theme.id)
                                ? `Choose ${theme.name} world`
                                : `Unlock ${theme.name} world for ${theme.cost} ${theme.cost === 1 ? "token" : "tokens"}`
                            }
                            aria-pressed={selectedTheme === theme.id}
                            className={[
                              selectedTheme === theme.id ? "is-selected" : "",
                              collection.unlockedThemeIds.includes(theme.id) ? "" : "is-locked",
                            ].filter(Boolean).join(" ")}
                            disabled={
                              !collection.unlockedThemeIds.includes(theme.id) &&
                              collection.tokens < theme.cost
                            }
                            onPointerDown={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            onClick={() => selectOrBuyTheme(theme)}
                          >
                            <span aria-hidden="true">{theme.icon}</span>
                            {theme.name}
                            {!collection.unlockedThemeIds.includes(theme.id) && (
                              <span className="dragon-theme-cost">{theme.cost} 🐉</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <button
                        className="dragon-shop-open"
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        onClick={() => {
                          setStoreTab("skins");
                          setShopOpen(true);
                        }}
                      >
                        🐉 Dragon skins <span>{collection.tokens} tokens</span>
                      </button>
                      <button className="button button-primary game-start" onClick={startGame}>
                        Let’s fly <span aria-hidden="true">→</span>
                      </button>
                    </>
                  ) : (
                    <div className="game-over-actions">
                      <button className="button button-primary game-start" onClick={startGame}>
                        Fly again
                      </button>
                      <button
                        className="button game-store-visit"
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        onClick={() => setShopOpen(true)}
                      >
                        🐉 Visit Dragon Store
                      </button>
                    </div>
                  )}
                </>
              )}
              {!shopOpen && phase === "ready" && (
                <p className="game-controls">
                  <span className="game-keyboard-hint">SPACE · ↑</span>
                  <span className="game-tap-hint">TAP ANYWHERE TO FLAP</span>
                </p>
              )}
              <p className="game-rotate-hint">Turn your phone sideways for the best view.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlyingDragonGame;
