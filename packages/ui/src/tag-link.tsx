import type { ElementType, ReactNode } from "react";
import { externalProps } from "./external";

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
  arrow = true,
}: TagLinkProps) {
  return (
    <Anchor href={href} className="tag whitespace-nowrap" {...externalProps(href)}>
      {children}
      {arrow && <span aria-hidden="true">↗</span>}
    </Anchor>
  );
}
