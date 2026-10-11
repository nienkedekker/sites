"use client";

import { useState } from "react";
import Image from "next/image";
import { TYPE_NAMES } from "@/utils/constants/app";
import { cn } from "@/utils/ui";
import type { ValidItemType } from "@/types/shared";

const SIZE = {
  large: "h-[130px] w-[90px]",
  small: "h-[60px] w-[44px]",
};

// "The Hobbit" files under H
const initial = (title: string) =>
  title
    .trim()
    .replace(/^the\s+/i, "")
    .charAt(0)
    .toUpperCase();

export function Cover({
  src,
  title,
  type,
  size = "large",
  sizes,
  className,
}: {
  src?: string | null;
  title: string;
  type: ValidItemType;
  size?: "large" | "small";
  sizes?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const box = cn(
    "relative shrink-0 overflow-hidden border",
    className ?? SIZE[size],
  );

  if (src && failed !== src) {
    return (
      <div className={cn(box, "border-line bg-panel-2")}>
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes ?? (size === "large" ? "90px" : "44px")}
          onError={() => setFailed(src)}
          className="object-cover"
        />
      </div>
    );
  }

  if (size === "small") {
    return (
      <div
        className={cn(
          box,
          "flex items-center justify-center border-rule bg-line font-display text-2xl text-ink",
        )}
        aria-hidden="true"
      >
        {initial(title)}
      </div>
    );
  }

  return (
    <div
      className={cn(box, "flex flex-col gap-2 border-rule bg-line p-2")}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase leading-none tracking-[0.06em] text-ink-soft">
          {TYPE_NAMES[type].one}
        </span>
        <span className="size-1.5 bg-accent" />
      </div>
      <p className="min-h-0 flex-1 overflow-hidden text-balance wrap-break-word font-display text-[15px] leading-[1.1] text-ink">
        {title}
      </p>
    </div>
  );
}
