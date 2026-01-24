import SearchForm from "@/components/features/search/search-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader>Search</PageHeader>
      <SearchForm />
    </div>
  );
}
