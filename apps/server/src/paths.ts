import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface CodexHomeConfig {
  fromEnv: boolean;
  path: string;
}

export function getCodexHomeConfig(): CodexHomeConfig {
  const configured = process.env.CODEX_HOME;
  if (configured) {
    return {
      fromEnv: true,
      path: path.resolve(configured)
    };
  }

  return {
    fromEnv: false,
    path: path.join(os.homedir(), ".codex")
  };
}

export function getDefaultCodexHome(): string {
  return getCodexHomeConfig().path;
}

export function getCacheDir(): string {
  const configured = process.env.AI_WATER_USAGE_CACHE_DIR;
  if (configured) {
    return path.resolve(configured);
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Caches", "ai-water-usage");
  }

  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "ai-water-usage");
  }

  return path.join(process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), ".cache"), "ai-water-usage");
}

export function ensureDirSync(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}
