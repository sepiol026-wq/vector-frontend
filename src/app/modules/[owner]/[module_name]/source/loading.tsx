import { ModuleSourceSkeleton } from "./ModuleSourceSkeleton";

export default function ModuleSourceLoading() {
  return (
    <main className="source-shell">
      <ModuleSourceSkeleton />
      <style>{`html{background:#050816}body{margin:0;min-height:100vh;background:#050816;color:#f8fbff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}*,::before,::after{box-sizing:border-box}.source-shell{position:relative;width:100%;min-height:100vh;padding:40px clamp(14px,4vw,40px);background:radial-gradient(circle at 20% -10%,rgba(255,255,255,.08),transparent 42%),#000}`}</style>
    </main>
  );
}
