import fs from "node:fs";
import path from "node:path";
import type { FileRecord } from "./types.js";

function walkJsonlFiles(dirPath: string, output: FileRecord[]): void {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  for (const dirent of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, dirent.name);
    if (dirent.isDirectory()) {
      walkJsonlFiles(fullPath, output);
      continue;
    }

    if (!dirent.isFile() || !fullPath.endsWith(".jsonl")) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    output.push({
      path: fullPath,
      mtimeMs: Math.floor(stat.mtimeMs),
      size: stat.size
    });
  }
}

export function listSessionFiles(codexHome: string): FileRecord[] {
  const files: FileRecord[] = [];
  walkJsonlFiles(path.join(codexHome, "sessions"), files);
  walkJsonlFiles(path.join(codexHome, "archived_sessions"), files);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function getTuiLogPath(codexHome: string): string {
  return path.join(codexHome, "log", "codex-tui.log");
}
