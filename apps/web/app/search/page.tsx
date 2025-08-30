import SearchForm from "@/components/features/search-form";
import { createClientForServer } from "@/utils/supabase/server";

export default async function SearchPage() {
  const supabase = await createClientForServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SearchForm isLoggedIn={!!user} />
    </>
  );
}
