// Prerender (renderizado del lado del servidor en el build), en dos idiomas:
//   dist/index.html      → inglés, en "/"
//   dist/es/index.html   → español, en "/es/"
// Cada página sale con su HTML ya renderizado, sus etiquetas SEO en su idioma y
// los enlaces hreflang que relacionan ambas versiones.
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const ssrDir = resolve(root, "dist-ssr");
const SITE = "https://aresmap.dev";

const { render } = await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href);
const template = await readFile(resolve(dist, "index.html"), "utf8");
if (!template.includes("<!--app-html-->")) throw new Error("Falta <!--app-html--> en index.html");

// Textos del <head> en español (el index.html base está en inglés)
const ES_HEAD = [
  ['<html lang="en">', '<html lang="es">'],
  ["<title>Aresmap · The map for the first step on Mars | Gale Crater</title>", "<title>Aresmap · El mapa para el primer paso en Marte | Cráter Gale</title>"],
  ['content="Aresmap combines seven data layers from Curiosity, MRO and NASA into one view to plan the first human walk in Gale crater, from Bradbury Landing to the boxwork on Mount Sharp. NASA Space Apps Challenge."',
    'content="Aresmap integra siete capas de datos de Curiosity, MRO y la NASA en una sola vista para planear la primera caminata humana en el cráter Gale, de Bradbury Landing a los boxwork de Mount Sharp. NASA Space Apps Challenge."'],
  ['<meta property="og:locale" content="en_US" />', '<meta property="og:locale" content="es_ES" />'],
  ['<meta property="og:locale:alternate" content="es_ES" />', '<meta property="og:locale:alternate" content="en_US" />'],
  ['<meta property="og:title" content="Aresmap · The map for the first step on Mars" />', '<meta property="og:title" content="Aresmap · El mapa para el primer paso en Marte" />'],
  ['<meta property="og:description" content="Seven NASA data layers to plan the first human walk in Gale crater. NASA Space Apps Challenge." />', '<meta property="og:description" content="Siete capas de datos de la NASA para planear la primera caminata humana en el cráter Gale. NASA Space Apps Challenge." />'],
  ['content="Aresmap logo on a dark background with the text: The map for the first step on Mars, Gale crater."', 'content="Logo de Aresmap sobre fondo oscuro con el texto: El mapa para el primer paso en Marte, cráter Gale."'],
  ['<meta name="twitter:title" content="Aresmap · The map for the first step on Mars" />', '<meta name="twitter:title" content="Aresmap · El mapa para el primer paso en Marte" />'],
  ['<meta name="twitter:description" content="Seven NASA data layers to plan the first human walk in Gale crater." />', '<meta name="twitter:description" content="Siete capas de datos de la NASA para planear la primera caminata humana en el cráter Gale." />'],
  ['"description": "Layered map of Gale crater on Mars with data from Curiosity, MRO and NASA to plan an astronaut walk. NASA Space Apps Challenge project."', '"description": "Mapa en capas del cráter Gale en Marte con datos de Curiosity, MRO y la NASA para planear una caminata de astronautas. Proyecto para el NASA Space Apps Challenge."'],
];

function headFor(lang) {
  const isEs = lang === "es";
  const base = isEs ? `${SITE}/es/` : `${SITE}/`;
  let html = template;
  if (isEs) {
    for (const [from, to] of ES_HEAD) {
      if (!html.includes(from)) throw new Error("No encontrado en el <head>: " + from.slice(0, 60));
      html = html.replace(from, to);
    }
  }
  // Canonical y og:url según la página
  html = html.replace(`<link rel="canonical" href="${SITE}/" />`, `<link rel="canonical" href="${base}" />`);
  html = html.replace(`<meta property="og:url" content="${SITE}/" />`, `<meta property="og:url" content="${base}" />`);
  html = html.replace(`"url": "${SITE}/"`, `"url": "${base}"`);
  // Enlaces entre idiomas (hreflang): Google y los demás los usan para mostrar la versión correcta
  const alternates = [
    `<link rel="alternate" hreflang="en" href="${SITE}/" />`,
    `<link rel="alternate" hreflang="es" href="${SITE}/es/" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
  ].join("\n    ");
  html = html.replace(`<link rel="canonical"`, `${alternates}\n    <link rel="canonical"`);
  return html;
}

async function write(lang, relPath) {
  const { render: renderPage } = { render };
  const appHtml = renderPage(lang);
  const html = headFor(lang).replace("<!--app-html-->", appHtml);
  const out = resolve(dist, relPath);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
  console.log(`prerender ${lang}: ${relPath} · ${(appHtml.length / 1024).toFixed(1)} KB de HTML renderizado`);
}

await write("en", "index.html");
await write("es", "es/index.html");
await rm(ssrDir, { recursive: true, force: true });
