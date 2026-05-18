"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: () => void;
      };
    };
  }
}

export function XWidgetsLoader() {
  const pathname = usePathname();

  useEffect(() => {
    window.twttr?.widgets?.load();
  }, [pathname]);

  return null;
}
