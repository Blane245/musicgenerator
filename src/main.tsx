import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { CMGProvider } from "./cmgcontext";
import Home from "./pages/home";
import { setDebugMode, debug } from "./utils/debug";

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);
const initialParams = {
  file: urlParams.get('file') || undefined,
  debug: urlParams.get('debug') || undefined,
};

// Enable debug mode if requested
setDebugMode(initialParams.debug? initialParams.debug: 'none');
debug.log('Application started with parameters:', initialParams);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <CMGProvider initialParams={initialParams}>
        <Home/>
      </CMGProvider>
    </HelmetProvider>
  </StrictMode>
);
