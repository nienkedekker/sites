import CreateItemForm from "@/components/forms/create-item-form";
import { Message } from "@/components/forms/form-message";

export default async function CreatePage(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return <CreateItemForm message={searchParams} />;
}
