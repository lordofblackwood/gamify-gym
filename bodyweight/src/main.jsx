import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
createRoot(document.getElementById("root")).render(<App />);
const updateWorker = registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new Event("away:offline-ready"));
  },
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent("away:update", { detail: updateWorker }),
    );
  },
});
