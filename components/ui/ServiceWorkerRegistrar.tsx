"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on first mount.
 * This is a renderless client component — it outputs nothing to the DOM.
 * Placed in the root layout so it runs once on app boot.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Check for updates when the user navigates back to the app
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is cached and ready — the user will get it on next visit.
              console.info("[SW] New version available — will activate on next visit.");
            }
          });
        });
      })
      .catch((err) => console.error("[SW] Registration failed:", err));
  }, []);

  return null;
}
