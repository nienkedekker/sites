import type { ElementType, ReactNode } from "react";
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
    <Anchor href={href} className="tag whitespace-nowrap" {...externalProps(href)}>
      {children}
      {arrow && <span aria-hidden="true">↗</span>}
    </Anchor>
  );
}
