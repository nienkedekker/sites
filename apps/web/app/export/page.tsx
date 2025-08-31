import { createClientForServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DataExport } from "@/components/features/data-export";
import { getCurrentYear } from "@/utils/formatters/date";

export default async function SettingsPage() {
  const supabase = await createClientForServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }
  const currentYear = getCurrentYear();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <DataExport currentYear={currentYear} />
      </div>
    </div>
  );
}