import { Suspense } from "react";
import PageHeader from "@nienke/ui/page-header";
import CreateItemForm from "@/components/forms/create-item-form";
import { LastLogged } from "@/components/features/lists/last-logged";

export default async function CreatePage() {
  return (
    <>
      <PageHeader intro="Log a book, a movie or a season of TV.">
        Add new item
      </PageHeader>

      <div className="grid gap-x-16 lg:grid-cols-[minmax(0,42rem)_1fr]">
        <CreateItemForm />
        <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
          <Suspense fallback={null}>
            <LastLogged limit={8} />
          </Suspense>
        </aside>
      </div>
    </>
  );
}
