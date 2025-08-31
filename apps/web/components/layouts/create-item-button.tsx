"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import IsLoggedIn from "@/components/is-logged-in";

export function CreateButton() {
  return (
    <IsLoggedIn>
      <Button asChild variant="link">
        <Link href="/create">Create</Link>
      </Button>
    </IsLoggedIn>
  );
}
