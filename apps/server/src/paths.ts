import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function getDefaultCodexHome(): string {
  return process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
}

export function getRepoRoot(): string {
  return path.resolve(import.meta.dirname, "../../..");
}

export function getCacheDir(): string {
  return path.join(getRepoRoot(), ".cache");
}

export function ensureDirSync(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}
