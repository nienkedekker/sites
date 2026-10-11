import type { ElementType, ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { externalProps, isExternal } from "./external";

interface TagLinkProps {
  href: string;
  children: ReactNode;
  as?: ElementType;
  arrow?: boolean;
}

export default function TagLink({
  href,
  children,
  as: Anchor = "a",
  arrow = isExternal(href),
}: TagLinkProps) {
  return (
    <Anchor
      href={href}
      className="tag whitespace-nowrap"
      {...externalProps(href)}
    >
      {children}
      {arrow && <ArrowUpRight className="size-3" aria-hidden="true" />}
    </Anchor>
  );
}
