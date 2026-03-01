import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

try {
  const changes = execSync("git status --porcelain", { encoding: "utf8" }).trim();
  if (!changes) {
    console.log("No changes detected. Nothing to sync.");
    process.exit(0);
  }

  run("git add .");
  run('git commit -m "auto-update"');
  run("git push");
  console.log("Sync completed.");
} catch (error) {
  console.error("Sync failed:", error?.message ?? error);
  process.exit(1);
}
