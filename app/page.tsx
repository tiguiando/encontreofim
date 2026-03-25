"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Cell = { col: number; row: number };

type SecretType = "heart" | "boss" | "alien" | "ace" | "jackpot" | "bandit";

type LevelConfig = {
  id: number;
  name: string;
  cols: number;
  rows: number;
  isSecret?: boolean;
  secretType?: SecretType;
};

type RewardId =
  | "heart"
  | "boss"
  | "alien"
  | "ace"
  | "jackpot"
  | "bandit"
  | "speed"
  | "gift"
  | "slow"
  | "brain";

type Reward = {
  id: RewardId;
  emoji: string;
};

type HintEnvelopeId = "heart" | "alien" | "boss" | "ace" | "jackpot" | "bandit" | "memory";

type HintEnvelope = {
  id: HintEnvelopeId;
  cell: Cell;
  text: string;
};

type FinalThemeId = "speed" | "slow" | "boss" | "alien" | "heart" | "ace" | "brain" | "jackpot" | "bandit" | "default";

type RankingEntry = {
  name: string;
  time: number;
  secrets: string[];
};

const SHARE_LINK = "https://encontreofim.vercel.app/";
const HELP_DEV_LINK =
  "https://www.youtube.com/@tiguiando?sub_confirmation=1&sub_confirmation=1";

const MAX_CLICKS = 5;
const SLEEP_LIMIT_SECONDS = 33 * 60 + 33;
const IDLE_KNOCK_MS = 33_000;
const MESSAGE_MS = 3000;
const SPEED_RUN_LIMIT_SECONDS = 60;

const LEVELS: LevelConfig[] = [
  { id: 1, name: "Nível 1", cols: 10, rows: 6 },
  { id: 2, name: "Nível 2", cols: 14, rows: 8 },
  { id: 3, name: "Nível 3", cols: 18, rows: 10 },
  { id: 4, name: "Fase Secreta", cols: 11, rows: 9, isSecret: true, secretType: "heart" },
  { id: 5, name: "FINAL BOSS", cols: 15, rows: 13, isSecret: true, secretType: "boss" },
  { id: 6, name: "AREA 51", cols: 15, rows: 15, isSecret: true, secretType: "alien" },
  { id: 7, name: "ACE", cols: 15, rows: 15, isSecret: true, secretType: "ace" },
  { id: 8, name: "JACKPOT", cols: 15, rows: 15, isSecret: true, secretType: "jackpot" },
  { id: 9, name: "GOLPISTA", cols: 15, rows: 15, isSecret: true, secretType: "bandit" },
];

const REWARD_META: Record<RewardId, Reward> = {
  heart: { id: "heart", emoji: "❤️" },
  boss: { id: "boss", emoji: "💀" },
  alien: { id: "alien", emoji: "👽" },
  ace: { id: "ace", emoji: "♠️" },
  jackpot: { id: "jackpot", emoji: "🎰" },
  bandit: { id: "bandit", emoji: "🎖️" },
  speed: { id: "speed", emoji: "🐇" },
  gift: { id: "gift", emoji: "🎁" },
  slow: { id: "slow", emoji: "🐢" },
  brain: { id: "brain", emoji: "🧠" },
};

const HINT_TEXTS: Record<HintEnvelopeId, string> = {
  heart: "voce nao me conhece, mas gosto de ser o ultimo em todos os lugares",
  alien: "existem objetos nao identificados naquela area que ja passou",
  boss: "esse ser maligno tem um numero proprio",
  ace: "essa jogo é AAA, pra mim sempre será o numero 1!",
  jackpot: "voce pode acertar o jackpot se insistir",
  bandit: "cuidado tem golpista escondido logo na entrada",
  memory:
    "tenho memoria ruim, as vezes eu repito o nome do jogo varias vezes pra não esquecer.",
};

const HINT_CARD_EMOJI: Record<HintEnvelopeId, string> = {
  heart: "💌",
  alien: "💌",
  boss: "💌",
  ace: "💌",
  jackpot: "💌",
  bandit: "💌",
  memory: "💌",
};

const FINAL_MESSAGES = [
  "Lenda absoluta. Menos de 10 segundos? Isso foi humilhante pro Desenvolvedor",
  "Você não jogou. Você executou uma operação tática.",
  "O tesouro devia estar arrependido de ter se escondido.",
  "Velocidade absurda. Nem deu tempo do mapa respirar.",
  "Cirúrgico. Você e o tesouro já tinham um encontro marcado.",
  "Muito forte. O jogo achou que teria mais chances.",
  "Classe mundial. Isso aqui foi aula.",
  "Tempo excelente. Dá pra dizer que você tem faro de tesouro.",
  "Mandou bem demais. O tesouro piscou e perdeu.",
  "Você foi rápido. O suficiente pra irritar quem ainda está no nível 1.",
  "Boa. Esse tempo já dá pra compartilhar sem vergonha nenhuma.",
  "Desempenho sólido. O tesouro tentou, mas não muito.",
  "Foi bem. Nada lendário, mas ainda respeitável.",
  "Passou com estilo. O cronômetro nem ficou tão ofendido.",
  "Ok, agora começou a ficar interessante.",
  "Tá bom... não foi rápido, mas também não foi um documentário.",
  "Demorou um pouco, mas chegou lá. E isso conta.",
  "Vitória honesta. Sem pressa, sem glória, mas vitória.",
  "O importante é que achou. Eventualmente.",
  "Foi quase uma trilogia, mas terminou bem.",
  "Esse tempo já foi suficiente pro tesouro repensar a vida.",
  "Confesso que a vovó teve mais iniciativa hoje.",
  "Você venceu, mas o cronômetro saiu rindo.",
  "Tudo certo... só não coloca isso no currículo.",
  "A caça virou passeio. Um passeio bem longo.",
  "O tesouro já estava cogitando se entregar sozinho.",
  "Se existisse multa por demora, hoje vinha boleto.",
  "A vovó passou aqui, achou e ainda fez café.",
  "Parabéns, eu acho. O tesouro quase pediu aposentadoria antes.",
  "Você encontrou, mas o mapa já estava te dando pena.",
  "Foi tão demorado que o tesouro rendeu juros.",
  "Resultado oficial: até a vovó foi mais rápida hoje.",
  "Vitória confirmada. Dignidade em análise.",
];

const FIREWORKS = ["🎆", "🎇", "✨", "🎉"];
const LIGHTNING_EMOJIS = ["⚡", "⚡", "⚡"];
const FOOD_EMOJIS = ["🍕", "🍔", "🍟"];
const FIRE_EMOJIS = ["🔥", "🔥", "🔥"];
const ALIEN_FINAL_EMOJIS = ["🛸", "👾", "🛸"];
const HEART_FINAL_EMOJIS = ["❤️", "💖", "💜", "💙", "💛"];
const ACE_FINAL_EMOJIS = ["♠️", "♥️", "♦️", "♣️"];
const BRAIN_FINAL_EMOJIS = ["🧠", "🧠", "🧠"];
const JACKPOT_FINAL_EMOJIS = ["🎰", "🪙", "💰", "✨"];
const BANDIT_FINAL_EMOJIS = ["🎖️", "🚨", "🔒", "🚔"];

const FIM_PATTERN = [
  "111110101100011",
  "100000101110111",
  "111100101001001",
  "100000101000001",
  "100000101000001",
  "100000101000001",
  "100000101000001",
];

const INSTRUCTIONS_LINES = [
  "Existem segredos escondidos entre os reinos",
  "Sua mente está presa em uma caixa",
  "Para sair, encontre o tesouro e siga os sinais no topo da tela",
  "Dizem que DEVon passou pelo reino seguinte ao primeiro, distribuindo cartas como quem deixa migalhas para os perdidos",
  "Avance com cautela",
  "Mas cuidado: nem toda pista foi feita para salvar você",
  "O fim nem sempre é o fim",
];

function invertDirection(direction: string) {
  const vertical =
    direction.includes("↑") ? "↓" :
    direction.includes("↓") ? "↑" :
    "";

  const horizontal =
    direction.includes("←") ? "→" :
    direction.includes("→") ? "←" :
    "";

  return vertical + horizontal;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getFinalMessage(totalSeconds: number) {
  if (totalSeconds < 10) return FINAL_MESSAGES[0];
  const index = Math.min(
    FINAL_MESSAGES.length - 1,
    1 + Math.floor((totalSeconds - 10) / 3)
  );
  return FINAL_MESSAGES[index];
}

function cellKey(cell: Cell) {
  return `${cell.col}-${cell.row}`;
}

function getDirection(
  from: Cell,
  to: Cell,
  cols: number,
  rows: number,
  trollMode = false
) {
  const vertical = to.row > from.row ? "↓" : to.row < from.row ? "↑" : "";
  const horizontal = to.col > from.col ? "→" : to.col < from.col ? "←" : "";

  const normalDir = vertical + horizontal;
  const dir = trollMode ? invertDirection(normalDir) : normalDir;

  const safeVertical = dir.includes("↑")
    ? (from.row > 0 ? "↑" : "")
    : dir.includes("↓")
      ? (from.row < rows - 1 ? "↓" : "")
      : "";

  const safeHorizontal = dir.includes("←")
    ? (from.col > 0 ? "←" : "")
    : dir.includes("→")
      ? (from.col < cols - 1 ? "→" : "")
      : "";

  return safeVertical + safeHorizontal;
}

function randomCellAvoiding(cols: number, rows: number, blockedKeys: Set<string>): Cell {
  const valid: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col}-${row}`;
      if (!blockedKeys.has(key)) valid.push({ col, row });
    }
  }
  return valid[Math.floor(Math.random() * valid.length)];
}

function randomManyCellsAvoiding(
  cols: number,
  rows: number,
  blockedKeys: Set<string>,
  count: number
): Cell[] {
  const pool: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col}-${row}`;
      if (!blockedKeys.has(key)) pool.push({ col, row });
    }
  }

  const result: Cell[] = [];
  const copy = [...pool];

  for (let i = 0; i < count && copy.length > 0; i++) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }

  return result;
}

function isHeartCell(row: number, col: number, rows: number, cols: number) {
  const pattern = [
    "01100110",
    "11111111",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000",
  ];

  const rowOffset = Math.floor((rows - pattern.length) / 2);
  const colOffset = Math.floor((cols - pattern[0].length) / 2);
  const r = row - rowOffset;
  const c = col - colOffset;

  if (r < 0 || r >= pattern.length || c < 0 || c >= pattern[0].length) return false;
  return pattern[r][c] === "1";
}

const SKULL_PATTERN = [
  "000011111110000",
  "000111111111000",
  "001111111111100",
  "011110111011110",
  "011100111001110",
  "111100010001111",
  "111111111111111",
  "111111111111111",
  "011111111111110",
  "001111111111100",
  "000111101111000",
  "000110101011000",
  "000011010110000",
];

function getSkullOffsets(rows: number, cols: number) {
  return {
    rowOffset: Math.floor((rows - SKULL_PATTERN.length) / 2),
    colOffset: Math.floor((cols - SKULL_PATTERN[0].length) / 2),
  };
}

function isSkullCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getSkullOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  if (r < 0 || r >= SKULL_PATTERN.length || c < 0 || c >= SKULL_PATTERN[0].length) {
    return false;
  }
  return SKULL_PATTERN[r][c] === "1";
}

function isSkullEyeCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getSkullOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  const eyes = new Set([
    "3-5", "3-9",
    "4-4", "4-5", "4-9", "4-10",
    "5-4", "5-5", "5-9", "5-10",
  ]);

  return eyes.has(`${r}-${c}`);
}

function isSkullTeethCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getSkullOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  const teeth = new Set([
    "11-4", "11-5", "11-7", "11-9", "11-10",
    "12-5", "12-7", "12-8", "12-9",
  ]);

  return teeth.has(`${r}-${c}`);
}

const ALIEN_PATTERN = [
  "000000111000000",
  "000001111100000",
  "000011111110000",
  "000111111111000",
  "001111111111100",
  "001111111111100",
  "011111111111110",
  "011111111111110",
  "011111111111110",
  "011111111111110",
  "001111111111100",
  "001111111111100",
  "000111111111000",
  "000011111110000",
  "000001111100000",
];

function getAlienOffsets(rows: number, cols: number) {
  return {
    rowOffset: Math.floor((rows - ALIEN_PATTERN.length) / 2),
    colOffset: Math.floor((cols - ALIEN_PATTERN[0].length) / 2),
  };
}

function isAlienCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getAlienOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  if (r < 0 || r >= ALIEN_PATTERN.length || c < 0 || c >= ALIEN_PATTERN[0].length) {
    return false;
  }
  return ALIEN_PATTERN[r][c] === "1";
}

function isAlienEyeCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getAlienOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  const eyes = new Set([
    "5-3", "5-4", "5-5",
    "6-2", "6-3", "6-4", "6-5",
    "7-2", "7-3", "7-4", "7-5",
    "8-3", "8-4",
    "5-9", "5-10", "5-11",
    "6-9", "6-10", "6-11", "6-12",
    "7-9", "7-10", "7-11", "7-12",
    "8-10", "8-11",
  ]);

  return eyes.has(`${r}-${c}`);
}

const SPADE_PATTERN = [
  "000000010000000",
  "000000111000000",
  "000001111100000",
  "000011111110000",
  "000111111111000",
  "001111111111100",
  "011111111111110",
  "011111111111110",
  "001111111111100",
  "000111111111000",
  "000011111110000",
  "000001111100000",
  "000000111000000",
  "000000111000000",
  "000001111100000",
];


const JACKPOT_PATTERN = [
  "000000010000000",
  "000000111000000",
  "000001111100000",
  "001011111110100",
  "011111111111110",
  "001111111111100",
  "111111111111111",
  "001111111111100",
  "011111111111110",
  "001011111110100",
  "000001111100000",
  "000000111000000",
  "000000010000000",
  "000001010100000",
  "000010000010000",
];

function getJackpotOffsets(rows: number, cols: number) {
  return {
    rowOffset: Math.floor((rows - JACKPOT_PATTERN.length) / 2),
    colOffset: Math.floor((cols - JACKPOT_PATTERN[0].length) / 2),
  };
}

function isJackpotCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getJackpotOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  if (r < 0 || r >= JACKPOT_PATTERN.length || c < 0 || c >= JACKPOT_PATTERN[0].length) {
    return false;
  }
  return JACKPOT_PATTERN[r][c] === "1";
}

function isJackpotCoinCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getJackpotOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  const coins = new Set([
    "3-2", "3-12",
    "4-1", "4-13",
    "6-0", "6-14",
    "8-1", "8-13",
    "9-2", "9-12",
    "13-5", "13-7", "13-9",
  ]);

  return coins.has(`${r}-${c}`);
}

const BANDIT_PATTERN = Array.from({ length: 15 }, () => "111111111111111");

function getBanditOffsets(rows: number, cols: number) {
  return {
    rowOffset: Math.floor((rows - BANDIT_PATTERN.length) / 2),
    colOffset: Math.floor((cols - BANDIT_PATTERN[0].length) / 2),
  };
}

function isBanditCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getBanditOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  if (r < 0 || r >= BANDIT_PATTERN.length || c < 0 || c >= BANDIT_PATTERN[0].length) {
    return false;
  }
  return BANDIT_PATTERN[r][c] === "1";
}

function isBanditBarCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getBanditOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;
  const barCols = new Set([2, 5, 8, 11]);
  return r >= 0 && r < 15 && c >= 0 && c < 15 && barCols.has(c);
}

function getSpadeOffsets(rows: number, cols: number) {
  return {
    rowOffset: Math.floor((rows - SPADE_PATTERN.length) / 2),
    colOffset: Math.floor((cols - SPADE_PATTERN[0].length) / 2),
  };
}

function isSpadeCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getSpadeOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  if (r < 0 || r >= SPADE_PATTERN.length || c < 0 || c >= SPADE_PATTERN[0].length) {
    return false;
  }
  return SPADE_PATTERN[r][c] === "1";
}

function isSpadeStemCell(row: number, col: number, rows: number, cols: number) {
  const { rowOffset, colOffset } = getSpadeOffsets(rows, cols);
  const r = row - rowOffset;
  const c = col - colOffset;

  const stem = new Set([
    "12-6", "12-7", "12-8",
    "13-6", "13-7", "13-8",
    "14-5", "14-6", "14-7", "14-8", "14-9",
  ]);

  return stem.has(`${r}-${c}`);
}

function randomHeartTreasure(rows: number, cols: number): Cell {
  const valid: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isHeartCell(row, col, rows, cols)) valid.push({ row, col });
    }
  }
  return valid[Math.floor(Math.random() * valid.length)];
}

function randomBossTreasure(rows: number, cols: number): Cell {
  const valid: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isSkullCell(row, col, rows, cols)) valid.push({ row, col });
    }
  }
  return valid[Math.floor(Math.random() * valid.length)];
}

function randomAlienTreasure(rows: number, cols: number): Cell {
  const valid: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isAlienCell(row, col, rows, cols)) valid.push({ row, col });
    }
  }
  return valid[Math.floor(Math.random() * valid.length)];
}

function randomAceTreasure(rows: number, cols: number): Cell {
  const valid: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isSpadeCell(row, col, rows, cols)) valid.push({ row, col });
    }
  }
  return valid[Math.floor(Math.random() * valid.length)];
}

function randomJackpotTreasure(rows: number, cols: number): Cell {
  const valid: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isJackpotCell(row, col, rows, cols)) valid.push({ row, col });
    }
  }
  return valid[Math.floor(Math.random() * valid.length)];
}

function randomBanditTreasure(rows: number, cols: number): Cell {
  const valid: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isBanditCell(row, col, rows, cols)) valid.push({ row, col });
    }
  }
  return valid[Math.floor(Math.random() * valid.length)];
}

function getLevelOneBlocked(cols: number, rows: number) {
  return new Set<string>([
    `${cols - 1}-${rows - 1}`,
    "5-0",
    "6-0",
    "8-0",
    "4-0",
    "0-0",
  ]);
}

function getLevelTwoBlocked(cols: number, rows: number) {
  return new Set<string>([
    `${cols - 1}-${rows - 1}`,
    "5-0",
    "6-0",
    "8-0",
    "0-0",
  ]);
}

function getLevelThreeBlocked(cols: number, rows: number) {
  return new Set<string>([
    `${cols - 1}-${rows - 1}`,
    "5-0",
    "6-0",
    "8-0",
    "0-0",
  ]);
}

function isVisibleCellForLevel(level: LevelConfig, row: number, col: number) {
  if (level.secretType === "heart") return isHeartCell(row, col, level.rows, level.cols);
  if (level.secretType === "boss") return isSkullCell(row, col, level.rows, level.cols);
  if (level.secretType === "alien") return isAlienCell(row, col, level.rows, level.cols);
  if (level.secretType === "ace") return isSpadeCell(row, col, level.rows, level.cols);
  if (level.secretType === "jackpot") return isJackpotCell(row, col, level.rows, level.cols);
  if (level.secretType === "bandit") return isBanditCell(row, col, level.rows, level.cols);
  return true;
}

function getFinalThemeReward(rewards: Reward[]): FinalThemeId {
  const supportedOrder: RewardId[] = ["speed", "slow", "boss", "alien", "heart", "ace", "jackpot", "bandit", "brain"];
  const firstSupported = rewards.find((reward) => supportedOrder.includes(reward.id));

  if (!firstSupported) return "default";
  return firstSupported.id as FinalThemeId;
}

function getFinalThemeEmojis(theme: FinalThemeId) {
  if (theme === "speed") return LIGHTNING_EMOJIS;
  if (theme === "slow") return FOOD_EMOJIS;
  if (theme === "boss") return FIRE_EMOJIS;
  if (theme === "alien") return ALIEN_FINAL_EMOJIS;
  if (theme === "heart") return HEART_FINAL_EMOJIS;
  if (theme === "ace") return ACE_FINAL_EMOJIS;
  if (theme === "jackpot") return JACKPOT_FINAL_EMOJIS;
  if (theme === "bandit") return BANDIT_FINAL_EMOJIS;
  if (theme === "brain") return BRAIN_FINAL_EMOJIS;
  return [];
}

function getFinalThemePhrase(theme: FinalThemeId) {
  if (theme === "speed") return "Você correu mais rápido que o tempo.";
  if (theme === "slow") return "Você aproveitou cada passo.";
  if (theme === "boss") return "Você enfrentou o fim… e venceu.";
  if (theme === "alien") return "Você descobriu o que não deveria.";
  if (theme === "heart") return "Você sentiu o jogo.";
  if (theme === "ace") return "Você dominou tudo.";
  if (theme === "jackpot") return "Hoje a casa perdeu. O brilho ficou com você.";
  if (theme === "bandit") return "Você pegou o golpista e fechou as grades.";
  if (theme === "brain") return "Você não venceu o jogo… você entendeu ele.";
  return "Você reuniu os segredos. Agora é só celebrar e compartilhar.";
}

function getFinalBoardEmoji(row: number, col: number, theme: FinalThemeId) {
  const fireworks = FIREWORKS[(row + col) % FIREWORKS.length];
  const themed = getFinalThemeEmojis(theme);

  if (themed.length === 0) return fireworks;
  if ((row + col) % 2 === 0) return fireworks;

  return themed[(row * 3 + col) % themed.length];
}

export default function Home() {
  const [boardSeed, setBoardSeed] = useState(0);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);

  const [treasure, setTreasure] = useState<Cell | null>(null);
  const [clicks, setClicks] = useState(0);
  const [hint, setHint] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [signalMessage, setSignalMessage] = useState("");
  const [idleMessage, setIdleMessage] = useState("");
  const [found, setFound] = useState(false);
  const [clickedCells, setClickedCells] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState("");

  const [gameFinished, setGameFinished] = useState(false);
  const [mainGameFinished, setMainGameFinished] = useState(false);
  const [sleepMode, setSleepMode] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [heartSecretProgress, setHeartSecretProgress] = useState<number[]>([]);
  const [heartSecretUnlocked, setHeartSecretUnlocked] = useState(false);

  const [bossSecretProgress, setBossSecretProgress] = useState<number[]>([]);
  const [bossSecretUnlocked, setBossSecretUnlocked] = useState(false);

  const [alienSequenceStep, setAlienSequenceStep] = useState(0);
  const [alienSecretUnlocked, setAlienSecretUnlocked] = useState(false);

  const [aceSecretProgress, setAceSecretProgress] = useState<number[]>([]);
  const [aceSecretUnlocked, setAceSecretUnlocked] = useState(false);

  const [jackpotSecretProgress, setJackpotSecretProgress] = useState<number[]>([]);
  const [jackpotSecretUnlocked, setJackpotSecretUnlocked] = useState(false);

  const [banditSecretStep, setBanditSecretStep] = useState(0);
  const [banditSecretUnlocked, setBanditSecretUnlocked] = useState(false);

  const [titleClicks, setTitleClicks] = useState(0);
  const [trollMode, setTrollMode] = useState(false);

  const [collectedRewards, setCollectedRewards] = useState<Reward[]>([]);
  const [finalCelebration, setFinalCelebration] = useState(false);
  const [fimUnlocked, setFimUnlocked] = useState(false);
  const [finalClickedCells, setFinalClickedCells] = useState<string[]>([]);

  const [hasKey, setHasKey] = useState(false);
  const [giftUnlocked, setGiftUnlocked] = useState(false);
  const [levelOneKeyCells, setLevelOneKeyCells] = useState<Cell[]>([]);
  const [revealedKeyCell, setRevealedKeyCell] = useState<Cell | null>(null);
  const [levelThreeLockCell, setLevelThreeLockCell] = useState<Cell | null>(null);
  const [giftOpenedThisRun, setGiftOpenedThisRun] = useState(false);

  const [bombCells, setBombCells] = useState<Cell[]>([]);
  const [levelTwoHintCells, setLevelTwoHintCells] = useState<HintEnvelope[]>([]);
  const [foundHintCards, setFoundHintCards] = useState<HintEnvelopeId[]>([]);

  const [sixNineProgress, setSixNineProgress] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
  });
  const [sixNineDone, setSixNineDone] = useState<number[]>([]);

  const [playerName, setPlayerName] = useState("");
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingSaved, setRankingSaved] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [dieCell, setDieCell] = useState<Cell | null>(null);
  const [hasDie, setHasDie] = useState(false);
  const [dieUsed, setDieUsed] = useState(false);

  const [viewportWidth, setViewportWidth] = useState(1200);
  const [isMobile, setIsMobile] = useState(false);

  const sessionStartRef = useRef<number | null>(null);

  const rabbitRunStartRef = useRef<number | null>(null);
  const rabbitRunSequenceRef = useRef<number[]>([]);

  const trollRunStartRef = useRef<number | null>(null);
  const trollRunSequenceRef = useRef<number[]>([]);

  const lastBossActionRef = useRef<number | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const lastKnockRef = useRef<number>(Date.now());

  const signalTimeoutRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);

  const level = useMemo(
    () => LEVELS.find((lvl) => lvl.id === currentLevel)!,
    [currentLevel]
  );

  const finalMessage = useMemo(
    () => getFinalMessage(totalElapsed),
    [totalElapsed]
  );

  const displayRanking = useMemo(() => ranking.slice(0, 10), [ranking]);

  const finalTheme = useMemo(() => getFinalThemeReward(collectedRewards), [collectedRewards]);
  const finalThemePhrase = useMemo(() => getFinalThemePhrase(finalTheme), [finalTheme]);

  const boardGapClass = isMobile ? "gap-1" : "gap-2";
  const boardPaddingClass = isMobile ? "p-2" : "p-3";
  const finalBoardPaddingClass = isMobile ? "p-2" : "p-3";

  const horizontalPadding = isMobile ? 20 : 80;
  const boardGapPx = isMobile ? 4 : 8;

  const responsiveCellSize = useMemo(() => {
    const availableWidth = viewportWidth - horizontalPadding;
    const totalGap = (level.cols - 1) * boardGapPx;
    const raw = Math.floor((availableWidth - totalGap) / level.cols);

    if (finalCelebration) {
      if (isMobile) return Math.max(16, Math.min(raw, 28));
      return Math.max(24, Math.min(raw, 46));
    }

    if (isMobile) {
      return Math.max(18, Math.min(raw, 32));
    }

    return Math.max(32, Math.min(raw, 46));
  }, [viewportWidth, level.cols, boardGapPx, horizontalPadding, isMobile, finalCelebration]);

  const finalCellSize = useMemo(() => {
    const availableWidth = viewportWidth - horizontalPadding;
    const totalGap = (FIM_PATTERN[0].length - 1) * boardGapPx;
    const raw = Math.floor((availableWidth - totalGap) / FIM_PATTERN[0].length);

    if (isMobile) return Math.max(16, Math.min(raw, 28));
    return Math.max(24, Math.min(raw, 46));
  }, [viewportWidth, horizontalPadding, boardGapPx, isMobile]);

  function hasReward(id: RewardId) {
    return collectedRewards.some((reward) => reward.id === id);
  }

  function startSessionTimer() {
    if (!sessionStartRef.current) {
      sessionStartRef.current = Date.now();
    }
  }

  function resetRabbitRunSequence() {
    rabbitRunStartRef.current = null;
    rabbitRunSequenceRef.current = [];
  }

  function startRabbitRun() {
    rabbitRunStartRef.current = Date.now();
    rabbitRunSequenceRef.current = [];
  }

  function markRabbitRunProgress(levelCompleted: number) {
    if (hasReward("speed")) return;
    if (levelCompleted < 1 || levelCompleted > 3) return;
    if (!rabbitRunStartRef.current) return;

    const now = Date.now();
    const elapsed = Math.floor((now - rabbitRunStartRef.current) / 1000);

    if (elapsed > SPEED_RUN_LIMIT_SECONDS) {
      resetRabbitRunSequence();
      return;
    }

    const sequence = rabbitRunSequenceRef.current;

    if (levelCompleted === 1) {
      rabbitRunSequenceRef.current = [1];
      return;
    }

    if (levelCompleted === 2) {
      if (sequence.length === 1 && sequence[0] === 1) {
        rabbitRunSequenceRef.current = [1, 2];
      } else {
        resetRabbitRunSequence();
      }
      return;
    }

    if (levelCompleted === 3) {
      if (sequence.length === 2 && sequence[0] === 1 && sequence[1] === 2) {
        if (elapsed < SPEED_RUN_LIMIT_SECONDS) {
          addReward("speed");
        }
      }
      resetRabbitRunSequence();
    }
  }

  function resetTrollRunSequence() {
    trollRunStartRef.current = null;
    trollRunSequenceRef.current = [];
  }

  function startTrollRun() {
    trollRunStartRef.current = Date.now();
    trollRunSequenceRef.current = [];
  }

  function markTrollRunProgress(levelCompleted: number) {
    if (!trollMode) return;
    if (hasReward("brain")) return;
    if (levelCompleted < 1 || levelCompleted > 3) return;
    if (!trollRunStartRef.current) return;

    const now = Date.now();
    const elapsed = Math.floor((now - trollRunStartRef.current) / 1000);

    if (elapsed > SPEED_RUN_LIMIT_SECONDS) {
      resetTrollRunSequence();
      return;
    }

    const sequence = trollRunSequenceRef.current;

    if (levelCompleted === 1) {
      trollRunSequenceRef.current = [1];
      return;
    }

    if (levelCompleted === 2) {
      if (sequence.length === 1 && sequence[0] === 1) {
        trollRunSequenceRef.current = [1, 2];
      } else {
        resetTrollRunSequence();
      }
      return;
    }

    if (levelCompleted === 3) {
      if (sequence.length === 2 && sequence[0] === 1 && sequence[1] === 2) {
        if (elapsed < SPEED_RUN_LIMIT_SECONDS) {
          addReward("brain");
        }
      }
      resetTrollRunSequence();
    }
  }

  function touchInteraction() {
    const now = Date.now();
    lastInteractionRef.current = now;
    lastKnockRef.current = now;
    setIdleMessage("");
    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current);
    }
  }

  function flashStatus(message: string, ms = MESSAGE_MS) {
    setStatusMessage(message);
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current);
    }
    statusTimeoutRef.current = window.setTimeout(() => {
      setStatusMessage("");
    }, ms);
  }

  function flashSignal(message: string, ms = MESSAGE_MS) {
    setSignalMessage(message);
    if (signalTimeoutRef.current) {
      window.clearTimeout(signalTimeoutRef.current);
    }
    signalTimeoutRef.current = window.setTimeout(() => {
      setSignalMessage("");
    }, ms);
  }

  function flashIdle(message: string, ms = MESSAGE_MS) {
    setIdleMessage(message);
    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = window.setTimeout(() => {
      setIdleMessage("");
    }, ms);
  }

  function addReward(id: RewardId) {
    setCollectedRewards((prev) => {
      if (prev.some((reward) => reward.id === id)) return prev;

      const next = [...prev, REWARD_META[id]];

      if (next.length >= 5 && !fimUnlocked) {
        setFimUnlocked(true);
        setFinalCelebration(true);
        setStatusMessage("");
        setHint("");
      }

      return next;
    });
  }

  async function handleSaveRanking() {
    if (!playerName.trim() || rankingSaved) return;

    const newEntry = {
      playerName: playerName.trim().slice(0, 12),
      totalTime: totalElapsed,
      secrets: collectedRewards.map((reward) => reward.emoji),
    };

    try {
      const res = await fetch("/api/ranking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });

      if (!res.ok) {
        flashStatus("Erro ao salvar ranking.");
        return;
      }

      setRankingSaved(true);
      flashStatus("Ranking salvo.");

      const rankingRes = await fetch("/api/ranking", { cache: "no-store" });

      if (!rankingRes.ok) return;

      const data = await rankingRes.json();

      if (Array.isArray(data)) {
        const formatted: RankingEntry[] = data
          .map((r: any) => ({
            name: r.player_name,
            time: r.total_time,
            secrets: Array.isArray(r.secrets) ? r.secrets : [],
          }))
          .slice(0, 10);

        setRanking(formatted);
      }
    } catch {
      flashStatus("Erro ao salvar ranking.");
    }
  }

  function resetGame() {
    setFinalCelebration(false);
    setCurrentLevel(1);
    setBoardSeed((s) => s + 1);
    setUnlockedLevels([1]);

    setClicks(0);
    setHint("");
    setStatusMessage("");
    setSignalMessage("");
    setIdleMessage("");
    setFound(false);
    setClickedCells([]);
    setShareMessage("");
    setGameFinished(false);
    setMainGameFinished(false);
    setSleepMode(false);
    setGameOver(false);

    setHeartSecretProgress([]);
    setHeartSecretUnlocked(false);

    setBossSecretProgress([]);
    setBossSecretUnlocked(false);

    setAlienSequenceStep(0);
    setAlienSecretUnlocked(false);

    setAceSecretProgress([]);
    setAceSecretUnlocked(false);

    setJackpotSecretProgress([]);
    setJackpotSecretUnlocked(false);

    setBanditSecretStep(0);
    setBanditSecretUnlocked(false);

    setGiftOpenedThisRun(false);
    setBombCells([]);
    setLevelTwoHintCells([]);
    setFinalClickedCells([]);
    setLevelOneKeyCells([]);
    setRevealedKeyCell(null);
    setLevelThreeLockCell(null);

    setHasKey(false);
    setGiftUnlocked(false);

    setSixNineProgress({ 1: 0, 2: 0, 3: 0 });
    setSixNineDone([]);

    setTitleClicks(0);
    setTrollMode(false);

    setPlayerName("");
    setRankingSaved(false);
    setShowRankingModal(false);
    setShowInstructions(false);

    setDieCell(null);
    setHasDie(false);
    setDieUsed(false);

    resetRabbitRunSequence();
    resetTrollRunSequence();

    const now = Date.now();
    lastBossActionRef.current = now;
    lastInteractionRef.current = now;
    lastKnockRef.current = now;
  }

  useEffect(() => {
    function updateViewport() {
      const width = window.innerWidth;
      setViewportWidth(width);
      setIsMobile(width < 768);
    }

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    async function loadRanking() {
      try {
        const res = await fetch("/api/ranking", { cache: "no-store" });

        if (!res.ok) {
          setRanking([]);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          const formatted: RankingEntry[] = data
            .map((r: any) => ({
              name: r.player_name,
              time: r.total_time,
              secrets: Array.isArray(r.secrets) ? r.secrets : [],
            }))
            .slice(0, 10);

          setRanking(formatted);
        } else {
          setRanking([]);
        }
      } catch {
        setRanking([]);
      }
    }

    loadRanking();
  }, []);

  useEffect(() => {
    const bombCount =
      !level.isSecret && currentLevel === 1
        ? 1
        : !level.isSecret && currentLevel === 2
          ? 2
          : !level.isSecret && currentLevel === 3
            ? 3
            : 0;

    setClicks(0);
    setHint("");
    setStatusMessage("");
    setSignalMessage("");
    setIdleMessage("");
    setFound(false);
    setClickedCells([]);
    setShareMessage("");
    setGameOver(false);
    setGiftOpenedThisRun(false);
    setRevealedKeyCell(null);

    if (currentLevel === 1 && !level.isSecret) {
      startRabbitRun();
      if (trollMode) startTrollRun();
    }

    if (level.secretType === "heart") {
      setTreasure(randomHeartTreasure(level.rows, level.cols));
      setLevelOneKeyCells([]);
      setLevelThreeLockCell(null);
      setBombCells([]);
      setLevelTwoHintCells([]);
      setDieCell(null);
    } else if (level.secretType === "boss") {
      setTreasure(randomBossTreasure(level.rows, level.cols));
      lastBossActionRef.current = Date.now();
      setLevelOneKeyCells([]);
      setLevelThreeLockCell(null);
      setBombCells([]);
      setLevelTwoHintCells([]);
      setDieCell(null);
    } else if (level.secretType === "alien") {
      setTreasure(randomAlienTreasure(level.rows, level.cols));
      setLevelOneKeyCells([]);
      setLevelThreeLockCell(null);
      setBombCells([]);
      setLevelTwoHintCells([]);
      setDieCell(null);
    } else if (level.secretType === "ace") {
      setTreasure(randomAceTreasure(level.rows, level.cols));
      setLevelOneKeyCells([]);
      setLevelThreeLockCell(null);
      setBombCells([]);
      setLevelTwoHintCells([]);
      setDieCell(null);
    } else if (level.secretType === "jackpot") {
      setTreasure(randomJackpotTreasure(level.rows, level.cols));
      setLevelOneKeyCells([]);
      setLevelThreeLockCell(null);
      setBombCells([]);
      setLevelTwoHintCells([]);
      setDieCell(null);
    } else if (level.secretType === "bandit") {
      setTreasure(randomBanditTreasure(level.rows, level.cols));
      setLevelOneKeyCells([]);
      setLevelThreeLockCell(null);
      setBombCells([]);
      setLevelTwoHintCells([]);
      setDieCell(null);
    } else {
      if (currentLevel === 1) {
        const blocked = getLevelOneBlocked(level.cols, level.rows);
        const nextTreasure = randomCellAvoiding(level.cols, level.rows, blocked);
        setTreasure(nextTreasure);

        const blockedWithTreasure = new Set(blocked);
        blockedWithTreasure.add(cellKey(nextTreasure));

        const keysShouldExist = !hasKey && !giftUnlocked;
        if (keysShouldExist) {
          const firstKey = randomCellAvoiding(level.cols, level.rows, blockedWithTreasure);
          blockedWithTreasure.add(cellKey(firstKey));
          const secondKey = randomCellAvoiding(level.cols, level.rows, blockedWithTreasure);
          blockedWithTreasure.add(cellKey(secondKey));
          setLevelOneKeyCells([firstKey, secondKey]);
        } else {
          setLevelOneKeyCells([]);
        }

        if (!hasDie && !dieUsed) {
          const nextDie = randomCellAvoiding(level.cols, level.rows, blockedWithTreasure);
          blockedWithTreasure.add(cellKey(nextDie));
          setDieCell(nextDie);
        } else {
          setDieCell(null);
        }

        setLevelThreeLockCell(null);
        setLevelTwoHintCells([]);

        const bombs = randomManyCellsAvoiding(
          level.cols,
          level.rows,
          blockedWithTreasure,
          bombCount
        );
        setBombCells(bombs);
      } else if (currentLevel === 2) {
        const blocked = getLevelTwoBlocked(level.cols, level.rows);
        const nextTreasure = randomCellAvoiding(level.cols, level.rows, blocked);
        setTreasure(nextTreasure);

        const blockedWithTreasure = new Set(blocked);
        blockedWithTreasure.add(cellKey(nextTreasure));

        setLevelOneKeyCells([]);
        setLevelThreeLockCell(null);
        setDieCell(null);

        const hintPool: HintEnvelopeId[] = [];

        if (!heartSecretUnlocked) hintPool.push("heart", "heart", "heart");
        if (!alienSecretUnlocked) hintPool.push("alien", "alien", "alien");
        if (!bossSecretUnlocked) hintPool.push("boss", "boss", "boss");
        if (!aceSecretUnlocked) hintPool.push("ace", "ace", "ace");
        if (!jackpotSecretUnlocked) hintPool.push("jackpot", "jackpot", "jackpot");
        if (!banditSecretUnlocked) hintPool.push("bandit", "bandit", "bandit");

        hintPool.push("memory", "memory", "memory", "memory", "memory");

        const generatedHints: HintEnvelope[] = [];
        const blockedForHints = new Set(blockedWithTreasure);

        const totalHintCards = Math.min(
          8,
          Math.max(4, Math.floor((level.cols * level.rows) / 18))
        );

        for (let i = 0; i < totalHintCards && hintPool.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * hintPool.length);
          const id = hintPool.splice(randomIndex, 1)[0];

          const cell = randomCellAvoiding(level.cols, level.rows, blockedForHints);
          blockedForHints.add(cellKey(cell));
          generatedHints.push({ id, cell, text: HINT_TEXTS[id] });
        }

        setLevelTwoHintCells(generatedHints);

        const bombs = randomManyCellsAvoiding(
          level.cols,
          level.rows,
          blockedForHints,
          bombCount
        );
        setBombCells(bombs);
      } else if (currentLevel === 3) {
        const blocked = getLevelThreeBlocked(level.cols, level.rows);
        const nextTreasure = randomCellAvoiding(level.cols, level.rows, blocked);
        setTreasure(nextTreasure);

        const blockedWithTreasure = new Set(blocked);
        blockedWithTreasure.add(cellKey(nextTreasure));

        const lockCell = randomCellAvoiding(level.cols, level.rows, blockedWithTreasure);
        setLevelThreeLockCell(lockCell);
        setLevelOneKeyCells([]);
        setLevelTwoHintCells([]);
        setDieCell(null);

        const blockedForBombs = new Set(blockedWithTreasure);
        blockedForBombs.add(cellKey(lockCell));

        const bombs = randomManyCellsAvoiding(
          level.cols,
          level.rows,
          blockedForBombs,
          bombCount
        );
        setBombCells(bombs);
      } else {
        setTreasure(null);
        setLevelOneKeyCells([]);
        setLevelThreeLockCell(null);
        setBombCells([]);
        setLevelTwoHintCells([]);
        setDieCell(null);
      }
    }

    startSessionTimer();
    touchInteraction();
  }, [currentLevel, boardSeed, level.cols, level.rows, level.secretType, trollMode]);

  useEffect(() => {
    startSessionTimer();
    const now = Date.now();
    lastInteractionRef.current = now;
    lastKnockRef.current = now;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!sessionStartRef.current) return;

      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      setTotalElapsed(elapsed);

      if (!level.isSecret && elapsed >= SLEEP_LIMIT_SECONDS && !sleepMode && !finalCelebration) {
        setSleepMode(true);
        setHint("");
        setStatusMessage("VOLTE QUANDO ACORDAR.");

        if (!hasReward("slow")) {
          addReward("slow");
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [level.isSecret, sleepMode, finalCelebration]);

  useEffect(() => {
    if (sleepMode || mainGameFinished || gameFinished || finalCelebration || gameOver) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleFor = now - lastInteractionRef.current;
      const sinceLastKnock = now - lastKnockRef.current;

      if (idleFor >= IDLE_KNOCK_MS && sinceLastKnock >= IDLE_KNOCK_MS) {
        flashIdle("TOC TOC");
        lastKnockRef.current = now;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sleepMode, mainGameFinished, gameFinished, finalCelebration, gameOver]);

  useEffect(() => {
    if (
      level.secretType !== "boss" ||
      found ||
      gameFinished ||
      sleepMode ||
      finalCelebration ||
      gameOver ||
      clicks >= MAX_CLICKS
    ) {
      return;
    }

    const interval = setInterval(() => {
      const last = lastBossActionRef.current;
      if (!last) return;

      const diff = Date.now() - last;
      if (diff >= 5000) {
        setClicks((prev) => {
          if (prev >= MAX_CLICKS) return prev;
          return prev + 1;
        });
        flashStatus("Tomou dano do boss. -1 chance.");
        lastBossActionRef.current = Date.now();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [level.secretType, found, gameFinished, sleepMode, finalCelebration, gameOver, clicks]);

  useEffect(() => {
    return () => {
      if (signalTimeoutRef.current) window.clearTimeout(signalTimeoutRef.current);
      if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
      if (statusTimeoutRef.current) window.clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  function handleTitleClick() {
    if (finalCelebration) return;
    if (currentLevel !== 1) return;
    if (clickedCells.length > 0 || clicks > 0) return;

    touchInteraction();

    const next = titleClicks + 1;
    setTitleClicks(next);

    if (next >= 10 && !trollMode) {
      setTrollMode(true);
      startTrollRun();
      flashStatus("Modo troll ativado. As dicas agora mentem. CORRA!!!");
    }
  }

  function handleFinalBoardClick(row: number, col: number) {
    const key = `${col}-${row}`;
    if (finalClickedCells.includes(key)) return;
    setFinalClickedCells((prev) => [...prev, key]);
  }

  function handleHintCardClick(id: HintEnvelopeId) {
    flashStatus(HINT_TEXTS[id]);
  }

  function maybeHandleSixNine(levelId: number, cell: Cell) {
    if (levelId < 1 || levelId > 3) return false;
    if (sixNineDone.includes(levelId)) return false;

    const step = sixNineProgress[levelId];
    const isSixth = cell.col === 5 && cell.row === 0;
    const isNinth = cell.col === 8 && cell.row === 0;

    if (isSixth && step === 0) {
      setSixNineProgress((prev) => ({ ...prev, [levelId]: 1 }));
      return false;
    }

    if (isNinth && step === 1) {
      const messages: Record<number, string> = {
        1: "eu sei o que voce procura!",
        2: "seu safadinho, nao tem nada aqui!",
        3: "esse conteudo foi removido em virtude da lei felca de 2026.",
      };

      setSixNineDone((prev) => [...prev, levelId]);
      setSixNineProgress((prev) => ({ ...prev, [levelId]: 0 }));
      flashStatus(messages[levelId]);
      return true;
    }

    if (!isSixth && !isNinth) {
      setSixNineProgress((prev) => ({ ...prev, [levelId]: 0 }));
    } else if (isNinth && step === 0) {
      setSixNineProgress((prev) => ({ ...prev, [levelId]: 0 }));
    }

    return false;
  }

  function getRevealableCells(): Cell[] {
    const revealable: Cell[] = [];

    for (let row = 0; row < level.rows; row++) {
      for (let col = 0; col < level.cols; col++) {
        if (!isVisibleCellForLevel(level, row, col)) continue;

        const key = `${col}-${row}`;
        if (clickedCells.includes(key)) continue;

        if (treasure && treasure.col === col && treasure.row === row) continue;
        if (bombCells.some((bomb) => bomb.col === col && bomb.row === row)) continue;
        if (levelTwoHintCells.some((item) => item.cell.col === col && item.cell.row === row)) continue;
        if (levelOneKeyCells.some((item) => item.col === col && item.row === row)) continue;
        if (dieCell && dieCell.col === col && dieCell.row === row) continue;

        if (
          currentLevel === 3 &&
          levelThreeLockCell &&
          levelThreeLockCell.col === col &&
          levelThreeLockCell.row === row
        ) {
          continue;
        }

        revealable.push({ col, row });
      }
    }

    return revealable;
  }

  function handleRollDie() {
    if (!hasDie || dieUsed || finalCelebration || gameOver || sleepMode || !treasure) return;

    touchInteraction();
    setDieUsed(true);
    setHasDie(false);

    const unlucky = Math.random() < 0.01;
    if (unlucky) {
      flashSignal("O dado rolou fora da mesa.");
      return;
    }

    const result = Math.floor(Math.random() * 6) + 1;
    flashSignal(`O dado rolou e o resultado foi ${result}.`);

    const revealable = getRevealableCells();
    if (revealable.length === 0) return;

    const copy = [...revealable];
    const chosen: Cell[] = [];

    for (let i = 0; i < result && copy.length > 0; i++) {
      const index = Math.floor(Math.random() * copy.length);
      chosen.push(copy.splice(index, 1)[0]);
    }

    setClickedCells((prev) => {
      const next = new Set(prev);
      chosen.forEach((cell) => next.add(cellKey(cell)));
      return Array.from(next);
    });
  }

  function completeSecretUnlock(levelId: number, setter: (value: boolean) => void) {
    setter(true);
    flashStatus("voce desbloqueou um easter egg, conclua os niveis para abrir");
    setUnlockedLevels((prev) => (prev.includes(levelId) ? prev : [...prev, levelId]));
  }

  function isEasterEggTriggerCell(levelId: number, cell: Cell) {
    const isFirstBlock = cell.col === 0 && cell.row === 0;
    const isSeventhTop = cell.col === 6 && cell.row === 0;

    if (levelId === 1 && isFirstBlock) return true;
    if ((levelId === 1 || levelId === 2 || levelId === 3) && isSeventhTop) return true;
    return false;
  }

  function handleClick(cell: Cell) {
    if (
      !treasure ||
      found ||
      gameFinished ||
      sleepMode ||
      finalCelebration ||
      gameOver ||
      clicks >= MAX_CLICKS
    ) {
      return;
    }

    touchInteraction();

    if (level.secretType === "heart" && !isHeartCell(cell.row, cell.col, level.rows, level.cols)) return;
    if (level.secretType === "boss" && !isSkullCell(cell.row, cell.col, level.rows, level.cols)) return;
    if (level.secretType === "alien" && !isAlienCell(cell.row, cell.col, level.rows, level.cols)) return;
    if (level.secretType === "ace" && !isSpadeCell(cell.row, cell.col, level.rows, level.cols)) return;
    if (level.secretType === "jackpot" && !isJackpotCell(cell.row, cell.col, level.rows, level.cols)) return;
    if (level.secretType === "bandit" && !isBanditCell(cell.row, cell.col, level.rows, level.cols)) return;

    const key = `${cell.col}-${cell.row}`;

    const clickedLock =
      currentLevel === 3 &&
      hasKey &&
      !giftUnlocked &&
      !!levelThreeLockCell &&
      cell.col === levelThreeLockCell.col &&
      cell.row === levelThreeLockCell.row;

    const easterEggRepeatAllowed = !level.isSecret && isEasterEggTriggerCell(currentLevel, cell);

    if (clickedCells.includes(key) && !clickedLock && !easterEggRepeatAllowed) {
      flashStatus("Isso não vai funcionar… mas continua tentando (TDAH).");
      return;
    }

    const triggeredSecretMessage = maybeHandleSixNine(currentLevel, cell);

    const clickedBomb = bombCells.some(
      (bomb) => bomb.col === cell.col && bomb.row === cell.row
    );

    if (clickedBomb) {
      setClickedCells((prev) => [...prev, key]);
      setGameOver(true);
      setHint("");
      setStatusMessage("GAME OVER");
      return;
    }

    if (level.secretType === "boss") {
      lastBossActionRef.current = Date.now();
    }

    if (currentLevel === 2) {
      const envelope = levelTwoHintCells.find(
        (item) => item.cell.col === cell.col && item.cell.row === cell.row
      );

      if (envelope) {
        setFoundHintCards((prev) => [...prev, envelope.id]);
        setLevelTwoHintCells((prev) =>
          prev.filter(
            (item) => !(item.cell.col === cell.col && item.cell.row === cell.row)
          )
        );

        flashStatus(envelope.text);

        const distance = Math.abs(cell.col - treasure.col) + Math.abs(cell.row - treasure.row);
        setClickedCells((prev) => [...prev, key]);
        setHint(getDirection(cell, treasure, level.cols, level.rows, trollMode));
        setClicks((c) => c + 1);

        if (!triggeredSecretMessage && clicks + 1 >= MAX_CLICKS && distance === 1) {
          flashStatus("Era literalmente ao lado…");
        }
        return;
      }
    }

    if (currentLevel === 1 && !hasDie && !dieUsed && dieCell) {
      const clickedDie = dieCell.col === cell.col && dieCell.row === cell.row;

      if (clickedDie) {
        setHasDie(true);
        setDieCell(null);
        setClickedCells((prev) => [...prev, key]);

        const distance = Math.abs(cell.col - treasure.col) + Math.abs(cell.row - treasure.row);
        const nextClicks = clicks + 1;

        flashStatus("Você encontrou um dado.");

        if (!triggeredSecretMessage && nextClicks >= MAX_CLICKS && distance === 1) {
          flashStatus("Era literalmente ao lado…");
        }

        setHint(getDirection(cell, treasure, level.cols, level.rows, trollMode));
        setClicks((c) => c + 1);
        return;
      }
    }

    if (currentLevel === 1 && !hasKey && !giftUnlocked && levelOneKeyCells.length > 0) {
      const clickedKey = levelOneKeyCells.find(
        (keyCell) => keyCell.col === cell.col && keyCell.row === cell.row
      );

      if (clickedKey) {
        setHasKey(true);
        setRevealedKeyCell(clickedKey);
        setLevelOneKeyCells([]);
        setClickedCells((prev) => [...prev, key]);

        const distance = Math.abs(cell.col - treasure.col) + Math.abs(cell.row - treasure.row);
        const nextClicks = clicks + 1;

        if (!triggeredSecretMessage && nextClicks >= MAX_CLICKS && distance === 1) {
          flashStatus("Era literalmente ao lado…");
        } else if (!triggeredSecretMessage) {
          setStatusMessage("");
        }

        setHint(getDirection(cell, treasure, level.cols, level.rows, trollMode));
        setClicks((c) => c + 1);
        return;
      }
    }

    if (clickedLock) {
      setHasKey(false);
      setGiftUnlocked(true);
      setGiftOpenedThisRun(true);
      setClickedCells((prev) => [...prev, key]);
      setLevelOneKeyCells([]);
      setRevealedKeyCell(null);
      addReward("gift");
      flashSignal("CLICK");
      flashStatus("Um presente foi liberado.");
      setClicks((c) => c + 1);
      return;
    }

    const clickedHeartSecretTrigger =
      !level.isSecret &&
      cell.col === level.cols - 1 &&
      cell.row === level.rows - 1;

    const clickedBossTrigger =
      !level.isSecret &&
      cell.col === 5 &&
      cell.row === 0;

    const clickedAlienStepOne =
      currentLevel === 1 && cell.col === 4 && cell.row === 0;

    const clickedAlienStepTwo =
      currentLevel === 1 && cell.col === 0 && cell.row === 0;

    const clickedAceTrigger =
      !level.isSecret &&
      cell.col === 0 &&
      cell.row === 0;

    const clickedJackpotTrigger =
      !level.isSecret &&
      cell.col === 6 &&
      cell.row === 0;

    const clickedBanditStepOne = currentLevel === 1 && cell.col === 0 && cell.row === 0;
    const clickedBanditStepTwo = currentLevel === 2 && cell.col === 6 && cell.row === 0;
    const clickedBanditStepThree = currentLevel === 1 && cell.col === 0 && cell.row === 0;

    if (clickedHeartSecretTrigger && !heartSecretProgress.includes(currentLevel)) {
      const nextHeartSet = [...heartSecretProgress, currentLevel];
      setHeartSecretProgress(nextHeartSet);

      if (!heartSecretUnlocked) {
        flashSignal("CLICK");
      }

      const completedHeart =
        nextHeartSet.includes(1) &&
        nextHeartSet.includes(2) &&
        nextHeartSet.includes(3) &&
        !heartSecretUnlocked;

      if (completedHeart) {
        completeSecretUnlock(4, setHeartSecretUnlocked);
      }
    }

    if (clickedBossTrigger && !bossSecretProgress.includes(currentLevel)) {
      const nextBossSet = [...bossSecretProgress, currentLevel];
      setBossSecretProgress(nextBossSet);

      if (!bossSecretUnlocked) {
        flashSignal("CLICK");
      }

      const completedBoss =
        nextBossSet.includes(1) &&
        nextBossSet.includes(2) &&
        nextBossSet.includes(3) &&
        !bossSecretUnlocked;

      if (completedBoss) {
        completeSecretUnlock(5, setBossSecretUnlocked);
      }
    }

    if (!alienSecretUnlocked && currentLevel === 1) {
      if (clickedAlienStepOne && alienSequenceStep === 0) {
        setAlienSequenceStep(1);
        flashSignal("CLICK");
      } else if (clickedAlienStepTwo && alienSequenceStep === 1) {
        setAlienSequenceStep(2);
        setAlienSecretUnlocked(true);
        setUnlockedLevels((prev) => (prev.includes(6) ? prev : [...prev, 6]));
        flashSignal("CLICK");
      } else if (!clickedAlienStepOne && !clickedAlienStepTwo) {
        setAlienSequenceStep(0);
      } else if (clickedAlienStepTwo && alienSequenceStep === 0) {
        setAlienSequenceStep(0);
      }
    }

    if (clickedAceTrigger && !aceSecretProgress.includes(currentLevel)) {
      const nextAceSet = [...aceSecretProgress, currentLevel];
      setAceSecretProgress(nextAceSet);

      if (!aceSecretUnlocked) {
        flashSignal("CLICK");
      }

      const completedAce =
        nextAceSet.includes(1) &&
        nextAceSet.includes(2) &&
        nextAceSet.includes(3) &&
        !aceSecretUnlocked;

      if (completedAce) {
        completeSecretUnlock(7, setAceSecretUnlocked);
      }
    }

    if (clickedJackpotTrigger && !jackpotSecretProgress.includes(currentLevel)) {
      const nextJackpotSet = [...jackpotSecretProgress, currentLevel];
      setJackpotSecretProgress(nextJackpotSet);

      if (!jackpotSecretUnlocked) {
        flashSignal("CLICK");
      }

      const completedJackpot =
        nextJackpotSet.includes(1) &&
        nextJackpotSet.includes(2) &&
        nextJackpotSet.includes(3) &&
        !jackpotSecretUnlocked;

      if (completedJackpot) {
        completeSecretUnlock(8, setJackpotSecretUnlocked);
      }
    }

    if (!banditSecretUnlocked) {
      if (clickedBanditStepOne && banditSecretStep === 0) {
        setBanditSecretStep(1);
        flashSignal("CLICK");
      } else if (clickedBanditStepTwo && banditSecretStep === 1) {
        setBanditSecretStep(2);
        flashSignal("CLICK");
      } else if (clickedBanditStepThree && banditSecretStep === 2) {
        setBanditSecretStep(3);
        flashSignal("CLICK");
        completeSecretUnlock(9, setBanditSecretUnlocked);
      } else if (clickedBanditStepOne || clickedBanditStepTwo) {
        setBanditSecretStep(clickedBanditStepOne ? 1 : 0);
      }
    }

    const hit = cell.col === treasure.col && cell.row === treasure.row;
    const distance = Math.abs(cell.col - treasure.col) + Math.abs(cell.row - treasure.row);

    setClickedCells((prev) => [...prev, key]);

    if (hit) {
      setFound(true);
      setHint("");
      setStatusMessage("");

      if (currentLevel < 3) {
        const nextLevel = currentLevel + 1;
        setUnlockedLevels((prev) =>
          prev.includes(nextLevel) ? prev : [...prev, nextLevel]
        );
        markRabbitRunProgress(currentLevel);
        markTrollRunProgress(currentLevel);
      } else if (currentLevel === 3) {
        markRabbitRunProgress(3);
        markTrollRunProgress(3);
        setMainGameFinished(true);
      } else if (currentLevel === 4) {
        addReward("heart");
        setGameFinished(true);
      } else if (currentLevel === 5) {
        addReward("boss");
        setGameFinished(true);
      } else if (currentLevel === 6) {
        addReward("alien");
        setGameFinished(true);
      } else if (currentLevel === 7) {
        addReward("ace");
        setGameFinished(true);
      } else if (currentLevel === 8) {
        addReward("jackpot");
        setGameFinished(true);
      } else if (currentLevel === 9) {
        addReward("bandit");
        setGameFinished(true);
      }
    } else {
      const nextClicks = clicks + 1;

      if (triggeredSecretMessage) {
        // mantém a mensagem secreta visível
      } else if (nextClicks >= MAX_CLICKS && distance === 1) {
        flashStatus("Era literalmente ao lado…");
      } else if (level.secretType === "boss" && nextClicks >= 3) {
        flashStatus("Você está procurando… ou sendo observado?");
      } else {
        setStatusMessage("");
      }

      setHint(getDirection(cell, treasure, level.cols, level.rows, trollMode));
    }

    setClicks((c) => c + 1);
  }

  function goToLevel(levelId: number) {
    if (!unlockedLevels.includes(levelId)) return;
    if (levelId >= 4 && !mainGameFinished) return;
    if (finalCelebration || gameOver) return;

    touchInteraction();
    setCurrentLevel(levelId);
  }

  function goToNextLevel() {
    if (currentLevel < 3 && unlockedLevels.includes(currentLevel + 1)) {
      touchInteraction();
      setCurrentLevel(currentLevel + 1);
    }
  }

  async function handleShare() {
    touchInteraction();

    if (finalCelebration) {
      const finalGrid = FIM_PATTERN.map((line, row) =>
        line
          .split("")
          .map((value, col) => {
            const key = `${col}-${row}`;
            const clicked = finalClickedCells.includes(key);

            if (clicked) return getFinalBoardEmoji(row, col, finalTheme);
            return value === "1" ? "🟨" : "⬛";
          })
          .join("")
      ).join("\n");

      const rewardsLine =
        collectedRewards.length > 0
          ? `\n${collectedRewards.map((reward) => reward.emoji).join(" ")}`
          : "";

      const respectLine = hasReward("speed")
        ? `\nvoce tem o meu respeito. DEV`
        : "";

      const totalLine = `\nvc chegou aqui em ${formatTime(totalElapsed)}`;

      const text = `Encontre o Fim FIM

Você reuniu os segredos. Agora é só celebrar e compartilhar.${totalLine}${respectLine}${rewardsLine}

${finalGrid}

${SHARE_LINK}`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: "Encontre o Fim",
            text,
          });
        } else {
          await navigator.clipboard.writeText(text);
          setShareMessage("Resultado copiado para a área de transferência.");
          setTimeout(() => setShareMessage(""), 2500);
        }
      } catch {
        setShareMessage("Não foi possível compartilhar agora.");
        setTimeout(() => setShareMessage(""), 2500);
      }

      return;
    }

    const result = found ? `${clicks}/${MAX_CLICKS}` : `X/${MAX_CLICKS}`;

    const grid = Array.from({ length: level.rows }, (_, row) =>
      Array.from({ length: level.cols }, (_, col) => {
        const key = `${col}-${row}`;
        const clicked = clickedCells.includes(key);
        const isTreasure =
          treasure && col === treasure.col && row === treasure.row;
        const isBomb = bombCells.some((bomb) => bomb.col === col && bomb.row === row);

        if (gameOver && isBomb) return "💣";

        if (found && isTreasure) {
          if (level.secretType === "heart") return "❤️";
          if (level.secretType === "boss") return "💀";
          if (level.secretType === "alien") return "👽";
          if (level.secretType === "ace") return "♠️";
          if (level.secretType === "jackpot") return "🎰";
          if (level.secretType === "bandit") return "🎖️";
          return "🟨";
        }

        if (
          currentLevel === 3 &&
          hasKey &&
          !giftUnlocked &&
          levelThreeLockCell &&
          col === levelThreeLockCell.col &&
          row === levelThreeLockCell.row
        ) {
          return "🔒";
        }

        if (
          currentLevel === 3 &&
          giftOpenedThisRun &&
          levelThreeLockCell &&
          col === levelThreeLockCell.col &&
          row === levelThreeLockCell.row
        ) {
          return "🎁";
        }

        if (clicked) return "🟦";
        return "⬛";
      }).join("")
    ).join("\n");

    const timeLine = level.isSecret ? "" : `Tempo: ${formatTime(totalElapsed)}\n`;
    const overLine = gameOver ? "GAME OVER\n" : "";

    const text = `Encontre o Fim ${level.name} ${result}
${overLine}${timeLine}
${grid}

${SHARE_LINK}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Encontre o Fim",
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMessage("Resultado copiado para a área de transferência.");
        setTimeout(() => setShareMessage(""), 2500);
      }
    } catch {
      setShareMessage("Não foi possível compartilhar agora.");
      setTimeout(() => setShareMessage(""), 2500);
    }
  }

  const showTime = !level.isSecret && !finalCelebration;
  const showHint =
    !found &&
    clicks < MAX_CLICKS &&
    !gameFinished &&
    !sleepMode &&
    !finalCelebration &&
    !gameOver &&
    (level.isSecret || !mainGameFinished);

  const showMainFinalMessage =
    mainGameFinished &&
    !finalCelebration &&
    currentLevel !== 4 &&
    currentLevel !== 5 &&
    currentLevel !== 6 &&
    currentLevel !== 7 &&
    currentLevel !== 8 &&
    currentLevel !== 9;

  const visibleLevels = LEVELS.filter((lvl) => {
    if (lvl.id <= 3) return true;
    if (!mainGameFinished) return false;
    if (lvl.id === 4) return heartSecretUnlocked;
    if (lvl.id === 5) return bossSecretUnlocked;
    if (lvl.id === 6) return alienSecretUnlocked;
    if (lvl.id === 7) return aceSecretUnlocked;
    if (lvl.id === 8) return jackpotSecretUnlocked;
    if (lvl.id === 9) return banditSecretUnlocked;
    return false;
  });

  const canShare = finalCelebration || found || clicks >= MAX_CLICKS || gameOver;
  const lostBoss = level.secretType === "boss" && !found && clicks >= MAX_CLICKS;
  const lostAlien = level.secretType === "alien" && !found && clicks >= MAX_CLICKS;
  const lostAce = level.secretType === "ace" && !found && clicks >= MAX_CLICKS;
  const lostJackpot = level.secretType === "jackpot" && !found && clicks >= MAX_CLICKS;
  const lostBandit = level.secretType === "bandit" && !found && clicks >= MAX_CLICKS;
  const bossDanger = level.secretType === "boss" && clicks >= 3;

  return (
    <main
      className={`min-h-[100dvh] text-white flex flex-col items-center justify-start gap-3 px-3 sm:px-6 pt-2 pb-3 sm:pt-4 relative overflow-hidden ${
        level.secretType === "boss" ? "bg-black" : "bg-zinc-950"
      }`}
      style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
    >
      <style jsx global>{`
        @keyframes treasurePop {
          0% {
            transform: scale(0.2) rotate(-18deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.18) rotate(8deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes treasurePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(250, 204, 21, 0);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 24px rgba(250, 204, 21, 0.45);
          }
        }

        @keyframes heartPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(244, 63, 94, 0);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 24px rgba(244, 63, 94, 0.5);
          }
        }

        @keyframes bossPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(239, 68, 68, 0);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 28px rgba(239, 68, 68, 0.65);
          }
        }

        @keyframes alienPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(34, 197, 94, 0);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 28px rgba(34, 197, 94, 0.55);
          }
        }

        @keyframes acePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 28px rgba(255, 255, 255, 0.35);
          }
        }

        @keyframes bossGlow {
          0%, 100% {
            filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.75));
          }
        }

        @keyframes alienGlow {
          0%, 100% {
            filter: drop-shadow(0 0 0 rgba(34, 197, 94, 0));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.75));
          }
        }

        @keyframes aceGlow {
          0%, 100% {
            filter: drop-shadow(0 0 0 rgba(255, 255, 255, 0));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.55));
          }
        }

        @keyframes bossBackgroundPulse {
          0%, 100% {
            opacity: 0.18;
            transform: scale(1);
          }
          50% {
            opacity: 0.38;
            transform: scale(1.06);
          }
        }

        @keyframes bossBackgroundPulseFast {
          0%, 100% {
            opacity: 0.28;
            transform: scale(1);
          }
          50% {
            opacity: 0.52;
            transform: scale(1.1);
          }
        }

        @keyframes alienBackgroundPulse {
          0%, 100% {
            opacity: 0.16;
            transform: scale(1);
          }
          50% {
            opacity: 0.34;
            transform: scale(1.04);
          }
        }

        @keyframes aceBackgroundPulse {
          0%, 100% {
            opacity: 0.12;
            transform: scale(1);
          }
          50% {
            opacity: 0.28;
            transform: scale(1.04);
          }
        }

        @keyframes eyeBlink {
          0%, 42%, 48%, 100% {
            transform: scaleY(1);
            opacity: 1;
          }
          45% {
            transform: scaleY(0.12);
            opacity: 0.85;
          }
        }

        @keyframes teethChatter {
          0%, 100% {
            transform: translateY(0px);
          }
          25% {
            transform: translateY(1px);
          }
          50% {
            transform: translateY(-1px);
          }
          75% {
            transform: translateY(1px);
          }
        }

        @keyframes floatSignal {
          0% {
            transform: translateY(10px) scale(0.9);
            opacity: 0;
          }
          20% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          80% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-8px) scale(1.03);
            opacity: 0;
          }
        }

        .treasure-pop {
          animation: treasurePop 0.45s ease-out;
        }

        .treasure-pulse {
          animation: treasurePulse 1.2s ease-in-out infinite;
        }

        .heart-pulse {
          animation: heartPulse 1.2s ease-in-out infinite;
        }

        .boss-pulse {
          animation: bossPulse 1.2s ease-in-out infinite;
        }

        .alien-pulse {
          animation: alienPulse 1.2s ease-in-out infinite;
        }

        .ace-pulse {
          animation: acePulse 1.2s ease-in-out infinite;
        }

        .boss-glow {
          animation: bossGlow 1.6s ease-in-out infinite;
        }

        .alien-glow {
          animation: alienGlow 1.6s ease-in-out infinite;
        }

        .ace-glow {
          animation: aceGlow 1.8s ease-in-out infinite;
        }

        .boss-background-pulse {
          animation: bossBackgroundPulse 2.4s ease-in-out infinite;
        }

        .boss-background-pulse-fast {
          animation: bossBackgroundPulseFast 1.25s ease-in-out infinite;
        }

        .alien-background-pulse {
          animation: alienBackgroundPulse 2.7s ease-in-out infinite;
        }

        .ace-background-pulse {
          animation: aceBackgroundPulse 2.7s ease-in-out infinite;
        }

        .boss-eye {
          animation: eyeBlink 3.2s ease-in-out infinite;
          transform-origin: center;
        }

        .boss-teeth {
          animation: teethChatter 0.18s ease-in-out infinite;
        }

        .signal-float {
          animation: floatSignal 1s ease-out forwards;
        }
      `}</style>

      {level.secretType === "boss" && !finalCelebration && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-red-900/10 to-black pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] rounded-full bg-red-700/20 blur-3xl ${
                bossDanger ? "boss-background-pulse-fast" : "boss-background-pulse"
              }`}
            />
          </div>
        </>
      )}

      {level.secretType === "alien" && !finalCelebration && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 via-emerald-900/10 to-zinc-950 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] rounded-full bg-green-500/10 blur-3xl alien-background-pulse" />
          </div>
        </>
      )}

      {level.secretType === "ace" && !finalCelebration && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 via-zinc-900/10 to-black pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] rounded-full bg-white/10 blur-3xl ace-background-pulse" />
          </div>
        </>
      )}

      {level.secretType === "jackpot" && !finalCelebration && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 via-amber-900/10 to-zinc-950 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] rounded-full bg-yellow-400/10 blur-3xl ace-background-pulse" />
          </div>
        </>
      )}

      {level.secretType === "bandit" && !finalCelebration && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/10 via-zinc-900/10 to-black pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] rounded-full bg-white/5 blur-3xl ace-background-pulse" />
          </div>
        </>
      )}

      {(signalMessage || idleMessage) && (
        <div className="absolute top-3 sm:top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3">
          <div className="signal-float px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-sm sm:text-2xl font-extrabold tracking-[0.04em] sm:tracking-[0.18em] text-center max-w-[92vw]">
            {signalMessage || idleMessage}
          </div>
        </div>
      )}

      {showInstructions && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900/95 shadow-2xl px-5 py-5 text-zinc-100">
            <p className="text-[10px] sm:text-xs tracking-[0.28em] uppercase text-zinc-500 mb-3">
              Instruções
            </p>
            <div className="space-y-3 text-sm sm:text-base leading-relaxed">
              {INSTRUCTIONS_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="mt-4 text-[11px] sm:text-xs text-zinc-500">
              Clique em qualquer lugar para sair
            </p>
          </div>
        </div>
      )}

      {showRankingModal && !finalCelebration && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4"
          onClick={() => setShowRankingModal(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl max-h-[82vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div>
                <p className="text-[10px] tracking-[0.22em] text-zinc-400 uppercase">
                  Você não está sozinho aqui...
                </p>
                <h2 className="text-base sm:text-lg font-bold mt-1">🏆 Ranking Global</h2>
              </div>

              <button
                onClick={() => setShowRankingModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 transition text-sm"
                aria-label="Fechar ranking"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="p-3 space-y-2 text-[11px] sm:text-xs overflow-y-auto max-h-[calc(82vh-76px)]">
              {displayRanking.length === 0 ? (
                <div className="px-3 py-4 rounded-xl bg-zinc-800 text-zinc-400 text-center">
                  Ninguém escapou ainda.
                </div>
              ) : (
                displayRanking.map((entry, index) => (
                  <div
                    key={`${entry.name}-${index}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-800 gap-2"
                  >
                    <span className="font-medium min-w-[72px] truncate">
                      #{index + 1} {entry.name}
                    </span>

                    <span className="flex items-center gap-2 text-right ml-auto">
                      <span className="font-mono text-zinc-200">{formatTime(entry.time)}</span>
                      <span className="min-w-[64px] text-right truncate">
                        {entry.secrets.join(" ")}
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full flex flex-col items-center gap-3">
        <h1
          onClick={handleTitleClick}
          className={`${isMobile ? "text-3xl" : "text-4xl"} font-bold cursor-pointer select-none text-center leading-tight`}
        >
          {finalCelebration
            ? "FIM"
            : level.secretType === "heart"
              ? "Fase Secreta"
              : level.secretType === "boss"
                ? "FINAL BOSS"
                : level.secretType === "alien"
                  ? "AREA 51"
                  : level.secretType === "ace"
                    ? "ACE"
                    : level.secretType === "jackpot"
                      ? "JACKPOT"
                      : level.secretType === "bandit"
                        ? "GOLPISTA"
                        : "Encontre o Fim"}
        </h1>

        {!finalCelebration && (
          <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
            {visibleLevels.map((lvl) => {
              const unlocked = unlockedLevels.includes(lvl.id);
              const active = currentLevel === lvl.id;

              return (
                <button
                  key={lvl.id}
                  onClick={() => goToLevel(lvl.id)}
                  disabled={!unlocked}
                  className={`font-semibold transition border ${
                    isMobile ? "px-3 py-2 text-sm rounded-lg" : "px-4 py-2 rounded-xl"
                  } ${
                    active
                      ? lvl.secretType === "heart"
                        ? "bg-rose-500 text-white border-rose-300"
                        : lvl.secretType === "boss"
                          ? "bg-red-600 text-white border-red-400"
                          : lvl.secretType === "alien"
                            ? "bg-green-600 text-white border-green-400"
                            : lvl.secretType === "ace"
                              ? "bg-white text-black border-zinc-300"
                              : lvl.secretType === "jackpot"
                                ? "bg-yellow-400 text-black border-yellow-200"
                                : lvl.secretType === "bandit"
                                  ? "bg-white text-black border-zinc-300"
                                  : "bg-amber-400 text-black border-amber-300"
                      : unlocked
                        ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                        : "bg-zinc-900 text-zinc-500 border-zinc-800 cursor-not-allowed"
                  }`}
                >
                  {lvl.name} {!unlocked && "🔒"}
                </button>
              );
            })}
          </div>
        )}

        <div className={`text-center ${isMobile ? "space-y-1 min-h-[108px]" : "space-y-1 min-h-[150px]"}`}>
          {!finalCelebration && (
            <p className={isMobile ? "text-base font-semibold" : "text-xl font-semibold"}>
              {level.name}
            </p>
          )}

          {!finalCelebration && (
            <p className={isMobile ? "text-base" : "text-lg"}>
              Tentativas restantes: {MAX_CLICKS - clicks}
            </p>
          )}

          {showTime && <p className={isMobile ? "text-base" : "text-lg"}>Tempo: {formatTime(totalElapsed)}</p>}

          {!finalCelebration &&
            level.secretType === "boss" &&
            !found &&
            clicks < MAX_CLICKS &&
            !sleepMode &&
            !gameOver && (
              <p className="text-red-300 font-semibold boss-glow text-sm sm:text-base">
                Você me encontrou, seu humano medíocre.
              </p>
            )}

          {!finalCelebration &&
            level.secretType === "alien" &&
            !found &&
            clicks < MAX_CLICKS &&
            !sleepMode &&
            !gameOver && (
              <p className="text-green-300 font-semibold alien-glow text-sm sm:text-base">
                Sinais detectados. Permaneça calmo, humano.
              </p>
            )}

          {!finalCelebration &&
            level.secretType === "ace" &&
            !found &&
            clicks < MAX_CLICKS &&
            !sleepMode &&
            !gameOver && (
              <p className="text-zinc-200 font-semibold ace-glow text-sm sm:text-base">
                A mesa foi aberta. Veja se você tem cartas para isso.
              </p>
            )}

          {!finalCelebration &&
            level.secretType === "jackpot" &&
            !found &&
            clicks < MAX_CLICKS &&
            !sleepMode &&
            !gameOver && (
              <p className="text-yellow-300 font-semibold text-sm sm:text-base">
                O brilho aumentou. Talvez a casa nao esteja tao segura.
              </p>
            )}

          {!finalCelebration &&
            level.secretType === "bandit" &&
            !found &&
            clicks < MAX_CLICKS &&
            !sleepMode &&
            !gameOver && (
              <p className="text-zinc-200 font-semibold text-sm sm:text-base">
                Ajude a encontrar o golpista e coloque ele atras das grades.
              </p>
            )}

          {finalCelebration && (
            <>
              <p className="text-base sm:text-lg text-amber-300 font-semibold max-w-2xl">
                {finalThemePhrase}
              </p>
              <p className="text-zinc-200 font-semibold text-sm sm:text-base">
                vc chegou aqui em {formatTime(totalElapsed)}
              </p>
              {hasReward("speed") && (
                <p className="text-zinc-200 font-semibold text-sm sm:text-base">
                  voce tem o meu respeito. DEV
                </p>
              )}
            </>
          )}

          {statusMessage && (
            <p
              className={`font-semibold ${
                sleepMode
                  ? "text-amber-300 text-xl sm:text-2xl"
                  : gameOver
                    ? "text-red-400 text-xl sm:text-2xl"
                    : "text-red-300 text-base sm:text-lg"
              }`}
            >
              {statusMessage}
            </p>
          )}

          {showHint && !statusMessage && (
            <p className={isMobile ? "text-sm" : "text-lg"}>
              {level.secretType === "heart"
                ? `Dica: ${hint || "Encontre o coração escondido"}`
                : level.secretType === "boss"
                  ? `Dica: ${hint || "Encontre a caveira escondida"}`
                  : level.secretType === "alien"
                    ? `Dica: ${hint || "Encontre o alien escondido"}`
                    : level.secretType === "ace"
                      ? `Dica: ${hint || "Encontre o ás escondido"}`
                      : level.secretType === "jackpot"
                        ? `Dica: ${hint || "Encontre o brilho dourado"}`
                        : level.secretType === "bandit"
                          ? `Dica: ${hint || "Encontre o golpista antes que ele fuja"}`
                          : `Dica: ${hint || "Clique em algum bloco"}`}
            </p>
          )}

          {!finalCelebration && found && !level.isSecret && !mainGameFinished && (
            <p className="text-base sm:text-lg text-amber-300 font-semibold">
              🎉 Você encontrou o tesouro!
            </p>
          )}

          {showMainFinalMessage && (
            <>
              <p className="text-base sm:text-lg text-amber-300 font-semibold max-w-2xl">
                {finalMessage}
              </p>
              <p className="text-green-400 text-lg sm:text-xl font-semibold">
                Tempo final: {formatTime(totalElapsed)}
              </p>

              <div className="flex flex-col items-center gap-2 mt-4">
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Seu nome"
                  maxLength={12}
                  className="px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white text-center outline-none focus:border-amber-400 text-sm sm:text-base"
                />

                <button
                  onClick={handleSaveRanking}
                  disabled={!playerName.trim() || rankingSaved}
                  className={`px-4 py-2 rounded font-semibold transition text-sm sm:text-base ${
                    !playerName.trim() || rankingSaved
                      ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                      : "bg-amber-400 hover:bg-amber-300 text-black"
                  }`}
                >
                  {rankingSaved ? "RANKING SALVO" : "SALVAR RANKING"}
                </button>
              </div>
            </>
          )}

          {found && level.secretType === "heart" && !finalCelebration && (
            <p className="text-base sm:text-lg text-rose-300 font-semibold max-w-2xl">
              ❤️ Parabéns. Meu coração agora é seu!
              <br />Dev
            </p>
          )}

          {found && level.secretType === "boss" && !finalCelebration && (
            <p className="text-base sm:text-lg text-red-300 font-semibold max-w-2xl boss-glow">
              💀 Eu jamais pensei que seria derrotado por um insolente como você...
              <br />Mas desta vez, você venceu.
            </p>
          )}

          {found && level.secretType === "alien" && !finalCelebration && (
            <p className="text-base sm:text-lg text-green-300 font-semibold max-w-2xl alien-glow">
              👽 BUSQUE CONHECIMENTO...
            </p>
          )}

          {found && level.secretType === "ace" && !finalCelebration && (
            <p className="text-base sm:text-lg text-zinc-100 font-semibold max-w-2xl ace-glow">
              ♠ Você puxou exatamente a carta certa.
              <br />Hoje o baralho jogou a seu favor.
            </p>
          )}

          {found && level.secretType === "jackpot" && !finalCelebration && (
            <p className="text-base sm:text-lg text-yellow-300 font-semibold max-w-2xl">
              🎰 JACKPOT. Hoje a casa perdeu.
              <br />As moedas escolheram você.
            </p>
          )}

          {found && level.secretType === "bandit" && !finalCelebration && (
            <p className="text-base sm:text-lg text-zinc-100 font-semibold max-w-2xl">
              🎖️ O golpista foi encontrado.
              <br />Agora ele ficou atrás das grades.
            </p>
          )}

          {lostBoss && !finalCelebration && !gameOver && (
            <p className="text-base sm:text-lg text-red-400 font-semibold max-w-2xl boss-glow">
              💀 Volte para o seu Fortnite, seu verme.
            </p>
          )}

          {lostAlien && !finalCelebration && !gameOver && (
            <p className="text-base sm:text-lg text-green-300 font-semibold max-w-2xl alien-glow">
              👽 Depois que eu roubar todas as vacas da Terra... volto para te abduzir.
            </p>
          )}

          {lostAce && !finalCelebration && !gameOver && (
            <p className="text-base sm:text-lg text-zinc-300 font-semibold max-w-2xl ace-glow">
              ♠ Você blefou mal.
              <br />A casa levou essa mão.
            </p>
          )}

          {lostJackpot && !finalCelebration && !gameOver && (
            <p className="text-base sm:text-lg text-yellow-300 font-semibold max-w-2xl">
              🎰 Quase. O jackpot escapou dessa vez.
            </p>
          )}

          {lostBandit && !finalCelebration && !gameOver && (
            <p className="text-base sm:text-lg text-zinc-200 font-semibold max-w-2xl">
              🚨 O golpista passou por entre as grades.
            </p>
          )}
        </div>

        {finalCelebration ? (
          <div
            className={`grid ${boardGapClass} ${finalBoardPaddingClass} rounded-2xl max-w-full overflow-hidden bg-zinc-900`}
            style={{ gridTemplateColumns: `repeat(${FIM_PATTERN[0].length}, ${finalCellSize}px)` }}
          >
            {FIM_PATTERN.flatMap((line, row) =>
              line.split("").map((value, col) => {
                const key = `${col}-${row}`;
                const clicked = finalClickedCells.includes(key);
                const lit = value === "1";

                return (
                  <button
                    key={key}
                    onClick={() => handleFinalBoardClick(row, col)}
                    className={`transition ${isMobile ? "text-base" : "text-lg"} flex items-center justify-center rounded-lg ${
                      clicked
                        ? "bg-zinc-100 text-black border border-zinc-300"
                        : lit
                          ? "bg-amber-400 text-black"
                          : "bg-zinc-700 hover:bg-zinc-600 text-white"
                    }`}
                    style={{
                      width: `${finalCellSize}px`,
                      height: `${finalCellSize}px`,
                    }}
                  >
                    {clicked ? getFinalBoardEmoji(row, col, finalTheme) : ""}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div
            className={`grid ${boardGapClass} ${boardPaddingClass} rounded-2xl max-w-full overflow-hidden ${
              level.secretType === "boss"
                ? "bg-gradient-to-b from-zinc-950 to-red-950/50 border border-red-900/50 shadow-[0_0_40px_rgba(127,29,29,0.25)]"
                : level.secretType === "alien"
                  ? "bg-gradient-to-b from-lime-900/20 to-emerald-950/40 border border-lime-400/20 shadow-[0_0_40px_rgba(132,204,22,0.18)]"
                  : level.secretType === "ace"
                    ? "bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.08)]"
                    : level.secretType === "jackpot"
                      ? "bg-gradient-to-b from-yellow-950/50 to-amber-950/60 border border-yellow-400/20 shadow-[0_0_40px_rgba(250,204,21,0.18)]"
                      : level.secretType === "bandit"
                        ? "bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.06)]"
                        : "bg-zinc-900"
            }`}
            style={{ gridTemplateColumns: `repeat(${level.cols}, ${responsiveCellSize}px)` }}
          >
            {Array.from({ length: level.rows }).flatMap((_, row) =>
              Array.from({ length: level.cols }).map((_, col) => {
                const key = `${col}-${row}`;
                const clicked = clickedCells.includes(key);
                const isTreasure =
                  found && treasure && col === treasure.col && row === treasure.row;
                const isBomb = bombCells.some((bomb) => bomb.col === col && bomb.row === row);

                const showCell = isVisibleCellForLevel(level, row, col);

                if (!showCell) {
                  return (
                    <div
                      key={key}
                      style={{ width: `${responsiveCellSize}px`, height: `${responsiveCellSize}px` }}
                    />
                  );
                }

                const isBossEye =
                  level.secretType === "boss" &&
                  isSkullEyeCell(row, col, level.rows, level.cols);

                const isBossTeeth =
                  level.secretType === "boss" &&
                  isSkullTeethCell(row, col, level.rows, level.cols);

                const isAlienEye =
                  level.secretType === "alien" &&
                  isAlienEyeCell(row, col, level.rows, level.cols);

                const isAceStem =
                  level.secretType === "ace" &&
                  isSpadeStemCell(row, col, level.rows, level.cols);

                const isJackpotCoin =
                  level.secretType === "jackpot" &&
                  isJackpotCoinCell(row, col, level.rows, level.cols);

                const isBanditBar =
                  level.secretType === "bandit" &&
                  isBanditBarCell(row, col, level.rows, level.cols);

                const showLock =
                  currentLevel === 3 &&
                  hasKey &&
                  !giftUnlocked &&
                  !!levelThreeLockCell &&
                  col === levelThreeLockCell.col &&
                  row === levelThreeLockCell.row;

                const showGift =
                  currentLevel === 3 &&
                  giftOpenedThisRun &&
                  !!levelThreeLockCell &&
                  col === levelThreeLockCell.col &&
                  row === levelThreeLockCell.row;

                const showFoundKey =
                  currentLevel === 1 &&
                  !!revealedKeyCell &&
                  !giftUnlocked &&
                  col === revealedKeyCell.col &&
                  row === revealedKeyCell.row;

                return (
                  <button
                    key={key}
                    onClick={() => handleClick({ col, row })}
                    className={`transition ${isMobile ? "text-sm" : "text-lg"} flex items-center justify-center ${
                      gameOver && isBomb
                        ? "bg-red-700 text-white border border-red-300"
                        : isTreasure
                          ? level.secretType === "heart"
                            ? "bg-rose-500 text-white heart-pulse"
                            : level.secretType === "boss"
                              ? "bg-red-600 text-white boss-pulse border border-red-300"
                              : level.secretType === "alien"
                                ? "bg-lime-400 text-black alien-pulse border border-lime-200"
                                : level.secretType === "ace"
                                  ? "bg-white text-black ace-pulse border border-zinc-200"
                                  : level.secretType === "jackpot"
                                    ? "bg-yellow-300 text-black treasure-pulse border border-yellow-100"
                                    : level.secretType === "bandit"
                                      ? "bg-white text-black treasure-pulse border border-zinc-300"
                                      : "bg-amber-400 text-black treasure-pulse"
                          : clicked
                            ? level.secretType === "heart"
                              ? "bg-rose-700"
                              : level.secretType === "boss"
                                ? "bg-red-900 border border-red-700"
                                : level.secretType === "alien"
                                  ? "bg-green-900 border border-green-700"
                                  : level.secretType === "ace"
                                    ? "bg-zinc-700 border border-zinc-500"
                                    : level.secretType === "jackpot"
                                      ? "bg-yellow-800/80 border border-yellow-600"
                                      : level.secretType === "bandit"
                                        ? "bg-zinc-700 border border-white/20"
                                        : "bg-sky-700"
                            : level.secretType === "heart"
                              ? "bg-rose-900 hover:bg-rose-800"
                              : level.secretType === "boss"
                                ? isBossEye
                                  ? `bg-zinc-950 hover:bg-zinc-900 border ${
                                      clicks >= 3 ? "border-red-500/90 bg-red-950/25" : "border-red-700/70"
                                    } boss-eye`
                                  : isBossTeeth
                                    ? `bg-zinc-900 hover:bg-zinc-800 border border-red-900/80 ${
                                        lostBoss ? "boss-teeth" : ""
                                      }`
                                    : "bg-zinc-900 hover:bg-zinc-800 border border-red-950/70"
                                : level.secretType === "alien"
                                  ? isAlienEye
                                    ? "bg-zinc-950 hover:bg-zinc-900 border border-lime-300/70 alien-glow"
                                    : "bg-lime-600/85 hover:bg-lime-500/85 border border-lime-300/30"
                                  : level.secretType === "ace"
                                    ? isAceStem
                                      ? "bg-zinc-800 hover:bg-zinc-700 border border-white/20"
                                      : "bg-zinc-900 hover:bg-zinc-800 border border-white/10"
                                    : level.secretType === "jackpot"
                                      ? isJackpotCoin
                                        ? "bg-yellow-500/90 hover:bg-yellow-400 border border-yellow-100"
                                        : "bg-amber-700/85 hover:bg-amber-600 border border-yellow-300/30"
                                      : level.secretType === "bandit"
                                        ? isBanditBar
                                          ? "bg-zinc-950 hover:bg-zinc-900 border border-zinc-500"
                                          : row % 2 === 0
                                            ? "bg-white/90 text-black hover:bg-white border border-zinc-300"
                                            : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-600"
                                        : "bg-zinc-700 hover:bg-zinc-600 rounded-lg"
                    }`}
                    style={{
                      width: `${responsiveCellSize}px`,
                      height: `${responsiveCellSize}px`,
                      borderRadius: level.isSecret ? "999px" : "10px",
                    }}
                  >
                    {gameOver && isBomb ? (
                      "💣"
                    ) : isTreasure ? (
                      <span className={`treasure-pop ${isMobile ? "text-lg" : "text-2xl"}`}>
                        {level.secretType === "heart"
                          ? "❤️"
                          : level.secretType === "boss"
                            ? "💀"
                            : level.secretType === "alien"
                              ? "👽"
                              : level.secretType === "ace"
                                ? "♠"
                                : level.secretType === "jackpot"
                                  ? "🎰"
                                  : level.secretType === "bandit"
                                    ? "🎖️"
                                    : "💎"}
                      </span>
                    ) : showGift ? (
                      "🎁"
                    ) : showLock ? (
                      "🔒"
                    ) : showFoundKey ? (
                      "🔑"
                    ) : clicked ? (
                      "•"
                    ) : (
                      ""
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={resetGame}
            className={`bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold transition ${
              isMobile ? "px-4 py-2 text-sm rounded-lg" : "px-5 py-3 rounded-xl"
            }`}
          >
            Resetar partida
          </button>

          {canShare && (
            <button
              onClick={handleShare}
              className={`bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold transition ${
                isMobile ? "px-4 py-2 text-sm rounded-lg" : "px-5 py-3 rounded-xl"
              }`}
            >
              Compartilhar resultado
            </button>
          )}

          {!finalCelebration && found && !mainGameFinished && !gameFinished && currentLevel < 3 && (
            <button
              onClick={goToNextLevel}
              className={`bg-amber-400 hover:bg-amber-300 text-black font-semibold transition ${
                isMobile ? "px-4 py-2 text-sm rounded-lg" : "px-5 py-3 rounded-xl"
              }`}
            >
              Ir para o próximo nível
            </button>
          )}
        </div>

        {!finalCelebration && heartSecretUnlocked && mainGameFinished && currentLevel !== 4 && (
          <button
            onClick={() => setCurrentLevel(4)}
            className={`bg-rose-500 hover:bg-rose-400 text-white font-semibold transition ${
              isMobile ? "px-4 py-2 text-sm rounded-lg" : "px-5 py-3 rounded-xl"
            }`}
          >
            Jogar fase secreta
          </button>
        )}

        {!finalCelebration && bossSecretUnlocked && mainGameFinished && currentLevel !== 5 && (
          <button
            onClick={() => setCurrentLevel(5)}
            className={`bg-red-600 hover:bg-red-500 text-white font-semibold transition ${
              isMobile ? "px-4 py-2 text-sm rounded-lg" : "px-5 py-3 rounded-xl"
            }`}
          >
            Enfrentar FINAL BOSS
          </button>
        )}

        {!finalCelebration && alienSecretUnlocked && mainGameFinished && currentLevel !== 6 && (
          <button
            onClick={() => setCurrentLevel(6)}
            className={`bg-green-600 hover:bg-green-500 text-white font-semibold transition ${
              isMobile ? "px-4 py-2 text-sm rounded-lg" : "px-5 py-3 rounded-xl"
            }`}
          >
            Entrar na AREA 51
          </button>
        )}

        {!finalCelebration && aceSecretUnlocked && mainGameFinished && currentLevel !== 7 && (
          <button
            onClick={() => setCurrentLevel(7)}
            className={`bg-white hover:bg-zinc-200 text-black font-semibold transition ${
              isMobile ? "px-4 py-2 text-sm rounded-lg" : "px-5 py-3 rounded-xl"
            }`}
          >
            Virar a carta ACE
          </button>
        )}

        {!finalCelebration && trollMode && (
          <p className="text-amber-300 text-xs sm:text-sm">
            Modo troll ativo: as dicas estão invertidas. CORRA!!!
          </p>
        )}

        {!finalCelebration && found && !mainGameFinished && !gameFinished && !level.isSecret && (
          <p className="text-green-400 text-lg sm:text-xl font-semibold">
            Você venceu o {level.name}!
          </p>
        )}

        {!finalCelebration && gameOver && (
          <p className="text-red-400 text-lg sm:text-xl font-semibold">
            Você clicou em uma bomba.
          </p>
        )}

        {!finalCelebration &&
          !found &&
          clicks >= MAX_CLICKS &&
          !lostBoss &&
          !lostAlien &&
          !lostAce &&
          !sleepMode &&
          !gameOver && (
            <p className="text-red-400 text-lg sm:text-xl font-semibold">
              Suas tentativas acabaram.
            </p>
          )}

        {shareMessage && <p className="text-xs sm:text-sm text-zinc-300">{shareMessage}</p>}

        <div className="w-full max-w-5xl flex items-end justify-between gap-3">
          <div
            className={`rounded-xl border border-zinc-700 bg-zinc-900/80 flex items-center justify-start gap-2 flex-wrap ${
              isMobile ? "min-h-[34px] px-2 py-1 text-xl min-w-[64px]" : "min-h-[40px] min-w-[72px] px-3 py-2 text-2xl"
            }`}
          >
            {hasKey && !giftUnlocked && <span title="Chave">🔑</span>}

            {hasDie && !dieUsed && (
              <button
                onClick={handleRollDie}
                className="hover:scale-110 transition"
                title="Rolar dado"
              >
                🎲
              </button>
            )}

            {foundHintCards.map((id, index) => (
              <button
                key={`${id}-${index}`}
                onClick={() => handleHintCardClick(id)}
                className="hover:scale-110 transition"
                title="Ler dica"
              >
                {HINT_CARD_EMOJI[id]}
              </button>
            ))}
          </div>

          <div
            className={`rounded-xl border border-zinc-700 bg-zinc-900/80 flex items-center justify-end gap-2 ${
              isMobile ? "min-h-[34px] px-2 py-1 text-xl min-w-[64px]" : "min-h-[40px] px-3 py-2 text-2xl min-w-[72px]"
            }`}
          >
            {collectedRewards.map((reward) => (
              <span key={reward.id}>{reward.emoji}</span>
            ))}
          </div>
        </div>
      </div>

      {!finalCelebration && (
        <button
          onClick={() => setShowRankingModal(true)}
          className={`fixed left-1/2 -translate-x-1/2 z-40 rounded-full border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 flex items-center justify-center transition shadow-lg ${
            isMobile ? "bottom-9 w-10 h-10 text-lg" : "bottom-10 w-11 h-11 text-xl"
          }`}
          title="Abrir ranking"
          aria-label="Abrir ranking"
        >
          🏆
        </button>
      )}

      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4">
        <button
          onClick={() => setShowInstructions(true)}
          className="text-[10px] sm:text-xs text-zinc-500/70 hover:text-zinc-300 transition tracking-[0.18em] uppercase"
        >
          GUIA
        </button>

        <a
          href={HELP_DEV_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] sm:text-xs text-zinc-500/70 hover:text-zinc-300 transition tracking-[0.18em] uppercase"
        >
          HELP the DEV
        </a>
      </div>
    </main>
  );
}