import { Suspense } from "react";
import { LoginPageContent } from "./LoginPageContent";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
