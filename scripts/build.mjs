import { spawnSync } from "node:child_process";
import { cp, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const standalone = process.argv.includes("--standalone");
const env = { ...process.env, ODD_INTERNAL_BUILD: "0", ODD_STANDALONE: standalone ? "1" : "0" };
if (Number(process.versions.node.split(".")[0]) < 22)
  throw new Error("Odd Lab requires Node.js 22 or newer.");
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run([path.join(root, "node_modules/next/dist/bin/next"), "build"]);
run(["scripts/check-public-build.mjs"]);
if (standalone) {
  const dist = path.join(root, env.NEXT_DIST_DIR || ".next");
  const dest = path.join(dist, "standalone");
  for (const file of await readdir(dest)) {
    if (file === ".env" || file.startsWith(".env.")) await rm(path.join(dest, file));
  }
  await cp(path.join(root, "public"), path.join(dest, "public"), { recursive: true });
  await cp(path.join(dist, "static"), path.join(dest, env.NEXT_DIST_DIR || ".next", "static"), { recursive: true });
  const catalog = JSON.parse(await readFile(path.join(root, "data/catalog.json"), "utf8"));
  for (const item of catalog) {
    for (const file of [item.file, item.animatedFile].filter(Boolean))
      await readFile(path.join(dest, "data/media", path.basename(file)));
  }
  console.log(`Standalone verified: ${catalog.length} artworks and public assets included.`);
}
