import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, process.env.NEXT_DIST_DIR || ".next");
const bundle = path.join(dist, "standalone");
const manifest = JSON.parse(
  await readFile(path.join(dist, "required-server-files.json"), "utf8"),
);
const prefix = manifest.config.basePath || "";
const origin = "http://127.0.0.1:3103";
const server = spawn(process.execPath, ["server.js"], {
  cwd: bundle,
  // Deliberately do not inherit database credentials or load source .env files.
  env: {
    PATH: process.env.PATH,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: "3103",
    APP_ORIGIN: origin,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", (data) => {
  output += data;
});
server.stderr.on("data", (data) => {
  output += data;
});
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null)
      throw new Error(`Standalone exited: ${output}`);
    try {
      ready = (
        await fetch(`${origin}${prefix}/api/health`, {
          signal: AbortSignal.timeout(1000),
        })
      ).ok;
    } catch {}
    if (ready) break;
    await delay(250);
  }
  assert(ready, `Standalone did not start: ${output}`);
  const get = async (url) => {
    const response = await fetch(`${origin}${url}`, {
      signal: AbortSignal.timeout(10_000),
    });
    assert.equal(response.status, 200, url);
    return response;
  };
  const html = await (await get(`${prefix}/`)).text();
  assert(html.includes(`${prefix}/api/media?`));
  const script = html.match(/<script[^>]+src="([^"]+)"/);
  assert(script, "No hydration script in server HTML");
  await get(script[1].replaceAll("&amp;", "&"));
  await get(`${prefix}/story/mars.webp`);
  for (const slug of ["pelican", "crocodile", "starship"]) {
    await get(`${prefix}/arena/${slug}`);
    await get(`${prefix}/experiments/${slug}`);
  }
  const catalog = JSON.parse(
    await readFile(path.join(root, "data/catalog.json"), "utf8"),
  );
  for (const item of catalog) {
    for (const motion of [0, 1]) {
      const response = await get(
        `${prefix}/api/media?id=${item.id}&motion=${motion}`,
      );
      assert.match(
        response.headers.get("content-type"),
        motion ? /image\/svg\+xml/ : /image\/webp/,
      );
      assert((await response.arrayBuffer()).byteLength > 0);
    }
  }
  console.log(
    `Standalone HTTP checks passed: ${prefix || "/"}, hydration JS, Mars, all experiments and ${catalog.length * 2} media responses. No database accessed.`,
  );
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
}
