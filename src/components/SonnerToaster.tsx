"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-center"
      duration={2000}
      toastOptions={{
        style: {
          background: "#161b22",
          color: "#e6edf3",
          border: "1px solid #30363d",
          borderRadius: 10,
        },
      }}
    />
  );
}
