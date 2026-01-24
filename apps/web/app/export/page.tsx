import { DataExport } from "@/components/features/data-export";
import { getCurrentYear } from "@/utils/formatters/date";
import { PageHeader } from "@/components/ui/page-header";

export default async function SettingsPage() {
  const currentYear = getCurrentYear();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader>Settings</PageHeader>
      <DataExport currentYear={currentYear} />
    </div>
  );
}
