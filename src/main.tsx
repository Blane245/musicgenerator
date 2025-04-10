import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CMGProvider } from "./cmgcontext";
import "./index.css";
import Home from "./pages/home";
import Report from "./pages/report";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <CMGProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />}>
              <Route path="/report" element={<Report />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CMGProvider>
    </HelmetProvider>
  </StrictMode>
);
