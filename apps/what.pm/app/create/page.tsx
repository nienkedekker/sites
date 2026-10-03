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

      <CreateItemForm
        aside={
          <Suspense fallback={null}>
            <LastLogged
              limit={8}
              className="hidden lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:grid lg:grid-rows-subgrid lg:[&>h2]:self-stretch lg:[&>h2]:px-3 lg:[&>h2]:justify-self-start lg:[&>ol]:mt-0 lg:[&>ol]:self-start"
            />
          </Suspense>
        }
      />
    </>
  );
}
