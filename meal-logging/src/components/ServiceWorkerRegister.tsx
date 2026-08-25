"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/base-path";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(withBasePath("/sw.js")).catch(() => {
      // Installability still works without a worker in many browsers.
    });
  }, []);

  return null;
}
