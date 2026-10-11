import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NanamiDownloads from "@/components/features/nanami/downloads";
import { NanamiHeader, NanamiSkeleton } from "@/components/features/nanami/nav";
import { isOwner, loadReport } from "@/utils/server/nanami";
import { hasNanami } from "@/utils/server/services";

export const metadata: Metadata = {
  title: "nanami downloads",
  robots: { index: false },
};

export default function NanamiDownloadsPage() {
  if (!hasNanami()) notFound();
  return (
    <>
      <NanamiHeader current="/nanami/downloads" />
      <Suspense fallback={<NanamiSkeleton label="Loading downloads" />}>
        <Downloads />
      </Suspense>
    </>
  );
}

async function Downloads() {
  if (!(await isOwner())) notFound();
  const { report, renderedAt } = await loadReport();
  return <NanamiDownloads initial={report} renderedAt={renderedAt} />;
}
