// Register Fluid (tokens, themes, icons, component defines) before the app
// renders, then mount React. This is the only Fluid-specific wiring an app needs.
import "./register-fluid";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
