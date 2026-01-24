import CreateItemForm from "@/components/forms/create-item-form";

export default async function CreatePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CreateItemForm />
    </div>
  );
}
