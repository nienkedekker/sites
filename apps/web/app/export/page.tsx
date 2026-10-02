import { DataExport } from "@/components/features/data-export";
import { getCurrentYear } from "@/utils/formatters/date";
import PageHeader from "@nienke/ui/page-header";

export default async function SettingsPage() {
  const currentYear = getCurrentYear();

  return (
    <div className="max-w-2xl">
      <PageHeader intro="Download the whole log, or just this year, as CSV or JSON.">
        Settings
      </PageHeader>
      <DataExport currentYear={currentYear} />
    </div>
  );
}
