import { DataExport } from "@/components/features/data-export";
import { getCurrentYear } from "@/utils/formatters/date";
import { PageHeader } from "@/components/ui/page-header";

export default async function SettingsPage() {
  const currentYear = getCurrentYear();

  return (
    <div className="space-y-4">
      <PageHeader>Settings</PageHeader>
      <DataExport currentYear={currentYear} />
    </div>
  );
}
