// Prerender (renderizado del lado del servidor en el build):
// toma dist/index.html del build del cliente, inserta el HTML que genera React
// en el servidor y lo deja listo para que Cloudflare lo sirva tal cual.
import { readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const ssrDir = resolve(root, "dist-ssr");

const { render } = await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href);
const appHtml = render();

const templatePath = resolve(dist, "index.html");
const template = await readFile(templatePath, "utf8");
if (!template.includes("<!--app-html-->")) throw new Error("Falta <!--app-html--> en index.html");
await writeFile(templatePath, template.replace("<!--app-html-->", appHtml));
await rm(ssrDir, { recursive: true, force: true });

console.log(`prerender: index.html con ${(appHtml.length / 1024).toFixed(1)} KB de HTML renderizado`);
