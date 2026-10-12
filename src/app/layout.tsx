import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import Script from "next/script";
import { MiniAppAuth } from "@/components/MiniAppAuth";
import { SiteTitle } from "@/components/SiteTitle";
import { SonnerToaster } from "@/components/SonnerToaster";
import { RouteMotion } from "@/components/RouteMotion";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = cookieStore.get("vector_lang")?.value === "en" ? "en" : "ru";
  const catalog = lang === "en" ? "Catalog" : "Каталог";
  return {
    title: `Vector • ${catalog}`,
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="16x16 24x24 32x32 48x48 64x64 128x128 256x256" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <style>{`*,*::before,*::after{-webkit-tap-highlight-color:transparent}a,button,input,textarea,select{outline:none!important;-webkit-focus-ring-color:transparent}body{margin:0;background:#0a0a0a;color:#fff;min-height:100dvh;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.v-ripple{position:absolute;pointer-events:none;border-radius:50%;transform:scale(0);animation:v-ripple-expand .45s ease-out forwards}@keyframes v-ripple-expand{to{transform:scale(1);opacity:0}}.zskel{background:linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%);background-size:200% 100%;animation:zskel-shimmer 1.6s ease-in-out infinite}@keyframes zskel-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <style>{`
          :root{--button-radius:999px}
          button,[role="button"],.module-actions a,.revision-actions a,.code-actions a,.dev-panel-btn,.tg-login-fallback,.tg-login-loading{border-radius:var(--button-radius)!important}
          .module-card{min-width:0;overflow-wrap:anywhere}
          .module-head>*{min-width:0}
          .search-glass input,.mass-add-search input{min-width:0}
        `}</style>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
        <Suspense fallback={null}>
          <SiteTitle />
          <RouteMotion />
        </Suspense>
        <MiniAppAuth />
        <SonnerToaster />
      </body>
    </html>
  );
}
