import { Suspense } from "react";
import PageHeader from "@nienke/ui/page-header";
import { LastLogged } from "@/components/features/lists/last-logged";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <div className="grid items-center gap-y-12 lg:grid-cols-12 lg:gap-x-16">
      <div className="lg:col-span-7">
        <PageHeader className="mb-0">Sign in</PageHeader>
        <div className="max-w-md">
          <Suspense fallback={null}>
            <LastLogged limit={3} className="mt-12" />
          </Suspense>
        </div>
      </div>

      <div className="lg:col-span-5">
        <Suspense
          fallback={<p className="font-mono text-xs text-ink-soft">Loading…</p>}
        >
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
