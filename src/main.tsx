import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { CMGProvider } from "./cmgcontext";
import Home from "./pages/home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <CMGProvider>
        <Home/>
      </CMGProvider>
    </HelmetProvider>
  </StrictMode>
);
