import type { AssetType, HealthStatus } from "@/lib/inventory";

export const STATUS_COLOR: Record<HealthStatus, string> = {
  red: "#C23B2A",
  yellow: "#C99212",
  green: "#1F7A4D",
};

export const STATUS_LABEL: Record<HealthStatus, string> = {
  red: "Red",
  yellow: "Yellow",
  green: "Green",
};

export const TYPE_LABEL: Record<AssetType, string> = {
  image: "Image",
  video: "Video",
  lottie: "Lottie",
};

export const TYPE_CODE: Record<AssetType, string> = {
  image: "IMG",
  video: "VID",
  lottie: "LOT",
};

export const TYPE_CODE_LONG: Record<AssetType, string> = {
  image: "IMG · IMAGE",
  video: "VID · VIDEO",
  lottie: "LOT · LOTTIE",
};

interface Swatch {
  bg: string;
  fg: string;
  light: boolean;
  gradient: string;
}

const SWATCHES: Record<AssetType, Record<HealthStatus, Swatch[]>> = {
  image: {
    red: [
      tile("#1A3A4A", "#6B8FA3", "linear-gradient(145deg, #1A3A4A 0%, #3D6A7E 55%, #6B8FA3 100%)"),
      tile("#2C3E50", "#8AA0B0", "linear-gradient(155deg, #243044 0%, #3E5160 100%)"),
    ],
    yellow: [
      tile("#4A5D4E", "#C5D6C8", "linear-gradient(150deg, #3A4D40 0%, #6A8570 55%, #8FA892 100%)"),
      tile("#6B5438", "#E4D2B8", "linear-gradient(155deg, #6B5438 0%, #A68455 55%, #C4A574 100%)"),
    ],
    green: [
      tile("#E8EEF2", "#5A6B7A", "linear-gradient(180deg, #E8EEF2 0%, #C5D3DE 100%)", true),
      tile("#D7E4EC", "#5A6B7A", "linear-gradient(180deg, #F4F8FB 0%, #D7E4EC 100%)", true),
      tile("#C9D8C4", "#3E5A48", "linear-gradient(165deg, #E4EEE2 0%, #8FA892 100%)", true),
      tile("#F7FAFC", "#5A6B7A", "linear-gradient(180deg, #F7FAFC 0%, #E6EDF2 100%)", true),
    ],
  },
  video: {
    red: [
      tile("#0B1F33", "#3D5A6E", "linear-gradient(160deg, #0B1F33 0%, #1A3548 40%, #3D5A6E 100%)"),
      tile("#101820", "#4E6570", "linear-gradient(165deg, #101820 0%, #243640 100%)"),
    ],
    yellow: [
      tile("#243830", "#8FB0A0", "linear-gradient(160deg, #1C2E28 0%, #3A4A42 100%)"),
    ],
    green: [
      tile("#D7E4EC", "#5A6B7A", "linear-gradient(180deg, #E8EEF2 0%, #C5D3DE 100%)", true),
    ],
  },
  lottie: {
    red: [
      tile("#15283A", "#6B8FA3", "linear-gradient(160deg, #0B1F33 0%, #1F3A5F 100%)"),
    ],
    yellow: [
      tile("#1F3A5F", "#8FB0C4", "linear-gradient(160deg, #1F3A5F 0%, #3A5F8A 50%, #5A7FA8 100%)"),
    ],
    green: [
      tile("#0B1F33", "#6B8FA3", "linear-gradient(165deg, #0E2744 0%, #1F3A5F 60%, #3A5F8A 100%)"),
    ],
  },
};

function tile(bg: string, fg: string, gradient: string, light = false): Swatch {
  return { bg, fg, gradient, light };
}

export function assetSwatch(
  name: string,
  type: AssetType,
  status: HealthStatus,
): Swatch {
  const options = SWATCHES[type][status];
  return options[hash(name) % options.length] ?? options[0];
}

function hash(value: string): number {
  let total = 0;
  for (const char of value) total = (total * 31 + char.charCodeAt(0)) >>> 0;
  return total;
}
