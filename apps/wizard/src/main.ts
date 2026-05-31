/**
 * Wizard app entry. Loads Fluid (tokens + icons + the components the wizard
 * chrome uses), then defines the `<wizard-app>` root element declared in
 * `index.html`. Step components register themselves as side effects.
 */
import "./register-fluid.js";
import "./wizard-app.js";
import { initPersistence } from "./persistence.js";

// Restore any saved/linked state, then keep it mirrored to URL + localStorage.
initPersistence();
