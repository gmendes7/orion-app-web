import { execSync } from "node:child_process";

const intervalMs = Number(process.env.SYNC_WATCH_INTERVAL_MS ?? 5000);
let isRunning = false;

function hasChanges() {
  const output = execSync("git status --porcelain", { encoding: "utf8" });
  return output.trim().length > 0;
}

function syncOnce() {
  if (isRunning) return;
  isRunning = true;

  try {
    if (!hasChanges()) {
      return;
    }

    execSync("git add .", { stdio: "inherit" });
    execSync('git commit -m "auto-update"', { stdio: "inherit" });
    execSync("git push", { stdio: "inherit" });
    console.log("[sync:watch] Changes synced to remote.");
  } catch (error) {
    console.error("[sync:watch] Sync failed:", error?.message ?? error);
  } finally {
    isRunning = false;
  }
}

console.log(`[sync:watch] Running every ${intervalMs}ms`);
setInterval(syncOnce, intervalMs);
