import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App.tsx";
import { setPageLang, type Lang } from "./i18n";

/** Renderiza la landing a HTML en el build (prerender), en el idioma indicado. */
export function render(lang: Lang): string {
  setPageLang(lang);
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
