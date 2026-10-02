import Image from "next/image";
import tumblr from "./tumblr.png";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default async function AboutPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader>About</PageHeader>
      {/* Framed like the photo on nienke.dev */}
      <figure className="w-full max-w-[420px] border border-rule shadow-[6px_6px_0_var(--ink)]">
        <Image
          className="block h-auto w-full"
          src={tumblr}
          alt="A screenshot of a Tumblr post by user so-many-ocs, with the text '[on the verge of having a complete breakdown] i need to make some kind of list or perhaps sort things into categories'"
        />
      </figure>
      <div className="prose mt-12">
        <p>
          I (<Link href="https://nienke.dev">Nienke</Link>) like to log what I
          read and watch in a year :) find the source code for this site{" "}
          <Link href="https://github.com/nienkedekker/what.pm">here</Link>.
        </p>
      </div>
    </div>
  );
}
