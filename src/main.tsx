import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { CMGProvider } from "./cmgcontext";
import Home from "./pages/home";
import { debug, setDebugMode } from "./utils/debug";
// import { initializeSharedPool } from "sfcomponents/samplepool";

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);
const initialParams = {
  file: urlParams.get('file') || '',
  debug: urlParams.get('debug') || 'none',
  // pool: urlParams.get('pool') || '100000000', // Default 100MB
};

// Enable debug mode if requested
setDebugMode(initialParams.debug);

// Initialize the audio sample shared memory pool BEFORE React renders
// const poolSize = parseInt(initialParams.pool) || 100_000_000;
// initializeSharedPool(poolSize);
debug.info('Application started with parameters:', initialParams);
// console.log(`Audio pool initialized: ${(poolSize / 1_000_000).toFixed(1)}MB`);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <CMGProvider initialParams={initialParams}>
        <Home/>
      </CMGProvider>
    </HelmetProvider>
  </StrictMode>
);
