import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initPerf } from "./perf";
import { initLang } from "./i18n";

// Detecta el hardware antes de hidratar: si el equipo es modesto, la página arranca ya en modo rendimiento
initLang(location.pathname);        // idioma según la URL: / en inglés, /es/ en español
initPerf();

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// En producción el HTML ya viene renderizado (prerender): React lo hidrata y toma el control.
// En `pnpm dev` el contenedor llega vacío y se renderiza desde cero.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
