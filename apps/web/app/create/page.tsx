import { createClientForServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CreateItemForm from "@/components/forms/create-item-form";
import { Message } from "@/components/forms/form-message";

export default async function CreatePage(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClientForServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <CreateItemForm message={searchParams} />;
}
