import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve(process.env.NEXT_DIST_DIR || ".next");
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (/\.(?:js|json|map|html|rsc)$/.test(entry.name)) {
      const source = await readFile(file, "utf8");
      if (/JAVA_ORIGIN|https?:\/\/[^\s"'<>]*\.(?:alibaba-inc|antfin)\.com/.test(source))
        throw new Error(`Private configuration found in public build: ${path.relative(dist, file)}`);
    }
  }
}
await check(path.join(dist, "static"));
await check(path.join(dist, "server"));
console.log("Public bundle verified: private storage is disabled and private configuration is absent.");
