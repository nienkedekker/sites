import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NanamiStatus from "@/components/features/nanami/status";
import { NanamiHeader, NanamiSkeleton } from "@/components/features/nanami/nav";
import { isOwner, loadReport } from "@/utils/server/nanami";
import { hasNanami } from "@/utils/server/services";

export const metadata: Metadata = {
  title: "nanami",
  robots: { index: false },
};

export default function NanamiPage() {
  if (!hasNanami()) notFound();
  return (
    <>
      <NanamiHeader current="/nanami" />
      <Suspense fallback={<NanamiSkeleton label="Loading nanami's status" />}>
        <Status />
      </Suspense>
    </>
  );
}

async function Status() {
  if (!(await isOwner())) notFound();
  const { report, renderedAt } = await loadReport();
  return <NanamiStatus initial={report} renderedAt={renderedAt} />;
}
