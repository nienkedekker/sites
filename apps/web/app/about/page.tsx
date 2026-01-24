import Image from "next/image";
import tumblr from "./tumblr.png";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default async function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader>About</PageHeader>
      <Image
        className="rounded-md border"
        src={tumblr}
        style={{
          width: "420px",
          height: "auto",
        }}
        alt="A screenshot of a Tumblr post by user so-many-ocs, with the text '[on the verge of having a complete breakdown] i need to make some kind of list or perhaps sort things into categories'"
      />
      <p className="prose">
        I (
        <Link href="https://nienke.dev" className="underline">
          Nienke
        </Link>
        ) like to log what I read and watch in a year :) find the source code
        for this site{" "}
        <Link
          className="underline"
          href="https://github.com/nienkedekker/what.pm"
        >
          here
        </Link>
        .
      </p>
    </div>
  );
}
