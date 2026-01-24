import { createClientForServer } from "@/utils/supabase/server";
import UpdateItemForm from "@/components/forms/update-item-form";
import { notFound } from "next/navigation";
import { Params } from "@/types";
import { PageHeader } from "@/components/ui/page-header";

export default async function Page(props: { params: Params }) {
  const params = await props.params;
  const id = params.id;

  const supabase = await createClientForServer();
  const { data: item, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (!item || error) {
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader>Update item</PageHeader>
      <UpdateItemForm item={item} />
    </div>
  );
}
